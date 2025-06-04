#!/bin/bash
# shellcheck disable=SC1091
set -e

script_file_path="${BASH_SOURCE[0]}"
script_dir_path="$(cd "$(dirname "$script_file_path")" && pwd)"
root_dir_path="$(cd "$script_dir_path/.." && pwd)"

if [ "$(pwd)" != "$root_dir_path" ]; then
    cd "$root_dir_path"
fi

if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Detect container runtime (Docker or Podman)
CONTAINER_RUNTIME=""
if command -v docker >/dev/null 2>&1; then
    CONTAINER_RUNTIME="docker"
    echo "Using Docker for container build"
elif command -v podman >/dev/null 2>&1; then
    CONTAINER_RUNTIME="podman"
    echo "Using Podman for container build"
else
    echo "Error: Neither Docker nor Podman is available. Please install one of them."
    exit 1
fi

# Container build
$CONTAINER_RUNTIME build -t localhost/minecraft-mcp-server:latest -f Dockerfile . \
    --build-arg GITHUB_TOKEN=$GITHUB_TOKEN
