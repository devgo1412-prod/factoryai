# backend/services/llm.py
import requests
from functools import lru_cache
from config import (
    LLM_API_BASE_URL, LLM_API_KEY, LLM_MODEL_NAME,
    LLM_MAX_TOKENS, LLM_TEMPERATURE, LLM_TIMEOUT,
)


def ask_llm(prompt: str, system: str = "") -> str:
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    try:
        resp = requests.post(
            f"{LLM_API_BASE_URL.rstrip('/')}/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {LLM_API_KEY}",
            },
            json={
                "model": LLM_MODEL_NAME,
                "messages": messages,
                "max_tokens": LLM_MAX_TOKENS,
                "temperature": LLM_TEMPERATURE,
            },
            timeout=LLM_TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()
    except requests.exceptions.ConnectionError:
        raise RuntimeError(f"LLM 서버 연결 실패: {LLM_API_BASE_URL}")
    except requests.exceptions.Timeout:
        raise RuntimeError(f"LLM 응답 시간 초과 ({LLM_TIMEOUT}s)")
    except Exception as e:
        raise RuntimeError(f"LLM 오류: {e}")


def ping_llm() -> dict:
    try:
        resp = requests.get(
            f"{LLM_API_BASE_URL.rstrip('/')}/models",
            headers={"Authorization": f"Bearer {LLM_API_KEY}"},
            timeout=5,
        )
        resp.raise_for_status()
        models = [m["id"] for m in resp.json().get("data", [])]
        return {"ok": True, "models": models}
    except Exception as e:
        return {"ok": False, "error": str(e)}
