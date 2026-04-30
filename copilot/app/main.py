"""
DOME Copilot — FastAPI entry point.

POST /process  — accept base64-encoded PDF + optional hints, return DOME field annotations
GET  /health   — liveness probe
"""

import base64
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from .llm_adapter import get_llm
from .inference import run_inference

logger = logging.getLogger("dome_copilot")
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Validate LLM connectivity at startup (non-fatal)
    try:
        llm = get_llm()
        logger.info("LLM adapter ready: %s", llm.__class__.__name__)
    except Exception as exc:  # noqa: BLE001
        logger.warning("LLM adapter init warning at startup: %s", exc)
    yield


app = FastAPI(title="DOME Copilot", version="2.0.0", lifespan=lifespan)


class ProcessRequest(BaseModel):
    pdf_b64: str                         # base64-encoded PDF bytes
    doi: str | None = None
    sections: list[str] | None = None    # e.g. ["data", "optimization"]


class ProcessResponse(BaseModel):
    annotations: dict                    # flat or nested DOME field suggestions
    confidence: dict | None = None       # optional per-field confidence scores


@app.post("/process", response_model=ProcessResponse)
async def process(req: ProcessRequest) -> ProcessResponse:
    try:
        pdf_bytes = base64.b64decode(req.pdf_b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 PDF data")

    if len(pdf_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="PDF exceeds 20 MB limit")

    llm = get_llm()
    result = await run_inference(
        pdf_bytes=pdf_bytes,
        llm=llm,
        doi=req.doi,
        sections=req.sections,
    )
    return ProcessResponse(annotations=result.get("annotations", {}), confidence=result.get("confidence"))


@app.get("/health")
async def health():
    return {"status": "ok"}
