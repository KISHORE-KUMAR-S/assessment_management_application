import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import type { Answer, Assessment, Question } from "@/types";
import { getAssessment, submitResponse } from "@/api/assessments";
import { apiError } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

interface FlatQuestion extends Question {
  _id: string;
  categoryName: string;
  factorName: string;
}

function flatten(a: Assessment): FlatQuestion[] {
  const out: FlatQuestion[] = [];
  for (const c of a.categories) {
    for (const f of c.factors) {
      for (const q of f.questions) {
        if (q._id) out.push({ ...q, _id: q._id, categoryName: c.name, factorName: f.name });
      }
    }
  }
  return out;
}

export default function LaunchPadPage() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<FlatQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | number | string[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!assessmentId) return;
    getAssessment(assessmentId)
      .then((a) => {
        setAssessment(a);
        setQuestions(flatten(a));
      })
      .catch(() => toast.error("Could not load assessment"))
      .finally(() => setLoading(false));
  }, [assessmentId]);

  function setAnswer(id: string, value: string | number | string[]) {
    setAnswers((a) => ({ ...a, [id]: value }));
  }

  async function handleSubmit() {
    const missing = questions.filter((q) => answers[q._id] === undefined || answers[q._id] === "");
    if (missing.length > 0) {
      toast.error(`Answer all questions (${missing.length} left)`);
      return;
    }
    const payload: Answer[] = questions.map((q) => ({ questionId: q._id, value: answers[q._id] }));
    setSubmitting(true);
    try {
      await submitResponse(assessmentId!, payload);
      toast.success("Response submitted");
      navigate("/reports");
    } catch (e) {
      toast.error(apiError(e, "Submit failed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (!assessment) return <p className="text-muted-foreground">Not found.</p>;

  const answered = questions.filter(
    (q) => answers[q._id] !== undefined && answers[q._id] !== ""
  ).length;
  const progress = questions.length ? (answered / questions.length) * 100 : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="sticky top-[6.5rem] z-20 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur lg:top-0 lg:-mx-8 lg:px-8">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="min-w-0 truncate text-xl font-semibold">{assessment.title}</h1>
          <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
            {answered}/{questions.length}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <Card key={q._id} className="shadow-sm">
            <CardHeader>
              <p className="text-xs font-medium uppercase text-primary">
                {q.categoryName} / {q.factorName}
              </p>
              <CardTitle className="text-base">
                {i + 1}. {q.text || "(untitled question)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {q.type === "text" && (
                <Textarea
                  value={(answers[q._id] as string) ?? ""}
                  onChange={(e) => setAnswer(q._id, e.target.value)}
                />
              )}
              {q.type === "multiple_choice" && (
                <RadioGroup
                  value={(answers[q._id] as string) ?? ""}
                  onValueChange={(v) => setAnswer(q._id, v)}
                  className="gap-3"
                >
                  {(q.options ?? []).map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <RadioGroupItem value={opt} id={`${q._id}-${opt}`} />
                      <Label htmlFor={`${q._id}-${opt}`}>{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              {q.type === "rating" && (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: q.maxRating ?? 5 }, (_, n) => n + 1).map((n) => (
                    <Button
                      key={n}
                      type="button"
                      variant={answers[q._id] === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAnswer(q._id, n)}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-muted-foreground">
          {answered === questions.length
            ? "All questions answered."
            : `${questions.length - answered} questions left.`}
        </span>
        <Button size="lg" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit response"}
        </Button>
      </div>
    </div>
  );
}
