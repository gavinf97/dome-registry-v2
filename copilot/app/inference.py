"""
Inference pipeline — extract text from PDF with docling, then prompt the LLM
to return structured DOME field annotations.
"""

import json
import logging
import tempfile
from pathlib import Path
from typing import Any

from docling.document_converter import DocumentConverter

logger = logging.getLogger("dome_copilot.inference")

DOME_SECTIONS = ["data", "optimization", "model", "evaluation"]

SYSTEM_PROMPT = """You are a scientific methods expert helping to annotate machine learning papers
using the DOME reporting standard. Given the text of a paper, extract structured metadata for as
many DOME fields as possible. Return ONLY valid JSON matching the DOME schema structure.
If a field cannot be determined from the text, omit it. Do not invent values."""

EXTRACTION_PROMPT_TEMPLATE = """Paper text (truncated to relevant content):
---
{text}
---

Extract DOME annotation fields for the following sections: {sections}.
Return a JSON object with fields grouped by section (data, optimization, model, evaluation).
Only include fields you can substantiate from the paper text."""


async def run_inference(
    pdf_bytes: bytes,
    llm: Any,
    doi: str | None = None,
    sections: list[str] | None = None,
) -> dict:
    target_sections = sections or DOME_SECTIONS

    # Extract text with docling
    text = _extract_text(pdf_bytes)
    if not text:
        logger.warning("docling returned empty text for PDF (doi=%s)", doi)
        return {"annotations": {}, "confidence": None}

    prompt = EXTRACTION_PROMPT_TEMPLATE.format(
        text=text[:12000],  # keep within typical context window
        sections=", ".join(target_sections),
    )

    try:
        response = await llm.acomplete(prompt, formatted=True)
        raw = response.text.strip()

        # Isolate JSON block if wrapped in markdown fences
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]

        annotations = json.loads(raw)
    except json.JSONDecodeError:
        logger.error("LLM returned non-JSON response; doi=%s", doi)
        return {"annotations": {}, "confidence": None}
    except Exception as exc:
        logger.error("LLM inference error (doi=%s): %s", doi, exc)
        raise

    return {"annotations": annotations}


def _extract_text(pdf_bytes: bytes) -> str:
    """Write PDF to a temp file, run docling, return concatenated text."""
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
