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

if [ -f package.json ]; then
    version=$(jq -r '.version' package.json)
    echo "$version"
else
    echo "package.json not found. Please ensure you are in the correct directory."
    exit 1
fi
