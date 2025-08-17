# Minecraft MCP Server

## JSON RPC

```bash
echo '{"jsonrpc": "2.0", "id": "test-1", "method": "tools/call", "params": {"name": "execute-command", "arguments": {"command": "time set day"}}}' | node -r dotenv/config dist/index.js
```

## Git

### Squash local master history

```sh
# DO THIS ONLY WHEN FULLY UNDERSTOOD WHAT IT DOES
# THIS WILL SQUASH THE LOCAL MASTER INTO 1 COMMIT
# THIS IS IRREVERSIBLE AND WILL WIPE THE HISTORY LOCALY
git reset $(git commit-tree HEAD^{tree} -m "0.1.0") && git tag 0.1.0
```

### Purge remote master history

```sh
# DO THIS ONLY WHEN FULLY UNDERSTOOD WHAT IT DOES
# THIS WILL FORCE PUSH THE LOCAL SQUASHED HISTORY INTO THE REMOTE
# THIS IS IRREVERSIBLE AND WILL WIPE THE HISTORY IN THE REMOTE
git push origin HEAD --force --tags
```
