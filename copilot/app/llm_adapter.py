"""
LLM adapter — returns an LLMBackend wrapping an AsyncOpenAI client + model name.

Uses the openai SDK directly rather than llama-index to avoid reliability issues
with the llama-index Ollama adapter's async layer (which internally spawns OS
threads via asyncio.to_thread, causing failures when called concurrently).

  LLM_MODE=local  → Ollama at OLLAMA_BASE_URL/v1 using OLLAMA_MODEL (default: gemma3:4b)
  LLM_MODE=api    → Any OpenAI-compatible endpoint via LLM_ENDPOINT + OPENAI_API_KEY
"""

import os
from dataclasses import dataclass

from openai import AsyncOpenAI


@dataclass
class LLMBackend:
    """Thin wrapper around an AsyncOpenAI client + model name."""
    client: AsyncOpenAI
    model: str


def get_llm(api_key: str | None = None) -> LLMBackend:
    """Create an LLMBackend from environment variables or provided API key."""
    timeout = float(os.getenv("LLM_TIMEOUT_MS", "120000")) / 1000.0

    if api_key:
        client = AsyncOpenAI(
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            api_key=api_key,
            timeout=timeout,
        )
        return LLMBackend(client=client, model="gemini-2.0-flash")

    mode = os.getenv("LLM_MODE", "local").lower()

    if mode == "local":
        base = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434").rstrip("/")
        model = os.getenv("OLLAMA_MODEL", "gemma3:1b")
        client = AsyncOpenAI(
            base_url=f"{base}/v1",
            api_key="ollama",          # Ollama ignores the key value
            timeout=timeout,
        )
        return LLMBackend(client=client, model=model)

    if mode == "api":
        endpoint = os.getenv("LLM_ENDPOINT", "").rstrip("/")
        if endpoint and not endpoint.endswith("/v1"):
            endpoint += "/v1"
        api_key = os.getenv("OPENAI_API_KEY", "no-key")
        model = os.getenv("LLM_CHAT") or os.getenv("LLM_CHAT_MODEL") or "gpt-4o-mini"
        client = AsyncOpenAI(
            base_url=endpoint or None,
            api_key=api_key,
            timeout=timeout,
        )
        return LLMBackend(client=client, model=model)

    raise ValueError(f"Unknown LLM_MODE: {mode!r}. Must be 'local' or 'api'.")
