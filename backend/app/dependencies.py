from fastapi import Depends, Header, HTTPException
from typing import Optional

from .auth import get_jwks, verify_jwt_token
from .config import settings
from .db import get_supabase_client
import asyncio

_jwks_cache: dict | None = None


async def _get_cached_jwks():
    global _jwks_cache
    if _jwks_cache is None:
        _jwks_cache = await get_jwks()
    return _jwks_cache


async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    token = authorization.split(" ", 1)[1]
    jwks = await _get_cached_jwks()
    payload = verify_jwt_token(token, jwks, audience=settings.AUTH0_AUDIENCE)
    sub = payload.get("sub")
    email = payload.get("email")

    # ensure user exists in Supabase
    if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
        sb = get_supabase_client()
        user_rec = sb.table("users").select("id").eq("auth0_sub", sub).execute()
        if not user_rec.data:
            sb.table("users").insert({"auth0_sub": sub, "email": email, "name": payload.get("name")}).execute()
            user_rec = sb.table("users").select("id").eq("auth0_sub", sub).execute()
        user_id = user_rec.data[0]["id"] if user_rec.data else None
    else:
        user_id = None

    return {"sub": sub, "email": email, "id": user_id, "claims": payload}
