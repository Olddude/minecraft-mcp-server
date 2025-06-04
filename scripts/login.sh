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

if [ -z "$GITHUB_TOKEN" ]; then
    echo "GITHUB_TOKEN is not set. Please set it in the .env file."
    exit 1
fi

gh auth login --with-token <<EOF
$GITHUB_TOKEN
EOF

if ! gh auth status; then
    echo "Failed to authenticate with GitHub. Please check your GITHUB_TOKEN."
    exit 1
fi
