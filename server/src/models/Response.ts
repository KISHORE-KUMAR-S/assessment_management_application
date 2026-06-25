import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IAnswer {
  questionId: string;
  value: string | number | string[];
}

export interface IResponse extends Document {
  assessmentId: Types.ObjectId;
  userId: Types.ObjectId;
  answers: IAnswer[];
  createdAt: Date;
}

const answerSchema = new Schema<IAnswer>(
  {
    questionId: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const responseSchema = new Schema<IResponse>(
  {
    assessmentId: { type: Schema.Types.ObjectId, ref: "Assessment", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    answers: { type: [answerSchema], default: [] },
  },
  { timestamps: true }
);

export const Response: Model<IResponse> =
  mongoose.models.Response || mongoose.model<IResponse>("Response", responseSchema);
