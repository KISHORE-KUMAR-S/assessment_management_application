import { type Request, type Response } from "express";
import { Response as ResponseModel } from "../models/Response.js";
import { Assessment } from "../models/Assessment.js";

export async function createResponse(req: Request, res: Response): Promise<void> {
  const { assessmentId, answers } = req.body ?? {};
  // assessmentId must be a string ObjectId; reject objects to block operator injection.
  if (typeof assessmentId !== "string" || !Array.isArray(answers)) {
    res.status(400).json({ error: "assessmentId and answers[] required" });
    return;
  }
  const doc = await ResponseModel.create({
    assessmentId,
    userId: req.user?.id,
    answers,
  });
  res.status(201).json(doc);
}

export async function listResponses(req: Request, res: Response): Promise<void> {
  const { assessmentId } = req.query;
  // Force string: ?assessmentId[$ne]= would otherwise inject a Mongo operator (NoSQL injection).
  if (typeof assessmentId !== "string") {
    res.status(400).json({ error: "assessmentId query required" });
    return;
  }
  // Authorize: only the assessment owner may read its responses (IDOR).
  const owned = await Assessment.exists({ _id: assessmentId, createdBy: req.user?.id });
  if (!owned) {
    res.status(404).json({ error: "assessment not found" });
    return;
  }
  const responses = await ResponseModel.find({ assessmentId }).sort({ createdAt: -1 });
  res.json(responses);
}
