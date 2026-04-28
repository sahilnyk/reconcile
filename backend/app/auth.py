import json
from typing import Dict

import httpx
from jose import jwk, jwt
from jose.utils import base64url_decode
from fastapi import HTTPException

from .config import settings


class Auth0Error(Exception):
    pass


async def get_jwks() -> Dict:
    if not settings.AUTH0_DOMAIN:
        raise Auth0Error("AUTH0_DOMAIN not set")
    url = f"https://{settings.AUTH0_DOMAIN}/.well-known/jwks.json"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, timeout=5)
    resp.raise_for_status()
    return resp.json()


def verify_jwt_token(token: str, jwks: Dict, audience: str | None = None) -> Dict:
    # Very small verification: find key by kid and decode
    headers = jwt.get_unverified_header(token)
    kid = headers.get("kid")
    if not kid:
        raise HTTPException(status_code=401, detail="Invalid token header")

    key = None
    for k in jwks.get("keys", []):
        if k.get("kid") == kid:
            key = k
            break

    if not key:
        raise HTTPException(status_code=401, detail="Appropriate JWK not found")

    public_key = jwk.construct(key)
    message, encoded_sig = token.rsplit(".", 1)
    decoded_sig = base64url_decode(encoded_sig.encode("utf-8"))
    if not public_key.verify(message.encode("utf-8"), decoded_sig):
        raise HTTPException(status_code=401, detail="Signature verification failed")

    payload = jwt.get_unverified_claims(token)
    if audience and payload.get("aud") != audience:
        raise HTTPException(status_code=401, detail="Invalid audience")

    return payload
