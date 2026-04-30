"""
LLM adapter — selects the LLM backend based on the LLM_MODE env var.

  LLM_MODE=local  → Ollama (`http://ollama:11434/v1`) using OLLAMA_MODEL
  LLM_MODE=api    → Any OpenAI-compatible endpoint via LLM_ENDPOINT + OPENAI_API_KEY
"""

import os
from functools import lru_cache

from llama_index.llms.ollama import Ollama
from llama_index.llms.openai import OpenAI as OpenAILLM


@lru_cache(maxsize=1)
def get_llm():
    mode = os.getenv("LLM_MODE", "local").lower()

    if mode == "local":
        base_url = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
        model = os.getenv("OLLAMA_MODEL", "gemma3:4b")
        return Ollama(
            model=model,
            base_url=base_url,
            request_timeout=float(os.getenv("LLM_TIMEOUT_MS", "120000")) / 1000,
        )

    if mode == "api":
        endpoint = os.getenv("LLM_ENDPOINT")
        api_key = os.getenv("OPENAI_API_KEY", "")
        # LLM_CHAT is the canonical env var; LLM_CHAT_MODEL is an accepted alias
        model = os.getenv("LLM_CHAT") or os.getenv("LLM_CHAT_MODEL") or "gpt-4o-mini"
        return OpenAILLM(
            model=model,
            api_base=endpoint,
            api_key=api_key,
            timeout=float(os.getenv("LLM_TIMEOUT_MS", "120000")) / 1000,
        )

    raise ValueError(f"Unknown LLM_MODE: {mode!r}. Must be 'local' or 'api'.")
