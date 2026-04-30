"""
Inference pipeline — extract text from PDF with docling, then prompt the LLM
to return structured DOME field annotations.
"""

import json
import logging
import re
import tempfile
from pathlib import Path
from typing import Any

from llama_index.core.llms import ChatMessage, MessageRole

logger = logging.getLogger("dome_copilot.inference")

DOME_SECTIONS = ["data", "optimization", "model", "evaluation"]

SYSTEM_PROMPT = (
    "You are a scientific methods expert helping to annotate machine learning papers "
    "using the DOME reporting standard (Data, Optimization, Model, Evaluation). "
    "Given the text of a paper, extract structured metadata for as many DOME fields "
    "as possible. Return ONLY a single valid JSON object — no prose, no markdown fences. "
    "If a field cannot be determined from the text, omit it entirely. Do not invent values."
)

EXTRACTION_PROMPT_TEMPLATE = """\
Paper text (truncated):
---
{text}
---

Extract DOME annotation fields for sections: {sections}.
Return a JSON object grouping fields by section path, e.g.:
{{
  "data": {{"provenance": {{"datasetSource": "UniProt"}}}},
  "optimization": {{"algorithm": {{"algorithmClass": "deep learning"}}}}
}}
Only include fields you can substantiate from the text above."""


def _strip_json_fences(raw: str) -> str:
    """Remove markdown code fences if present and return the inner content."""
    # Try ```json ... ``` or ``` ... ```
    match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", raw)
    if match:
        return match.group(1).strip()
    # Last resort: find first { and last }
    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1:
        return raw[start : end + 1]
    return raw.strip()


async def run_inference(
    pdf_bytes: bytes,
    llm: Any,
    doi: str | None = None,
    sections: list[str] | None = None,
) -> dict:
    target_sections = [s for s in (sections or DOME_SECTIONS) if s in DOME_SECTIONS]
    if not target_sections:
        target_sections = DOME_SECTIONS

    # Extract text with docling
    text = await _extract_text(pdf_bytes)
    if not text:
        logger.warning("docling returned empty text for PDF (doi=%s)", doi)
        return {"annotations": {}, "confidence": None}

    prompt = EXTRACTION_PROMPT_TEMPLATE.format(
        text=text[:12_000],  # keep within typical context window
        sections=", ".join(target_sections),
    )

    # Try up to 2 times in case the LLM returns malformed JSON on first attempt
    last_exc: Exception | None = None
    for attempt in range(2):
        try:
            messages = [
                ChatMessage(role=MessageRole.SYSTEM, content=SYSTEM_PROMPT),
                ChatMessage(role=MessageRole.USER, content=prompt),
            ]
            response = await llm.achat(messages)
            raw = _strip_json_fences(response.message.content)
            annotations = json.loads(raw)
            return {"annotations": annotations}
        except json.JSONDecodeError as exc:
            logger.warning("Attempt %d: LLM returned non-JSON (doi=%s): %s", attempt + 1, doi, exc)
            last_exc = exc
        except Exception as exc:
            logger.error("LLM inference error attempt %d (doi=%s): %s", attempt + 1, doi, exc)
            raise

    logger.error("All attempts failed to parse JSON (doi=%s): %s", doi, last_exc)
    return {"annotations": {}, "confidence": None}


async def _extract_text(pdf_bytes: bytes) -> str:
    """Write PDF to a temp file, run docling, return concatenated text."""
    import asyncio
    from functools import partial

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

