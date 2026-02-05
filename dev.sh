#!/usr/bin/env bash
set -e

trap 'kill 0' EXIT

cd "$(dirname "$0")"

(cd api && uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000) &
(cd frontend && npm run dev) &

wait
