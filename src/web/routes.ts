/**
 * HTTP routes for the web server
 */

import { Router, Request, Response } from "express";
import { getSession, submitAnswers } from "../store.js";

export const router = Router();

/**
 * GET /api/session/:id
 * Return session data as JSON
 */
router.get("/api/session/:id", (req: Request, res: Response) => {
  const session = getSession(req.params.id);

  if (!session) {
    res.status(404).json({ error: "Session not found or expired" });
    return;
  }

  // Return session data (without answers to prevent seeing others' responses)
  res.json({
    id: session.id,
    title: session.title,
    context: session.context,
    questions: session.questions,
    alreadySubmitted: session.answers !== null,
  });
});

/**
 * POST /api/session/:id/submit
 * Submit answers for a session
 */
router.post("/api/session/:id/submit", (req: Request, res: Response) => {
  const session = getSession(req.params.id);

  if (!session) {
    res.status(404).json({ error: "Session not found or expired" });
    return;
  }

  if (session.answers !== null) {
    res.status(400).json({ error: "Answers already submitted" });
    return;
  }

  const answers = req.body;

  if (!answers || typeof answers !== "object") {
    res.status(400).json({ error: "Invalid answers format" });
    return;
  }

  const success = submitAnswers(req.params.id, answers);

  if (success) {
    res.json({ success: true, message: "Answers submitted successfully" });
  } else {
    res.status(500).json({ error: "Failed to submit answers" });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: Date.now() });
});
