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

command -v gh >/dev/null 2>&1 || {
    echo "❌ GitHub CLI (gh) is required but not installed. Aborting." >&2
    exit 1
}

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN
    environment variable is not set. Please set it to your GitHub token." >&2
    exit 1
fi

mkdir -p "$root_dir_path/modules"
mkdir -p "$root_dir_path/dist"

# Minecraft remote connection
echo "📥 Cloning, building and installing mcrcon..."
gh repo clone https://github.com/Olddude/mcrcon "$root_dir_path/modules/mcrcon" || {
    echo "Repository already exists, skipping clone."
}
cd "$root_dir_path/modules/mcrcon"

export PREFIX="$root_dir_path/dist"
make
make install
