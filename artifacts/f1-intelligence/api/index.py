"""
Vercel Python serverless function — wraps the FastAPI app.

Vercel routes all /api/* requests here via vercel.json rewrites.
The FastAPI app handles routing internally (all routes are prefixed /api/).
"""
import sys
import os

# Make the api-server package importable from within the Vercel function bundle.
# At runtime Vercel places bundled files under /var/task/, so this resolves to
# /var/task/artifacts/api-server — included via includeFiles in vercel.json.
_api_server = os.path.join(os.path.dirname(__file__), "..", "..", "api-server")
sys.path.insert(0, os.path.abspath(_api_server))

# Import the FastAPI ASGI app — Vercel serves it automatically
from main import app  # noqa: F401  (Vercel detects the `app` name)
