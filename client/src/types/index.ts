export type QuestionType = "multiple_choice" | "rating" | "text";

export interface Question {
  _id?: string;
  text: string;
  type: QuestionType;
  options?: string[];
  maxRating?: number;
}

export interface Factor {
  _id?: string;
  name: string;
  questions: Question[];
}

export interface Category {
  _id?: string;
  name: string;
  factors: Factor[];
  createdAt?: string;
}

export interface Assessment {
  _id?: string;
  title: string;
  categories: Category[];
  createdAt?: string;
}

export interface AssessmentSummary {
  _id: string;
  title: string;
  createdAt: string;
}

export interface Answer {
  questionId: string;
  value: string | number | string[];
}

export interface AssessmentResponse {
  _id: string;
  assessmentId: string;
  userId: string;
  answers: Answer[];
  createdAt: string;
}

export interface AuthUser {
  id: string;
  username: string;
}
