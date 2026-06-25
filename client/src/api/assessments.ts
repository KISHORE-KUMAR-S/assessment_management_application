import api from "./client";
import type { Assessment, AssessmentSummary, AssessmentResponse, Answer } from "@/types";

export async function listAssessments(): Promise<AssessmentSummary[]> {
  const { data } = await api.get<AssessmentSummary[]>("/assessments");
  return data;
}

export async function getAssessment(id: string): Promise<Assessment> {
  const { data } = await api.get<Assessment>(`/assessments/${id}`);
  return data;
}

export async function createAssessment(payload: Omit<Assessment, "_id">): Promise<Assessment> {
  const { data } = await api.post<Assessment>("/assessments", payload);
  return data;
}

export async function submitResponse(
  assessmentId: string,
  answers: Answer[]
): Promise<AssessmentResponse> {
  const { data } = await api.post<AssessmentResponse>("/responses", { assessmentId, answers });
  return data;
}

export async function listResponses(assessmentId: string): Promise<AssessmentResponse[]> {
  const { data } = await api.get<AssessmentResponse[]>("/responses", {
    params: { assessmentId },
  });
  return data;
}
