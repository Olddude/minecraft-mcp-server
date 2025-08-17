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

# Example usage: ./scripts/kill-proc.sh <port>
if [ -z "$1" ]; then
    echo "Usage: $0 <port>"
    exit 1
fi

port="$1"

# Validate that the argument is a valid port number
if ! [[ "$port" =~ ^[0-9]+$ ]] || [ "$port" -lt 1 ] || [ "$port" -gt 65535 ]; then
    echo "Error: '$port' is not a valid port number (1-65535)"
    exit 1
fi

echo "Looking for processes using port $port..."

# Find PIDs of processes using the specified port
pids=$(lsof -ti:$port 2>/dev/null)

if [ -z "$pids" ]; then
    echo "No processes found using port $port"
    exit 0
fi

echo "Found processes using port $port:"
lsof -i:$port 2>/dev/null || true

# Kill the processes
for pid in $pids; do
    echo "Killing process $pid..."
    kill "$pid" 2>/dev/null && echo "Successfully killed process $pid" || echo "Failed to kill process $pid"
done
