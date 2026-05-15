"""
Canva Connect API client — Python port of legacy/monet-app/src/lib/canva/

Service-account auth: uses a long-lived refresh token (one-time setup) to
mint short-lived (4h) access tokens on demand. No browser, no OAuth flow
per request.

Setup (one-time, by Juan Diego):
    1. Have CANVA_CLIENT_ID, CANVA_CLIENT_SECRET, CANVA_REFRESH_TOKEN from
       the existing Vercel deployment of monet-app legacy.
    2. Save them to /opt/data/.hermes/secrets/canva.env (see canva.env.example).
    3. They are loaded automatically when this module is imported.

Reference: https://www.canva.com/developers/docs/connect-api/
"""

from __future__ import annotations

import base64
import json
import os
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

SECRETS_FILE = Path("/opt/data/.hermes/secrets/canva.env")
CANVA_API_BASE = "https://api.canva.com"
CANVA_AUTH_BASE = "https://www.canva.com"
REFRESH_WINDOW_S = 60  # refresh 1 min before expiry


# ─── credentials loading ──────────────────────────────────────────────────

def _load_env_file(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    env: dict[str, str] = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


_creds = _load_env_file(SECRETS_FILE)


def _need(key: str) -> str:
    val = _creds.get(key) or os.getenv(key) or ""
    if not val:
        raise RuntimeError(
            f"{key} no está configurado. Esperado en {SECRETS_FILE} o env. "
            f"Setup: ver canva.env.example."
        )
    return val


# ─── HTTP helpers ─────────────────────────────────────────────────────────

def _http(
    method: str,
    url: str,
    *,
    headers: dict[str, str] | None = None,
    body: bytes | None = None,
    timeout: int = 30,
) -> tuple[int, dict, bytes]:
    req = urllib.request.Request(url, method=method, data=body)
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, dict(resp.headers), resp.read()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read()


# ─── service-token resolver ───────────────────────────────────────────────

@dataclass
class _TokenCache:
    access_token: str | None = None
    expires_at: float = 0.0


_cache = _TokenCache()


def get_access_token(force_refresh: bool = False) -> str:
    """Returns a valid Canva access token, refreshing if needed."""
    now = time.time()
    if (
        not force_refresh
        and _cache.access_token
        and _cache.expires_at - now > REFRESH_WINDOW_S
    ):
        return _cache.access_token

    client_id = _need("CANVA_CLIENT_ID")
    client_secret = _need("CANVA_CLIENT_SECRET")
    refresh_token = _need("CANVA_REFRESH_TOKEN")

    body = urllib.parse.urlencode({
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
    }).encode()

    basic = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    status, _hdr, raw = _http(
        "POST",
        f"{CANVA_API_BASE}/rest/v1/oauth/token",
        headers={
            "Authorization": f"Basic {basic}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body=body,
    )
    if status != 200:
        raise RuntimeError(
            f"Canva refresh failed: HTTP {status} {raw[:300]!r}. "
            f"Probablemente CANVA_REFRESH_TOKEN expiró o es inválido. "
            f"Re-ejecutá el bootstrap de la app legacy para generar uno nuevo."
        )

    data = json.loads(raw)
    _cache.access_token = data["access_token"]
    expires_in = int(data.get("expires_in", 14400))
    _cache.expires_at = now + expires_in

    # Canva uses refresh token rotation: each refresh returns a NEW
    # refresh_token and revokes the old one. We must persist the new
    # value or the next refresh call fails with "Refresh token used
    # twice. All access tokens granted from this flow are now revoked."
    new_refresh = data.get("refresh_token")
    if new_refresh and new_refresh != refresh_token:
        _persist_refresh_token(new_refresh)
        os.environ["CANVA_REFRESH_TOKEN"] = new_refresh

    return _cache.access_token


def _persist_refresh_token(new_value: str) -> None:
    """Rewrite the CANVA_REFRESH_TOKEN line in canva.env, preserving everything else.

    The .env file may live at /opt/data/.hermes/secrets/canva.env (VPS prod)
    or alongside the package as agent/canva.env (local dev). We look for both
    and rewrite whichever exists. Silently no-ops if neither is writeable,
    so this works in stateless deploys too (orchestrator just keeps the new
    token in process memory via os.environ).
    """
    candidates = [
        Path("/opt/data/.hermes/secrets/canva.env"),
        Path(__file__).resolve().parent / "canva.env",
    ]
    for path in candidates:
        if not path.exists():
            continue
        try:
            lines = path.read_text().splitlines()
            replaced = False
            for i, line in enumerate(lines):
                if line.startswith("CANVA_REFRESH_TOKEN="):
                    lines[i] = f"CANVA_REFRESH_TOKEN={new_value}"
                    replaced = True
                    break
            if not replaced:
                lines.append(f"CANVA_REFRESH_TOKEN={new_value}")
            path.write_text("\n".join(lines) + "\n")
            return
        except (OSError, PermissionError):
            continue


# ─── Canva Connect operations ─────────────────────────────────────────────

def _api(method: str, path: str, body: dict | None = None, timeout: int = 60):
    token = get_access_token()
    raw_body = json.dumps(body).encode() if body is not None else None
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
    if raw_body is not None:
        headers["Content-Type"] = "application/json"
    status, hdrs, raw = _http(
        method, f"{CANVA_API_BASE}{path}",
        headers=headers, body=raw_body, timeout=timeout,
    )
    if 200 <= status < 300:
        return json.loads(raw) if raw else {}
    raise RuntimeError(f"Canva API {method} {path} failed: HTTP {status} {raw[:500]!r}")


def get_user() -> dict:
    """Verify credentials work. Returns user info."""
    return _api("GET", "/rest/v1/users/me")


def get_design(design_id: str) -> dict:
    """Get metadata for a design."""
    return _api("GET", f"/rest/v1/designs/{design_id}")


def list_brand_templates() -> dict:
    """List brand templates available to the authenticated service account."""
    return _api("GET", "/rest/v1/brand-templates")


def get_brand_template_dataset(template_id: str) -> dict:
    """Get the autofill schema (fields + types) for a brand template."""
    return _api("GET", f"/rest/v1/brand-templates/{template_id}/dataset")


def create_autofill(template_id: str, data: dict) -> dict:
    """
    Start an autofill job: clone a brand template and fill its placeholder
    fields with `data`. Returns a job id; poll with poll_autofill.
    """
    return _api(
        "POST",
        "/rest/v1/autofills",
        body={"brand_template_id": template_id, "data": data},
    )


def poll_autofill(job_id: str, *, max_wait_s: int = 120, interval_s: int = 2) -> dict:
    """Poll an autofill job until completion or timeout."""
    start = time.time()
    while True:
        job = _api("GET", f"/rest/v1/autofills/{job_id}")
        status = job.get("job", {}).get("status")
        if status in ("success", "failed"):
            return job
        if time.time() - start > max_wait_s:
            raise RuntimeError(f"Autofill job {job_id} timeout after {max_wait_s}s")
        time.sleep(interval_s)


def export_design(design_id: str, fmt: str = "pdf") -> dict:
    """Start an export job for a design."""
    return _api(
        "POST",
        "/rest/v1/exports",
        body={"design_id": design_id, "format": {"type": fmt}},
    )


def poll_export(job_id: str, *, max_wait_s: int = 180, interval_s: int = 3) -> dict:
    """Poll an export job until completion. Returns final job (with URLs)."""
    start = time.time()
    while True:
        job = _api("GET", f"/rest/v1/exports/{job_id}")
        status = job.get("job", {}).get("status")
        if status == "success":
            return job
        if status == "failed":
            raise RuntimeError(f"Export job {job_id} failed: {job}")
        if time.time() - start > max_wait_s:
            raise RuntimeError(f"Export job {job_id} timeout after {max_wait_s}s")
        time.sleep(interval_s)


def export_design_to_pdf_url(design_id: str) -> list[str]:
    """High-level helper: returns list of PDF URLs (multi-page → multi-URL)."""
    job = export_design(design_id, fmt="pdf")
    job_id = job["job"]["id"]
    done = poll_export(job_id)
    urls = [u for u in (done.get("job", {}).get("urls") or [])]
    return urls


def upload_asset_from_url(url: str, name: str | None = None) -> dict:
    """Upload an image (by URL) to Canva. Returns the asset record with asset_id."""
    body = {"url": url}
    if name:
        body["name"] = name
    return _api("POST", "/rest/v1/asset-uploads/from-url", body=body)


# ─── CLI smoke-test ───────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    try:
        u = get_user()
        print("✓ Canva auth OK")
        print(json.dumps(u, indent=2))
    except Exception as e:
        print(f"✗ {e}")
        sys.exit(1)
