import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  CalendarClock,
  ClipboardList,
  Loader2,
  MessageSquareText,
  Star,
  Users,
} from "lucide-react";
import type { Assessment, AssessmentResponse, AssessmentSummary, Question } from "@/types";
import { getAssessment, listAssessments, listResponses } from "@/api/assessments";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FlatQ extends Question {
  _id: string;
  categoryName: string;
  factorName: string;
}

function flatten(a: Assessment): FlatQ[] {
  const out: FlatQ[] = [];
  for (const c of a.categories) {
    for (const f of c.factors) {
      for (const q of f.questions) {
        if (q._id) out.push({ ...q, _id: q._id, categoryName: c.name, factorName: f.name });
      }
    }
  }
  return out;
}

function formatAnswer(q: FlatQ | undefined, value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (q?.type === "rating") return `${value} / ${q.maxRating ?? 5}`;
  return String(value);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ReportsPage() {
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(false);

  const [selected, setSelected] = useState<AssessmentSummary | null>(null);
  const [questions, setQuestions] = useState<FlatQ[]>([]);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(false);
  // Remembered expanded individual-response cards (by response id).
  const [openCards, setOpenCards] = useState<string[]>([]);

  async function loadList() {
    setListLoading(true);
    setListError(false);
    try {
      setAssessments(await listAssessments());
    } catch {
      setListError(true);
      toast.error("Could not load assessments");
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    loadList();
  }, []);

  // Selecting an assessment refreshes both Summary and Individual Responses.
  useEffect(() => {
    if (!selected) return;
    let active = true;
    setReportLoading(true);
    setReportError(false);
    setOpenCards([]);
    (async () => {
      try {
        const assessmentPromise = getAssessment(selected._id);
        const responsesPromise = listResponses(selected._id);
        const a = await assessmentPromise;
        const r = await responsesPromise;
        if (!active) return;
        setQuestions(flatten(a));
        setResponses(r);
      } catch {
        if (active) {
          setReportError(true);
          toast.error("Could not load report");
        }
      } finally {
        if (active) setReportLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [selected]);

  const lastSubmitted = useMemo(() => {
    if (responses.length === 0) return null;
    return responses.reduce((max, r) => (r.createdAt > max ? r.createdAt : max), responses[0].createdAt);
  }, [responses]);

  return (
    <div className="space-y-8">
      <PageHeader title="Reports" description="Understand responses at a glance, then drill into each submission." />

      {/* Section 1 — Assessment header */}
      <Card className="shadow-sm">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="w-full sm:max-w-sm">
            <label className="mb-1.5 block text-sm font-medium">Assessment</label>
            {listError ? (
              <div className="flex items-center gap-2">
                <div className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-destructive/40 px-3 text-sm text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  Failed to load
                </div>
                <Button variant="outline" size="sm" onClick={loadList}>
                  Retry
                </Button>
              </div>
            ) : (
              <Combobox
                items={assessments}
                value={selected}
                onValueChange={(v) => setSelected(v)}
                itemToStringLabel={(a: AssessmentSummary) => a.title}
                isItemEqualToValue={(a: AssessmentSummary, b: AssessmentSummary) => a._id === b._id}
                disabled={listLoading}
              >
                <ComboboxTrigger aria-label="Select an assessment">
                  {listLoading ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Loading…
                    </span>
                  ) : (
                    <ComboboxValue
                      placeholder={<span className="text-muted-foreground">Select an assessment</span>}
                    />
                  )}
                </ComboboxTrigger>
                <ComboboxContent>
                  <ComboboxInput placeholder="Search assessments…" />
                  <ComboboxEmpty>No assessments found.</ComboboxEmpty>
                  <ComboboxList>
                    {(a: AssessmentSummary) => (
                      <ComboboxItem key={a._id} value={a}>
                        {a.title}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            )}
          </div>

          {selected && !reportLoading && !reportError && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <Stat icon={Users} label="Total responses" value={String(responses.length)} />
              {lastSubmitted && (
                <Stat icon={CalendarClock} label="Last submitted" value={fmtDate(lastSubmitted)} />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {!selected ? (
        <EmptyState
          icon={ClipboardList}
          title="Select an assessment"
          description="Pick an assessment above to see its summary and individual responses."
        />
      ) : reportLoading ? (
        <ReportSkeleton />
      ) : reportError ? (
        <EmptyState
          icon={AlertCircle}
          title="Could not load report"
          description="Something went wrong fetching the responses."
          action={
            <Button variant="outline" size="sm" onClick={() => setSelected({ ...selected })}>
              Retry
            </Button>
          }
        />
      ) : responses.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No responses yet"
          description="Once people submit this assessment from the Launch Pad, results show up here."
        />
      ) : (
        <>
          {/* Section 2 — Summary */}
          <section className="space-y-4">
            <SectionHeading title="Summary" subtitle="Aggregated by question." />
            <div className="grid gap-4">
              {questions.map((q, i) => (
                <SummaryCard key={q._id} index={i} question={q} responses={responses} />
              ))}
            </div>
          </section>

          {/* Section 3 — Individual responses */}
          <section className="space-y-4">
            <SectionHeading
              title="Individual responses"
              subtitle="Expand a card to read one submission in full."
            />
            <Accordion
              multiple
              value={openCards}
              onValueChange={(v) => setOpenCards(v as string[])}
              className="space-y-3"
            >
              {responses.map((r, i) => (
                <ResponseCard key={r._id} index={i} response={r} questions={questions} />
              ))}
            </Accordion>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid size-9 place-items-center rounded-lg border bg-card text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

const TYPE_LABEL: Record<string, string> = {
  multiple_choice: "Multiple Choice",
  rating: "Rating",
  text: "Text",
};

function answerValues(questionId: string, responses: AssessmentResponse[]) {
  return responses
    .map((r) => r.answers.find((a) => a.questionId === questionId)?.value)
    .filter((v) => v !== undefined && v !== null && v !== "");
}

function SummaryCard({
  index,
  question,
  responses,
}: {
  index: number;
  question: FlatQ;
  responses: AssessmentResponse[];
}) {
  const values = answerValues(question._id, responses);
  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader className="gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm font-medium">
            <span className="text-muted-foreground tabular-nums">{index + 1}. </span>
            {question.text || "(untitled question)"}
          </CardTitle>
          <Badge variant="info" className="shrink-0">
            {TYPE_LABEL[question.type] ?? question.type}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {question.categoryName} · {question.factorName}
        </p>
      </CardHeader>
      <CardContent>
        {question.type === "multiple_choice" && (
          <ChoiceSummary options={question.options ?? []} values={values as string[]} />
        )}
        {question.type === "rating" && (
          <RatingSummary max={question.maxRating ?? 5} values={values.map(Number)} />
        )}
        {question.type === "text" && <TextSummary values={values.map(String)} />}
      </CardContent>
    </Card>
  );
}

function Bar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 text-muted-foreground tabular-nums">
          {count} · {pct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ChoiceSummary({ options, values }: { options: string[]; values: string[] }) {
  const total = values.length;
  const counts = options.map((opt) => ({
    opt,
    count: values.filter((v) => v === opt).length,
  }));
  if (total === 0) return <Muted>No answers yet.</Muted>;
  return (
    <div className="space-y-3">
      {counts.map(({ opt, count }) => (
        <Bar key={opt} label={opt} count={count} total={total} />
      ))}
    </div>
  );
}

function RatingSummary({ max, values }: { max: number; values: number[] }) {
  const nums = values.filter((n) => !Number.isNaN(n));
  const total = nums.length;
  if (total === 0) return <Muted>No answers yet.</Muted>;
  const avg = nums.reduce((s, n) => s + n, 0) / total;
  const dist = Array.from({ length: max }, (_, i) => i + 1).map((n) => ({
    n,
    count: nums.filter((v) => v === n).length,
  }));
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Star className="size-5 fill-primary text-primary" />
        <span className="text-2xl font-semibold tabular-nums">{avg.toFixed(2)}</span>
        <span className="text-sm text-muted-foreground">/ {max} avg · {total} responses</span>
      </div>
      <div className="space-y-2">
        {dist.map(({ n, count }) => (
          <Bar key={n} label={`${n}`} count={count} total={total} />
        ))}
      </div>
    </div>
  );
}

function TextSummary({ values }: { values: string[] }) {
  const [open, setOpen] = useState(false);
  if (values.length === 0) return <Muted>No comments yet.</Muted>;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MessageSquareText className="size-4" />
        {values.length} comment{values.length === 1 ? "" : "s"}
      </div>
      <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
        {open ? "Hide comments" : "Expand all comments"}
      </Button>
      {open && (
        <ScrollArea className="max-h-72" viewportClassName="pr-3">
          <ul className="space-y-2">
            {values.map((v, i) => (
              <li key={i} className="rounded-lg border border-border/70 bg-muted/30 p-3 text-sm">
                {v}
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
}

function Muted({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function ResponseCard({
  index,
  response,
  questions,
}: {
  index: number;
  response: AssessmentResponse;
  questions: FlatQ[];
}) {
  const respondent = response.userId ? `User ${response.userId.slice(-6)}` : "Anonymous";
  return (
    <AccordionItem
      value={response._id}
      className="rounded-xl border border-border/70 bg-card not-last:border-b"
    >
      <AccordionTrigger className="px-4 hover:no-underline">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
          <span className="text-sm font-medium">Response #{index + 1}</span>
          <span className="text-xs text-muted-foreground">
            {fmtDate(response.createdAt)} · {respondent}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4">
        <Separator className="mb-3 bg-border/70" />
        <dl className="space-y-3">
          {questions.map((q, i) => {
            const value = response.answers.find((a) => a.questionId === q._id)?.value;
            return (
              <div
                key={q._id}
                className="grid gap-1 sm:grid-cols-[1fr_1fr] sm:gap-4 sm:border-b sm:border-border/50 sm:pb-3 sm:last:border-0 sm:last:pb-0"
              >
                <dt className="text-sm text-muted-foreground">
                  <span className="tabular-nums">{i + 1}. </span>
                  {q.text || "(untitled question)"}
                </dt>
                <dd className="text-sm font-medium">{formatAnswer(q, value)}</dd>
              </div>
            );
          })}
        </dl>
      </AccordionContent>
    </AccordionItem>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border bg-card" />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl border bg-card" />
        ))}
      </div>
    </div>
  );
}
