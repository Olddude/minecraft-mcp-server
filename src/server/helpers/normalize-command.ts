/**
 * Helper function to normalize a Minecraft command by removing leading slash if present.
 * @param command - The raw command string
 * @returns The normalized command without leading slash
 */
export function normalizeCommand(command: string): string {
    const slash = '/';
    return command.startsWith(slash) ? command.substring(1) : command;
}
