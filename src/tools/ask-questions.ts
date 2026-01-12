/**
 * Tool handler for ask_questions_web
 */

import { v4 as uuidv4 } from "uuid";
import open from "open";
import {
  createSession,
  getSession,
  Question,
  deleteSession,
} from "../store.js";
import { getPort } from "../web/server.js";

export interface AskQuestionsBatchInput {
  title?: string;
  context?: string;
  questions: Question[];
}

export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  answers: Record<string, unknown>;
}

// Configuration from environment
const TIMEOUT_MS = parseInt(
  process.env.QUESTIONS_UI_TIMEOUT || "600000",
  10
); // Default 10 minutes
const NO_OPEN = process.env.QUESTIONS_UI_NO_OPEN === "1";

/**
 * Format the tool result for Claude Code
 */
function formatToolResult(
  questions: Question[],
  answers: Record<string, unknown>
): ToolResult {
  const lines: string[] = [];
  lines.push(`User submitted answers for ${questions.length} questions:\n`);

  for (const q of questions) {
    const answer = answers[q.id];
    let answerStr: string;

    if (answer === undefined || answer === null) {
      answerStr = "(not answered)";
    } else if (typeof answer === "boolean") {
      answerStr = answer ? "yes" : "no";
    } else if (Array.isArray(answer)) {
      answerStr = answer.join(", ");
    } else {
      answerStr = String(answer);
    }

    lines.push(`- ${q.id}: ${answerStr}`);
  }

  return {
    content: [
      {
        type: "text",
        text: lines.join("\n"),
      },
    ],
    answers,
  };
}

/**
 * Handle the ask_questions_web tool call
 */
export async function handleAskQuestionsWeb(
  args: AskQuestionsBatchInput
): Promise<ToolResult> {
  // 1. Create session with questions
  const sessionId = uuidv4();
  const session = createSession(
    sessionId,
    args.questions,
    args.title,
    args.context
  );

  // 2. Build URL
  const port = getPort();
  const url = `http://localhost:${port}/session/${session.id}`;

  // 3. Log URL to stderr (shows in Claude Code output)
  console.error(`\n🔗 Answer questions at: ${url}\n`);

  // 4. Try to open browser (unless disabled)
  if (!NO_OPEN) {
    try {
      await open(url);
    } catch (e) {
      console.error(
        `Could not open browser automatically. Please open the URL manually.`
      );
    }
  }

  // 5. Poll until answers are submitted (check every 500ms)
  const startTime = Date.now();
  while (true) {
    const currentSession = getSession(session.id);

    // Check if answers submitted
    if (currentSession?.answers !== null) {
      const answers = currentSession!.answers!;
      // Cleanup session
      deleteSession(session.id);
      // Format and return answers
      return formatToolResult(args.questions, answers);
    }

    // Check timeout
    if (Date.now() - startTime > TIMEOUT_MS) {
      deleteSession(session.id);
      return {
        content: [
          {
            type: "text",
            text: `Timeout: User did not submit answers within ${TIMEOUT_MS / 1000 / 60} minutes.`,
          },
        ],
        answers: {},
      };
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

/**
 * Tool definition for MCP
 */
export const askQuestionsWebTool = {
  name: "ask_questions_web",
  description: `Opens a web UI to collect answers to multiple clarification questions at once.
Use this instead of asking questions one-by-one when you have 2 or more questions.
The user will see all questions in a browser interface, answer them, and submit.
This tool blocks until the user submits their answers.`,
  inputSchema: {
    type: "object" as const,
    properties: {
      title: {
        type: "string",
        description:
          "Title shown at the top of the question form (e.g., 'Project Clarifications')",
      },
      context: {
        type: "string",
        description:
          "Optional context or background shown before the questions",
      },
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique identifier for this question",
            },
            question: {
              type: "string",
              description: "The question text",
            },
            description: {
              type: "string",
              description:
                "Optional additional context or explanation for this question",
            },
            type: {
              type: "string",
              enum: ["text", "select", "multiselect", "boolean"],
              description:
                "The input type. Defaults to 'text' if not specified.",
            },
            options: {
              type: "array",
              items: { type: "string" },
              description: "For select/multiselect: the available choices",
            },
            allowCustom: {
              type: "boolean",
              description:
                "For select types: whether to allow typing a custom answer",
            },
            required: {
              type: "boolean",
              description:
                "Whether this question must be answered. Defaults to true.",
            },
            default: {
              type: "string",
              description: "Default value to pre-fill",
            },
          },
          required: ["id", "question"],
        },
      },
    },
    required: ["questions"],
  },
};
