import asyncio
from httpx import AsyncClient
from app.main import app


async def test_llm_precheck_out_of_scope():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.post("/api/llm/query", json={"question": "Tell me about the war"})
    assert r.status_code == 200
    data = r.json()
    assert data.get("refused") is True or "invoices" in data.get("answer", "").lower()
