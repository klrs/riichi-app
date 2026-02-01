# Stage 1: Build frontend
FROM node:22-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Python dependencies with uv
FROM python:3.12-slim AS python-builder

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Copy workspace config, lockfile, and API dependencies
COPY pyproject.toml uv.lock ./
COPY api/pyproject.toml ./api/

# Sync only the api package into a virtual environment
RUN uv sync --no-dev --package api --frozen

# Stage 3: Final runtime (no uv)
FROM python:3.12-slim AS runtime

# Install system dependencies for OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libxcb1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the virtual environment from builder
COPY --from=python-builder /app/.venv /app/.venv

# Copy model weights first (rarely changes, better cache)
COPY api/best.pt ./api/best.pt

# Copy API source code (changes frequently)
COPY api/main.py ./api/
COPY api/src/ ./api/src/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./api/static

# Set PATH to use the virtual environment
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

WORKDIR /app/api

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
