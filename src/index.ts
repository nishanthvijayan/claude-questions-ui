#!/usr/bin/env node
/**
 * MCP Server for Questions UI
 *
 * This server provides the ask_questions_web tool that opens a web UI
 * for collecting answers to multiple clarification questions at once.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { startServer } from "./web/server.js";
import {
  askQuestionsWebTool,
  handleAskQuestionsWeb,
  AskQuestionsBatchInput,
} from "./tools/ask-questions.js";

// Create the MCP server
const server = new Server(
  {
    name: "questions-ui",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tools/list request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [askQuestionsWebTool],
  };
});

// Handle tools/call request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "ask_questions_web") {
    try {
      const result = await handleAskQuestionsWeb(
        args as unknown as AskQuestionsBatchInput
      );
      return {
        content: result.content,
        // Include answers as structured data in addition to text
        _meta: {
          answers: result.answers,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }

  return {
    content: [
      {
        type: "text",
        text: `Unknown tool: ${name}`,
      },
    ],
    isError: true,
  };
});

// Main entry point
async function main() {
  // Start the web server first
  try {
    await startServer();
  } catch (error) {
    console.error("Failed to start web server:", error);
    process.exit(1);
  }

  // Create stdio transport for MCP
  const transport = new StdioServerTransport();

  // Connect server to transport
  await server.connect(transport);

  console.error("Questions UI MCP server running");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
