# Minecraft MCP Server

This project is configured to use GitHub Packages as an npm registry for scoped packages under `@olddude`.

```.npmrc
//npm.pkg.github.com/:_authToken=<GITHUB_TOKEN>
@olddude:registry=https://npm.pkg.github.com
```

## Permissions

The repository needs the following permissions for GitHub Actions:

- `contents: read` - To checkout code
- `packages: write` - To publish packages

## Environment Variables

The following secrets/tokens are used:

- `GITHUB_TOKEN` - Automatically provided by GitHub Actions for authentication

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
