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

if [ -z "$1" ]; then
    echo "kubeconfig.yaml path has to be provided"
    exit 1
fi

if [ -z "$2" ]; then
    echo "values.yaml path has to be provided"
    exit 1
fi

helm install minecraft-mcp-server . --kubeconfig "$1" --values "$2" \
    --set env.NODE_ENV="$NODE_ENV" \
    --set env.MINECRAFT_HOST="$MINECRAFT_HOST" \
    --set env.MINECRAFT_PORT="$MINECRAFT_PORT" \
    --set env.MCRCON_HOST="$MCRCON_HOST" \
    --set env.MCRCON_PORT="$MCRCON_PORT" \
    --set env.MCRCON_PASS="$MCRCON_PASS"
