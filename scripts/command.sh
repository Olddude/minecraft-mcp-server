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

cd "$root_dir_path/dist"

export PATH="$root_dir_path/dist/bin:$PATH"

mcrcon_host="${MCRCON_HOST:-"localhost"}"
mcrcon_port="${MCRCON_PORT:-"25575"}"
mcrcon_pass="${MCRCON_PASS:-"minecraft"}"

echo "mcrcon_host: $mcrcon_host"
echo "mcrcon_port: $mcrcon_port"
echo "mcrcon_pass: $mcrcon_pass"

mcrcon \
    -H "$mcrcon_host" \
    -P "$mcrcon_port" \
    -p "$mcrcon_pass" \
    "$@"
