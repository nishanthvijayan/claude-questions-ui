# Questions UI MCP Server

An MCP (Model Context Protocol) server that provides a `ask_questions_web` tool for Claude Code. Instead of asking clarification questions one-by-one in the terminal, Claude can open a web UI where users can see all questions at once, answer them comfortably, and submit.

<img width="1662" height="1678" alt="ask-questions-mcp-tool-screenshot" src="https://github.com/user-attachments/assets/a4437e7e-ca1e-45ea-8ca5-019097bdc217" />



## Installation

```bash
# Clone or download this repository
cd questions-ui-mcp

# Install dependencies
npm install

# Build
npm run build
```

## Configuration for Claude Code

Add to your `~/.claude.json`:

```json
{
  "mcpServers": {
    "questions-ui": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/questions-ui-mcp/dist/index.js"]
    }
  }
}
```

For development/testing:

```json
{
  "mcpServers": {
    "questions-ui": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/questions-ui-mcp/src/index.ts"]
    }
  }
}
```

After adding the configuration, restart Claude Code for changes to take effect.

## Verification

In Claude Code, type `/mcp` to see if `questions-ui` is connected and the `ask_questions_web` tool is available.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `QUESTIONS_UI_PORT` | `3847` | Port for the web server |
| `QUESTIONS_UI_TIMEOUT` | `600000` | Timeout in ms (default 10 minutes) |
| `QUESTIONS_UI_NO_OPEN` | `0` | Set to `1` to disable auto-opening browser |

## How It Works

1. Claude Code calls the `ask_questions_web` tool with a list of questions
2. The MCP server creates a session and starts a local web server
3. Your browser opens to a page showing all questions
4. You fill in your answers and click Submit
5. The answers are returned to Claude Code, which continues its work

```
┌─────────────────┐      stdio (JSON-RPC)      ┌─────────────────────────┐
│   Claude Code   │ ◄────────────────────────► │   MCP Server (Node.js)  │
│                 │                            │                         │
│  Calls tool:    │                            │  - Receives questions   │
│  ask_questions  │                            │  - Stores in memory     │
│  _web           │                            │  - Runs web server      │
└─────────────────┘                            │  - Waits for submit     │
                                               └───────────┬─────────────┘
                                                           │
                                                           │ HTTP (localhost:3847)
                                                           ▼
                                               ┌─────────────────────────┐
                                               │   Browser (Web UI)      │
                                               │                         │
                                               │  - Shows all questions  │
                                               │  - User fills answers   │
                                               │  - Clicks Submit        │
                                               └─────────────────────────┘
```

## Tool Schema

The `ask_questions_web` tool accepts:

```typescript
{
  title?: string;        // Title shown at top of form
  context?: string;      // Optional background/context
  questions: Array<{
    id: string;          // Unique identifier
    question: string;    // Question text
    description?: string; // Additional context
    type?: "text" | "select" | "multiselect" | "boolean";
    options?: string[];  // For select/multiselect
    allowCustom?: boolean; // Allow custom input for select
    required?: boolean;  // Default: true
    default?: string;    // Default value
  }>;
}
```

## Example Usage

Tell Claude Code:

> "I want to build a web app. Before you start, use the ask_questions_web tool to ask me about my requirements - things like framework preference, database, authentication needs, deployment target, etc."

Claude will call the tool, your browser opens with all questions, you answer and submit, and Claude continues with your answers.

## The `/interview` Command

A powerful way to use this tool is with the spec-based workflow [popularized by @trq212](https://x.com/trq212/status/2005315275026260309):

> "My favorite way to use Claude Code to build large features is spec based. Start with a minimal spec or prompt and ask Claude to interview you using the AskUserQuestionTool. Then make a new session to execute the spec."

To enable this workflow, create a custom slash command:

**Create file: `~/.claude/commands/interview.md`**

```markdown
---
description: Prompt Claude to interview you regarding something
argument-hint: Objective of interview
---

Interview me in detail using the ask_questions_web MCP tool but make sure the questions are not obvious.

Be very in-depth and continue interviewing me continually until it's complete.

Objective of interview: $ARGUMENTS
```

**Usage:**

```
/interview requirements for a new authentication system
/interview what features to build for the MVP
/interview tech stack decisions for the project
```

Claude will ask you thoughtful, in-depth questions via the web UI, continuing until it has gathered enough information to produce a comprehensive spec.

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## License

MIT
