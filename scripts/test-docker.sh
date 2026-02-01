#!/bin/bash
set -e

IMAGE_NAME="klrs/riichi-app"
CONTAINER_NAME="riichi-app-test"
PORT="${PORT:-8000}"

echo "Building Docker image..."
docker build -t "$IMAGE_NAME" .

echo "Stopping existing container if running..."
docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

echo "Starting container on port $PORT..."
docker run -d \
  --name "$CONTAINER_NAME" \
  -p "$PORT:8000" \
  "$IMAGE_NAME"

echo ""
echo "Container started! Access the app at: http://localhost:$PORT"
echo ""
echo "Useful commands:"
echo "  docker logs -f $CONTAINER_NAME   # View logs"
echo "  docker stop $CONTAINER_NAME      # Stop container"
echo "  docker rm $CONTAINER_NAME        # Remove container"
