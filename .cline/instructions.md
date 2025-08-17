# Cline Instructions

## File Access Restrictions

**IMPORTANT: Do not read or access the following sensitive files:**

- `.env` - Contains sensitive environment variables and secrets
- `.env.local` - Contains local environment configuration
- `.env.production` - Contains production environment secrets
- `.env.development` - Contains development environment secrets
- Any file with pattern `*.env*` - Environment files may contain sensitive data

## Security Guidelines

1. **Never suggest reading environment files** when users ask about configuration
2. **Redirect to documentation** instead of examining sensitive files directly
3. **Use placeholder values** in code suggestions rather than actual credentials
4. **Remind users to check their own environment files** for proper configuration

## Alternative Approaches

When configuration help is needed:

- Reference the documentation in `README.md`
- Point to example configurations in comments
- Suggest checking environment file templates if they exist
- Use generic placeholder values in suggestions

## Example Safe Responses

Instead of suggesting to read `.env`, suggest:

```text
Check your .env file should contain these variables:
MCRCON_HOST=localhost
MCRCON_PORT=25575
MCRCON_PASS=your_password_here
```

---

## Minecraft Server Command Instructions

This project provides MCP (Model Context Protocol) tools for executing commands on a Minecraft server via mcrcon. Use these tools to interact with and manage your Minecraft server.

## Available Tools

### 1. execute-command

Execute a single Minecraft server command.

**Parameters:**

- `command` (string, required): The Minecraft command to execute

**Usage Examples:**

```text
Use execute-command to change the time to day:
- command: "time set day"

Use execute-command to give a player items:
- command: "give Steve minecraft:diamond_sword 1"

Use execute-command to check server status:
- command: "list"
```

**Best Practices:**

- Always specify the full command without the leading slash (/)
- Commands are executed exactly as provided
- Use proper Minecraft command syntax

### 2. execute-sequential-command-batch

Execute multiple Minecraft commands in sequence, one after another.

**Parameters:**

- `commands` (array of strings, required): Array of Minecraft commands to execute in order

**Usage Examples:**

```text
Use execute-sequential-command-batch for setup tasks:
- commands: [
    "time set day",
    "weather clear",
    "difficulty easy"
  ]

Use execute-sequential-command-batch for player setup:
- commands: [
    "give Steve minecraft:diamond_sword 1",
    "give Steve minecraft:diamond_pickaxe 1", 
    "give Steve minecraft:bread 64"
  ]
```

**Best Practices:**

- Use when commands need to run in a specific order
- Commands execute one by one, waiting for each to complete
- If one command fails, subsequent commands may still execute
- Maximum recommended: 10-15 commands per batch

### 3. execute-parallel-command-batch

Execute multiple Minecraft commands simultaneously in parallel.

**Parameters:**

- `commands` (array of strings, required): Array of Minecraft commands to execute concurrently

**Usage Examples:**

```text
Use execute-parallel-command-batch for independent operations:
- commands: [
    "give Alice minecraft:diamond 10",
    "give Bob minecraft:emerald 10",
    "give Charlie minecraft:gold_ingot 10"
  ]

Use execute-parallel-command-batch for world modifications:
- commands: [
    "fill 100 64 100 110 70 110 minecraft:stone",
    "fill 200 64 200 210 70 210 minecraft:cobblestone"
  ]
```

**Best Practices:**

- Use when commands are independent and can run simultaneously
- Faster execution than sequential for independent operations
- Avoid when commands depend on each other's results
- Maximum recommended: 5-8 commands per batch

## Command Guidelines

### Server Management

- Use `list` to see online players
- Use `stop` carefully - it will shut down the server
- Use `save-all` to force save the world
- Use `reload` to reload server configuration

### Player Management

- Use `kick <player>` to remove a player
- Use `ban <player>` to ban a player
- Use `op <player>` to give operator status
- Use `tp <player> <x> <y> <z>` to teleport players

### World Management

- Use `time set <time>` (day, night, noon, midnight, or ticks)
- Use `weather <clear|rain|thunder>` to control weather
- Use `difficulty <peaceful|easy|normal|hard>` to set difficulty
- Use `gamerule <rule> <value>` to modify game rules

### Item Management

- Use `give <player> <item> <count>` to give items
- Use `clear <player>` to clear player inventory
- Use `enchant <player> <enchantment> <level>` for enchantments

## Error Handling

When commands fail, the tools will return error information including:

- The command that failed
- Error message from the Minecraft server
- Suggestions for fixing common issues

## Environment Setup

Ensure your `.env` file contains:

```text
MCRCON_HOST=localhost
MCRCON_PORT=25575
MCRCON_PASS=your_rcon_password
MINECRAFT_HOST=localhost
MINECRAFT_PORT=25565
```

## Best Practices for AI Assistance

1. **Start Simple**: Begin with single commands using `execute-command`
2. **Batch Wisely**: Use sequential batches for related operations, parallel for independent ones
3. **Validate Input**: Always check that command syntax is correct before execution
4. **Monitor Results**: Pay attention to command output and error messages
5. **Resource Awareness**: Large batch operations may impact server performance

## Common Command Patterns

### Building Projects

```text
Sequential commands for structured building:
1. Clear area: "fill x1 y1 z1 x2 y2 z2 minecraft:air"
2. Set foundation: "fill x1 y1 z1 x2 y1 z2 minecraft:stone"
3. Build walls: Multiple fill commands in sequence
```

### Player Events

```text
Parallel commands for simultaneous player actions:
- Give rewards to multiple players at once
- Apply effects to different players simultaneously
- Set up multiple teleportation points
```

### Server Maintenance

```text
Sequential commands for server management:
1. Announce maintenance: "say Server maintenance starting"
2. Save world: "save-all"
3. Set peaceful: "difficulty peaceful"
4. Complete tasks...
5. Restore difficulty: "difficulty normal"
```
