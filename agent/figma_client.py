"""
Figma REST API client — read access to files, components, exports.

Auth: Personal Access Token (no OAuth, no browser). Setup once.

Setup (one-time, by Juan Diego):
    1. Generate a Figma PAT at https://www.figma.com/settings (Personal access tokens).
       Permissions needed: read access to files (default scope works).
    2. Save it to /opt/data/.hermes/secrets/figma.env as FIGMA_TOKEN=fpat_xxxxxx.

Reference: https://www.figma.com/developers/api
"""

from __future__ import annotations

import json
import os
import urllib.parse
import urllib.request
import urllib.error
from pathlib import Path
from typing import Any

SECRETS_FILE = Path("/opt/data/.hermes/secrets/figma.env")
FIGMA_API = "https://api.figma.com"


def _load_env_file(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    env: dict[str, str] = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


_creds = _load_env_file(SECRETS_FILE)


def _token() -> str:
    t = _creds.get("FIGMA_TOKEN") or os.getenv("FIGMA_TOKEN") or ""
    if not t:
        raise RuntimeError(
            f"FIGMA_TOKEN no configurado. Esperado en {SECRETS_FILE}. "
            "Generalo en https://www.figma.com/settings (Personal access tokens)."
        )
    return t


def _api(path: str, *, params: dict | None = None, timeout: int = 30) -> dict:
    url = f"{FIGMA_API}{path}"
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"X-Figma-Token": _token()})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Figma API {path} failed: HTTP {e.code} {e.read()[:300]!r}")


def get_me() -> dict:
    """Verify credentials. Returns user record."""
    return _api("/v1/me")


def get_file(file_key: str, *, depth: int | None = None) -> dict:
    """
    Get a file's node tree.

    `depth=1` returns only the top-level pages (cheap, good for catalog).
    `depth=2` adds first-level frames per page.
    No depth = full tree (can be huge for big files).
    """
    params: dict[str, Any] = {}
    if depth is not None:
        params["depth"] = depth
    return _api(f"/v1/files/{file_key}", params=params or None)


def get_file_nodes(file_key: str, node_ids: list[str]) -> dict:
    """Get specific nodes by id."""
    return _api(
        f"/v1/files/{file_key}/nodes",
        params={"ids": ",".join(node_ids)},
    )


def get_file_components(file_key: str) -> dict:
    """List components defined in a file."""
    return _api(f"/v1/files/{file_key}/components")


def get_file_styles(file_key: str) -> dict:
    """List styles (color/text/effect/grid) defined in a file."""
    return _api(f"/v1/files/{file_key}/styles")


def export_images(
    file_key: str,
    node_ids: list[str],
    *,
    fmt: str = "png",
    scale: float = 2.0,
) -> dict:
    """
    Request image renders for the given nodes.
    Returns {"images": {node_id: url, ...}}. URLs are short-lived (~30 min).
    """
    return _api(
        f"/v1/images/{file_key}",
        params={
            "ids": ",".join(node_ids),
            "format": fmt,
            "scale": str(scale),
        },
    )


if __name__ == "__main__":
    import sys
    try:
        u = get_me()
        print("✓ Figma auth OK")
        print(json.dumps(u, indent=2))
    except Exception as e:
        print(f"✗ {e}")
        sys.exit(1)
