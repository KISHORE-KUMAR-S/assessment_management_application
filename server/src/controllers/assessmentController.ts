import { type Request, type Response } from "express";
import { Assessment } from "../models/Assessment.js";

export async function listAssessments(req: Request, res: Response): Promise<void> {
  const assessments = await Assessment.find({ createdBy: req.user?.id })
    .select("title createdAt")
    .sort({ createdAt: -1 });
  res.json(assessments);
}

export async function getAssessment(req: Request, res: Response): Promise<void> {
  // Owner-scoped lookup so a guessed _id cannot read another user's assessment (IDOR).
  const a = await Assessment.findOne({ _id: req.params.id, createdBy: req.user?.id });
  if (!a) {
    res.status(404).json({ error: "assessment not found" });
    return;
  }
  res.json(a);
}

export async function createAssessment(req: Request, res: Response): Promise<void> {
  const { title, categories } = req.body ?? {};
  // Reject non-string title to prevent NoSQL operator injection downstream.
  if (typeof title !== "string" || !title) {
    res.status(400).json({ error: "title required" });
    return;
  }
  const a = await Assessment.create({
    title,
    categories: Array.isArray(categories) ? categories : [],
    createdBy: req.user?.id,
  });
  res.status(201).json(a);
}
