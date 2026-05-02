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
from functools import partial
from pathlib import Path
from typing import Any, AsyncGenerator

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

# ==============================================================================
# 🎯 SYSTEM PROMPT TWEAKING SPACE
# ==============================================================================
# You can tweak and refine the LLM prompt instructions here to improve the
# extraction accuracy, enforce specific JSON schema compliance (like booleans),
# or change the model's tone.
SYSTEM_PROMPT = (
    "You are an expert at extracting structured metadata from machine learning papers. "
    "Extract the requested fields from the paper text provided. "
    "Output ONLY a JSON object — no markdown, no prose, no explanation, just valid JSON. "
    "Important rules: "
    "(1) Omit any field where there is no clear evidence in the text — never invent values. "
    "(2) Boolean fields: MUST be output as raw JSON booleans (true or false), NOT strings (\"true\" or \"false\"). "
    "(3) Array fields: always return a JSON array even for a single value. "
    "(4) Enum fields: use ONLY the exact option strings listed — never paraphrase. "
    "(5) String fields: use a concise factual string extracted from the paper. "
    "(6) Output nothing except the JSON object."
)
# ==============================================================================

def _load_questionnaire() -> dict:
    with open(_QUESTIONNAIRE_PATH, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def _strip_json(raw: str) -> str:
    """Extract a JSON object from raw LLM output, removing markdown fences.
    Also attempts to repair truncated JSON (common with small local models)."""
    # Remove markdown code fences
    m = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", raw)
    if m:
        candidate = m.group(1).strip()
    else:
        start = raw.find("{")
        if start == -1:
            return raw.strip()
        candidate = raw[start:]

    # Try parsing as-is first
    try:
        json.loads(candidate)
        return candidate
    except json.JSONDecodeError:
        pass

    # Attempt to repair truncated JSON
    return _repair_json(candidate)


def _repair_json(s: str) -> str:
    """Best-effort repair of truncated JSON from LLM output.
    Closes unclosed strings, arrays, and objects."""
    # Remove trailing comma if present
    s = s.rstrip()
    if s.endswith(","):
        s = s[:-1]

    # Track what's open
    in_string = False
    escape_next = False
    stack: list[str] = []  # tracks '{' and '['

    for ch in s:
        if escape_next:
            escape_next = False
            continue
        if ch == '\\' and in_string:
            escape_next = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == '{':
            stack.append('{')
        elif ch == '[':
            stack.append('[')
        elif ch == '}' and stack and stack[-1] == '{':
            stack.pop()
        elif ch == ']' and stack and stack[-1] == '[':
            stack.pop()

    # If we're inside a string, close it
    if in_string:
        s += '"'

    # Remove any trailing partial key-value (e.g., truncated mid-value)
    # Try to find the last complete key-value pair
    s = s.rstrip()
    if s.endswith(","):
        s = s[:-1]

    # Close any open brackets/braces
    for bracket in reversed(stack):
        if bracket == '{':
            s += '}'
        elif bracket == '[':
            s += ']'

    return s


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
    
    # ==============================================================================
    # 🎯 SECTION PROMPT TWEAKING SPACE
    # ==============================================================================
    # This is the prompt sent for each individual subsection of the paper.
    # You can tweak how the fields block is requested or the final constraints.
    return (
        f"Paper text:\n---\n{text}\n---\n\n"
        f"From this machine learning paper, extract these fields.\n"
        f"Return a JSON object with ONLY these keys (omit keys with no evidence):\n\n"
        f"{fields_block}\n\n"
        'Return only the JSON object, nothing else:'
    )
    # ==============================================================================


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
    stripped = _strip_json(raw)
    try:
        data = json.loads(stripped)
    except json.JSONDecodeError as exc:
        logger.warning(
            "JSON parse error for %s: %s | stripped: %.500s", section_path, exc, stripped
        )
        return {}

    if not isinstance(data, dict):
        logger.warning("LLM returned non-dict for %s: %s", section_path, type(data).__name__)
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
            logger.info("    ↳ %s/%s = %.120s", section_path, field, str(coerced))
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
                max_tokens=1024,
            )
            content = resp.choices[0].message.content or ""
            logger.info("Raw LLM response for %s (len=%d): %.500s", section_path, len(content), content)
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
) -> AsyncGenerator[dict, None]:
    """
    Main entry point called by main.py.

    llm is either a LLMBackend (new, preferred) or a legacy llama-index LLM object
    (handled via isinstance guard for backward compatibility).

    Yields real-time progress events and eventually a "done" event.
    """
    # Resolve client + model from whatever llm object was passed
    from .llm_adapter import LLMBackend  # local import avoids circular deps
    if isinstance(llm, LLMBackend):
        client, model = llm.client, llm.model
        sleep_between_calls = llm.sleep_between_calls
    else:
        # Legacy llama-index object — re-create proper backend from env
        logger.warning(
            "Unexpected LLM type %s — re-initialising from env.", type(llm).__name__
        )
        from .llm_adapter import get_llm
        backend = get_llm()
        client, model = backend.client, backend.model
        sleep_between_calls = backend.sleep_between_calls

    # 1. Extract text from PDF ---------------------------------------------------
    yield {"type": "info", "msg": "Extracting text from PDF\u2026"}
    text = await _extract_text(pdf_bytes)
    if not text.strip():
        logger.warning("docling returned empty text (doi=%s)", doi)
        yield {"type": "done", "annotations": {}}
        return

    logger.info("Extracted %d chars from PDF (doi=%s)", len(text), doi)

    # 2. Load questionnaire -------------------------------------------------------
    yield {"type": "info", "msg": "Identifying paper sections\u2026"}
    try:
        questionnaire = _load_questionnaire()
    except Exception as exc:
        logger.error("Failed to load dome_questionnaire.yml: %s", exc)
        yield {"type": "done", "annotations": {}}
        return

    # 3. Determine requested top-level sections -----------------------------------
    all_tops = {"publication", "data", "optimization", "model", "evaluation"}
    
    if sections and "all" in sections:
        requested = all_tops
    else:
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
    
    total_subsections = len(subsection_list)

    for i, (section_path, subsection) in enumerate(subsection_list):
        if sleep_between_calls > 0 and i > 0:
            yield {"type": "info", "msg": f"Waiting {sleep_between_calls}s to respect free tier API limits..."}
            await asyncio.sleep(sleep_between_calls)

        text_chunk = _relevant_text(text, section_path)
        prompt = _build_prompt(section_path, subsection, text_chunk, doi)
        if not prompt:
            continue

        pct = 10 + int(85 * (i / max(1, total_subsections)))
        yield {"type": "progress", "pct": pct, "msg": f"Analysing {section_path.replace('/', ' - ')}\u2026"}

        logger.info("  → %s", section_path)
        try:
            raw = await _call_llm(client, model, prompt, section_path)
            parsed = _parse_response(raw, section_path, subsection.get("questions", []), doi)
            annotations.update(parsed)
            logger.info("    ✓ %d fields extracted", len(parsed))
        except Exception as exc:
            logger.error("    ✗ Failed %s: %s", section_path, exc)

    yield {"type": "info", "msg": "Structuring annotations to DOME schema format\u2026"}
    logger.info("Total annotations extracted: %d", len(annotations))
    yield {"type": "done", "annotations": annotations}


# ── Text extraction ────────────────────────────────────────────────────────────

async def _extract_text(pdf_bytes: bytes) -> str:
    """Extract text from PDF bytes using PyMuPDF (fitz). No network calls needed."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, partial(_extract_text_sync, pdf_bytes))


def _extract_text_sync(pdf_bytes: bytes) -> str:
    import fitz  # PyMuPDF — lightweight, self-contained, no OCR model downloads

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        pages = []
        for page in doc:
            pages.append(page.get_text("text"))
        doc.close()
        text = "\n\n".join(pages)
        logger.info("PyMuPDF extracted %d chars from %d pages", len(text), len(pages))
        return text
    except Exception as exc:
        logger.error("PyMuPDF extraction failed: %s", exc)
        return ""
