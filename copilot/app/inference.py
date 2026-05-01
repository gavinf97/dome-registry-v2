"""
Inference pipeline — extract text from PDF with docling, run one focused
LLM prompt per questionnaire subsection, return structured DOME annotations.

Processing is SEQUENTIAL (not parallel) because Ollama is single-threaded.
Firing 22 concurrent asyncio.gather tasks causes all of them to silently fail
through the llama-index async wrapper.  Sequential calls with direct openai SDK
are reliable and typically 20–35 s per subsection on Gemma 3 4B.

Each subsection call:
  - targets 2–6 schema fields with a focused prompt
  - gets a 2500-char section-targeted text excerpt (keyword-matched paragraphs)
  - requests at most 400 output tokens (enough for a small JSON, hard cap)
  - uses temperature=0.0 for deterministic JSON output

Output: flat dict with slash-separated keys, e.g.
    {"data/provenance/datasetSource": ["database"],
     "model/output/outputType": ["classification"]}
which the registry editor's applyCopilotAnnotations() already handles.
"""

import asyncio
import json
import logging
import re
import tempfile
from functools import partial
from pathlib import Path
from typing import Any

import yaml

logger = logging.getLogger("dome_copilot.inference")

_QUESTIONNAIRE_PATH = Path(__file__).parent / "dome_questionnaire.yml"

# ── Per-subsection keyword lists for targeted text extraction ─────────────────
# These guide _relevant_text() to pick the most relevant paragraphs.
_SUBSECTION_KEYWORDS: dict[str, list[str]] = {
    "publication": [],
    "data/provenance": [
        "dataset", "data", "samples", "training data", "participants",
        "source", "database", "repository", "collected", "comprised",
    ],
    "data/dataSplits": [
        "train", "test", "split", "validation", "fold", "partition",
        "holdout", "cross-validat", "70%", "80%", "ratio",
    ],
    "data/redundancy": [
        "redundan", "leakage", "independent", "overlapp", "threshold",
        "identity", "non-redundant", "sequence identity", "homolog",
    ],
    "data/availability": [
        "available", "public", "url", "github", "zenodo", "repository",
        "license", "data availab", "supplementary", "deposited",
    ],
    "optimization/algorithm": [
        "algorithm", "method", "architecture", "neural network",
        "random forest", "SVM", "transformer", "gradient boost",
        "approach", "model", "convolutional", "LSTM", "GNN",
    ],
    "optimization/metaPredictions": [
        "ensemble", "meta", "stacking", "combination", "predictor",
        "blending", "bagging", "boosting", "voting",
    ],
    "optimization/encoding": [
        "encoding", "feature", "represent", "embed", "vectoriz",
        "preprocess", "one-hot", "normali", "descriptor", "fingerprint",
    ],
    "optimization/parameters": [
        "parameter", "weight", "layer", "dimension", "hidden unit",
        "1M", "million param", "learnable", "architecture",
    ],
    "optimization/features": [
        "feature", "input", "dimension", "variable", "attribute",
        "descriptor", "selection", "number of feature",
    ],
    "optimization/fitting": [
        "overfit", "underfit", "regulariz", "dropout", "early stopping",
        "capacity", "complexity", "learning curve",
    ],
    "optimization/regularization": [
        "regulariz", "dropout", "L1", "L2", "weight decay",
        "batch norm", "augment", "label smooth",
    ],
    "optimization/configAvailability": [
        "config", "checkpoint", "pretrained", "model file",
        "hyperparameter", "code", "github", "reproducib",
    ],
    "model/interpretability": [
        "interpret", "explainab", "XAI", "attention", "SHAP", "LIME",
        "feature importance", "saliency", "transparent", "black box",
    ],
    "model/output": [
        "predict", "output", "class", "label", "target", "regress",
        "generat", "classification", "task", "output type",
    ],
    "model/execution": [
        "train time", "inference time", "GPU", "CPU", "hardware",
        "speed", "second", "hour", "A100", "V100", "TPU", "energy",
    ],
    "model/softwareAvailability": [
        "code", "software", "github", "github.com", "available",
        "gitlab", "tool", "server", "web server", "docker", "pip install",
    ],
    "evaluation/method": [
        "cross-validat", "holdout", "k-fold", "leave-one-out",
        "external", "evaluat", "validation set", "independent test",
    ],
    "evaluation/performanceMeasures": [
        "accuracy", "AUC", "ROC", "F1", "precision", "recall",
        "RMSE", "R^2", "R2", "MCC", "metric", "performance",
    ],
    "evaluation/comparison": [
        "compared", "baseline", "state-of-the-art", "benchmark",
        "outperform", "versus", "competitive", "comparison",
    ],
    "evaluation/confidence": [
        "confidence interval", "p-value", "p<", "p =", "standard deviation",
        "std", "\u00b1", "significant", "bootstrap", "Wilcoxon", "95% CI",
    ],
    "evaluation/evaluationAvailability": [
        "result", "output", "available", "github", "supplement",
        "raw", "prediction file", "log", "code availab",
    ],
}

SYSTEM_PROMPT = (
    "You are an expert at extracting structured metadata from machine learning papers. "
    "Extract the requested fields from the paper text provided. "
    "Output ONLY a JSON object \u2014 no markdown, no prose, no explanation, just valid JSON. "
    "Important rules: "
    "(1) Omit any field where there is no clear evidence in the text \u2014 never invent values. "
    "(2) Boolean fields: use JSON true or false (not strings). "
    "(3) Array fields: always return a JSON array even for a single value. "
    "(4) Enum fields: use ONLY the exact option strings listed \u2014 never paraphrase. "
    "(5) String fields: use a concise factual string extracted from the paper. "
    "(6) Output nothing except the JSON object."
)


def _load_questionnaire() -> dict:
    with open(_QUESTIONNAIRE_PATH, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def _strip_json(raw: str) -> str:
    """Extract a JSON object from raw LLM output, removing markdown fences."""
    m = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", raw)
    if m:
        return m.group(1).strip()
    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1:
        return raw[start:end + 1]
    return raw.strip()


def _relevant_text(full_text: str, section_path: str, max_chars: int = 2500) -> str:
    """
    Return a targeted text chunk for a given subsection path.
    Always includes the first 700 chars (title/abstract), then finds
    the most keyword-relevant paragraphs from the rest of the document.
    Falls back to tail of document when no keyword paragraphs match.
    """
    head = full_text[:700]
    remainder = full_text[700:]

    keywords = _SUBSECTION_KEYWORDS.get(section_path, [])
    budget = max_chars - len(head)

    if not keywords or not remainder:
        return full_text[:max_chars]

    paragraphs = re.split(r"\n{2,}", remainder)

    scored: list[tuple[int, str]] = []
    for para in paragraphs:
        lower_para = para.lower()
        score = sum(1 for kw in keywords if kw.lower() in lower_para)
        if score > 0:
            scored.append((score, para))

    scored.sort(key=lambda x: -x[0])

    body = ""
    for _, para in scored[:8]:
        candidate = para + "\n\n"
        if len(body) + len(candidate) <= budget:
            body += candidate

    if not body:
        # Fallback: tail of document (results/conclusions usually there)
        body = full_text[-budget:] if len(full_text) > max_chars else remainder[:budget]

    return head + body


def _build_prompt(
    section_path: str,
    subsection: dict,
    text: str,
    doi: str | None,
) -> str:
    """Build a focused extraction prompt for one questionnaire subsection."""
    skip_ids = set() if doi else {"doi", "pmid", "pmcid"}
    questions = [q for q in subsection.get("questions", []) if q["field"] not in skip_ids]
    if not questions:
        return ""

    field_lines = []
    for q in questions:
        field = q["field"]
        desc = q["question"]
        extras = []
        if q.get("enum_values"):
            extras.append(f"ONLY these exact values: {q['enum_values']}")
        ftype = q.get("type", "string")
        if ftype == "array":
            extras.append("JSON array")
        elif ftype == "boolean_or_string":
            extras.append("true/false or descriptive string")
        suffix = f"  [{', '.join(extras)}]" if extras else ""
        field_lines.append(f'  "{field}": {desc}{suffix}')

    fields_block = "\n".join(field_lines)
    return (
        f"Paper text:\n---\n{text}\n---\n\n"
        f"From this machine learning paper, extract these fields.\n"
        f"Return a JSON object with ONLY these keys (omit keys with no evidence):\n\n"
        f"{fields_block}\n\n"
        'Return only the JSON object, nothing else:'
    )


def _coerce(value: Any, expected_type: str) -> Any:
    """Best-effort value coercion to match schema types."""
    if value is None:
        return None
    if expected_type == "boolean_or_string":
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            lower = value.lower().strip()
            if lower in ("true", "yes"):
                return True
            if lower in ("false", "no"):
                return False
        return value
    if expected_type == "array":
        if isinstance(value, list):
            return [v for v in value if v is not None] or None
        return [str(value)]
    return value


def _parse_response(
    raw: str,
    section_path: str,
    questions: list,
    doi: str | None,
) -> dict:
    """Parse LLM JSON output → flat slash-keyed dict."""
    try:
        data = json.loads(_strip_json(raw))
    except json.JSONDecodeError as exc:
        logger.warning(
            "JSON parse error for %s: %s | raw: %.300s", section_path, exc, raw
        )
        return {}

    if not isinstance(data, dict):
        return {}

    skip_ids = set() if doi else {"doi", "pmid", "pmcid"}
    type_map = {q["field"]: q.get("type", "string") for q in questions}

    result = {}
    for field, value in data.items():
        if field in skip_ids:
            continue
        if value is None or value == "" or value == []:
            continue
        coerced = _coerce(value, type_map.get(field, "string"))
        if coerced is not None:
            result[f"{section_path}/{field}"] = coerced
    return result


async def _call_llm(
    client,
    model: str,
    prompt: str,
    section_path: str,
    max_retries: int = 2,
) -> str:
    """Single LLM call with retries. Returns raw text content."""
    last_exc: Exception | None = None
    for attempt in range(max_retries):
        try:
            resp = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.0,
                max_tokens=400,
            )
            content = resp.choices[0].message.content or ""
            logger.debug("Raw LLM response for %s: %.400s", section_path, content)
            return content
        except Exception as exc:
            logger.warning(
                "LLM attempt %d/%d failed for %s: %s",
                attempt + 1, max_retries, section_path, exc,
            )
            last_exc = exc
    raise RuntimeError(
        f"All {max_retries} LLM attempts failed for {section_path}"
    ) from last_exc


async def run_inference(
    pdf_bytes: bytes,
    llm: Any,
    doi: str | None = None,
    sections: list[str] | None = None,
) -> dict:
    """
    Main entry point called by main.py.

    llm is either a LLMBackend (new, preferred) or a legacy llama-index LLM object
    (handled via isinstance guard for backward compatibility).

    Returns {"annotations": {flat_slash_keyed_dict}}.
    """
    # Resolve client + model from whatever llm object was passed
    from .llm_adapter import LLMBackend  # local import avoids circular deps
    if isinstance(llm, LLMBackend):
        client, model = llm.client, llm.model
    else:
        # Legacy llama-index object — re-create proper backend from env
        logger.warning(
            "Unexpected LLM type %s — re-initialising from env.", type(llm).__name__
        )
        from .llm_adapter import get_llm
        backend = get_llm()
        client, model = backend.client, backend.model

    # 1. Extract text from PDF ---------------------------------------------------
    text = await _extract_text(pdf_bytes)
    if not text.strip():
        logger.warning("docling returned empty text (doi=%s)", doi)
        return {"annotations": {}}

    logger.info("Extracted %d chars from PDF (doi=%s)", len(text), doi)

    # 2. Load questionnaire -------------------------------------------------------
    try:
        questionnaire = _load_questionnaire()
    except Exception as exc:
        logger.error("Failed to load dome_questionnaire.yml: %s", exc)
        return {"annotations": {}}

    # 3. Determine requested top-level sections -----------------------------------
    all_tops = {"publication", "data", "optimization", "model", "evaluation"}
    requested = set(sections) if sections else all_tops

    subsection_list = [
        (sp, sub)
        for sp, sub in questionnaire.items()
        if sp.split("/")[0] in requested and sub.get("questions")
    ]
    logger.info(
        "Processing %d subsections SEQUENTIALLY for model=%s", len(subsection_list), model
    )

    # 4. SEQUENTIAL processing ---------------------------------------------------
    # asyncio.gather (parallel) causes ALL calls to fail silently with Ollama
    # because the llama-index Ollama adapter's async wrapper spawns OS threads
    # and 22 simultaneous threads exhaust the connection pool.
    # Sequential processing with direct openai SDK is reliable.
    annotations: dict = {}

    for section_path, subsection in subsection_list:
        text_chunk = _relevant_text(text, section_path)
        prompt = _build_prompt(section_path, subsection, text_chunk, doi)
        if not prompt:
            continue

        logger.info("  → %s", section_path)
        try:
            raw = await _call_llm(client, model, prompt, section_path)
            parsed = _parse_response(raw, section_path, subsection.get("questions", []), doi)
            annotations.update(parsed)
            logger.info("    ✓ %d fields extracted", len(parsed))
        except Exception as exc:
            logger.error("    ✗ Failed %s: %s", section_path, exc)

    logger.info("Total annotations extracted: %d", len(annotations))
    return {"annotations": annotations}


# ── Text extraction ────────────────────────────────────────────────────────────

async def _extract_text(pdf_bytes: bytes) -> str:
    """Write PDF to a temp file, run docling, return plain text."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, partial(_extract_text_sync, pdf_bytes))


def _extract_text_sync(pdf_bytes: bytes) -> str:
    from docling.document_converter import DocumentConverter  # lazy import

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(pdf_bytes)
        tmp_path = Path(tmp.name)

    try:
        converter = DocumentConverter()
        result = converter.convert(str(tmp_path))
        return result.document.export_to_text()
    except Exception as exc:
        logger.error("docling extraction failed: %s", exc)
        return ""
    finally:
        tmp_path.unlink(missing_ok=True)
