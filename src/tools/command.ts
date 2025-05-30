import { execSync } from 'node:child_process';
import { z } from "zod";
import type { McpResponse } from "@olddude/minecraft-server-java";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { createErrorResponse, createResponse } from '../response';

export function registerCommandTools(server: McpServer) {
  server.tool(
    "execute-command",
    "Execute a Minecraft command",
    {
      command: z.string().describe("The Minecraft command to execute")
    },
    async ({ command }: { command: string }): Promise<McpResponse> => {
      try {
        const slash = '/';
        const validCommand = !command.startsWith(slash) ? `${slash}${command}` : command;
        console.debug(`Executing command: "${validCommand}`);
        const mcrconHost = String(process.env.MCRCON_HOST ?? "localhost");
        const mcrconPort = Number.parseInt(process.env.MCRCON_PORT ?? "25575", 10);
        const mcrconPass = String(process.env.MCRCON_PASS ?? "minecraft");
        const mcrconCommand = `./bin/mcrcon -H ${mcrconHost} -P ${mcrconPort} -p ${mcrconPass} "${validCommand}"`;
        console.debug(`Executing mcrcon binary: "${mcrconCommand}"`);
        execSync(mcrconCommand, {
          stdio: 'inherit',
          encoding: 'utf-8',
          cwd: process.cwd(),
          env: process.env
        });
        return createResponse(`Executed command: "${validCommand}"`);
      } catch (error) {
        return createErrorResponse(error as Error);
      }
    }
  );
}
