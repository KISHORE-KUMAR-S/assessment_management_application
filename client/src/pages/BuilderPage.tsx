import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  FolderPlus,
  ListChecks,
  Save,
  Star,
  Trash2,
  Type as TypeIcon,
  Upload,
} from "lucide-react";
import type { Category, Factor, Question, QuestionType } from "@/types";
import { createAssessment } from "@/api/assessments";
import { createCategory } from "@/api/categories";
import { apiError } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { InlineCreate, InlineEdit } from "@/components/builder/InlineText";
import LoadCategoriesDialog from "@/components/builder/LoadCategoriesDialog";
import QuestionConfigModal from "@/components/builder/QuestionConfigModal";

const STORAGE_KEY = "assessment-builder-draft";
// Bump when the Draft shape changes so stale persisted drafts are discarded, not misread.
const DRAFT_VERSION = 2;

let uid = 0;
const nextId = () => `tmp-${Date.now()}-${uid++}`;

// A category in the builder may originate from the saved library; track its source
// id so we don't re-create it on publish (and so loaded copies stay independent).
type DraftCategory = Category & { _id: string; libraryId?: string };

type Draft = {
  title: string;
  categories: DraftCategory[];
};

const EMPTY: Draft = { title: "", categories: [] };

function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as { v?: number; draft?: Draft };
    if (parsed.v !== DRAFT_VERSION || !parsed.draft) return EMPTY;
    return { title: parsed.draft.title ?? "", categories: parsed.draft.categories ?? [] };
  } catch {
    return EMPTY;
  }
}

function countQuestions(categories: DraftCategory[]) {
  return categories.reduce(
    (sum, c) => sum + c.factors.reduce((fs, f) => fs + f.questions.length, 0),
    0
  );
}

// Strip client-only ids before sending to the API; the snapshot is deep-copied server-side.
function strip(categories: DraftCategory[]): Omit<Category, "_id">[] {
  return categories.map((c) => ({
    name: c.name,
    factors: c.factors.map((f) => ({
      name: f.name,
      questions: f.questions.map((q) => ({
        text: q.text,
        type: q.type,
        ...(q.options ? { options: q.options } : {}),
        ...(q.maxRating ? { maxRating: q.maxRating } : {}),
      })),
    })),
  }));
}

export default function BuilderPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft>(() => loadDraft());
  const [loadOpen, setLoadOpen] = useState(false);
  // Which factor the question-config popup is targeting (categoryId + factorId).
  const [configFor, setConfigFor] = useState<{ categoryId: string; factorId: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: DRAFT_VERSION, draft }));
  }, [draft]);

  const categories = draft.categories;
  const questionCount = countQuestions(categories);

  // ---- immutable tree updaters -------------------------------------------------

  function patchCategory(id: string, fn: (c: DraftCategory) => DraftCategory) {
    setDraft((d) => ({ ...d, categories: d.categories.map((c) => (c._id === id ? fn(c) : c)) }));
  }

  function patchFactor(categoryId: string, factorId: string, fn: (f: Factor) => Factor) {
    patchCategory(categoryId, (c) => ({
      ...c,
      factors: c.factors.map((f) => (f._id === factorId ? fn(f) : f)),
    }));
  }

  function addCategory(name: string) {
    const cat: DraftCategory = { _id: nextId(), name, factors: [] };
    setDraft((d) => ({ ...d, categories: [...d.categories, cat] }));
  }

  function deleteCategory(id: string) {
    setDraft((d) => ({ ...d, categories: d.categories.filter((c) => c._id !== id) }));
  }

  function appendCategories(loaded: Category[]) {
    // Deep-copy each loaded category with fresh client ids so edits here never mutate
    // the saved library copy, and append to (not replace) the existing list.
    const copies: DraftCategory[] = loaded.map((c) => ({
      _id: nextId(),
      libraryId: c._id,
      name: c.name,
      factors: c.factors.map((f) => ({
        _id: nextId(),
        name: f.name,
        questions: f.questions.map((q) => ({ ...q, _id: nextId() })),
      })),
    }));
    setDraft((d) => ({ ...d, categories: [...d.categories, ...copies] }));
    toast.success(`Added ${copies.length} categor${copies.length === 1 ? "y" : "ies"}`);
  }

  function addFactor(categoryId: string, name: string) {
    patchCategory(categoryId, (c) => ({
      ...c,
      factors: [...c.factors, { _id: nextId(), name, questions: [] }],
    }));
  }

  function deleteFactor(categoryId: string, factorId: string) {
    patchCategory(categoryId, (c) => ({
      ...c,
      factors: c.factors.filter((f) => f._id !== factorId),
    }));
  }

  function patchQuestion(
    categoryId: string,
    factorId: string,
    questionId: string,
    fn: (q: Question) => Question
  ) {
    patchFactor(categoryId, factorId, (f) => ({
      ...f,
      questions: f.questions.map((q) => (q._id === questionId ? fn(q) : q)),
    }));
  }

  function deleteQuestion(categoryId: string, factorId: string, questionId: string) {
    patchFactor(categoryId, factorId, (f) => ({
      ...f,
      questions: f.questions.filter((q) => q._id !== questionId),
    }));
  }

  // Question-config popup generated `n` blank questions of chosen types; attach ids and append.
  function generateQuestions(generated: Question[]) {
    if (!configFor) return;
    const withIds = generated.map((q) => ({ ...q, _id: nextId() }));
    patchFactor(configFor.categoryId, configFor.factorId, (f) => ({
      ...f,
      questions: [...f.questions, ...withIds],
    }));
    setConfigFor(null);
  }

  // ---- publish -----------------------------------------------------------------

  async function publish() {
    const title = draft.title.trim();
    if (!title) return toast.error("Assessment title required");
    if (categories.length === 0) return toast.error("Add at least one category");
    if (!categories.some((c) => c.factors.length > 0)) return toast.error("Add at least one factor");
    if (questionCount === 0) return toast.error("Add at least one question");
    const blank = categories.some((c) =>
      c.factors.some((f) => f.questions.some((q) => !q.text.trim()))
    );
    if (blank) return toast.error("Every question needs text");

    setSaving(true);
    try {
      // Persist categories authored here (not loaded from the library) so they appear
      // in "Load Categories" later. Best-effort: a failure here must not block publish.
      const cleaned = strip(categories);
      await Promise.allSettled(
        categories
          .map((c, i) => ({ c, payload: cleaned[i] }))
          .filter(({ c }) => !c.libraryId)
          .map(({ payload }) => createCategory(payload))
      );

      await createAssessment({ title, categories: cleaned as Category[] });
      localStorage.removeItem(STORAGE_KEY);
      setDraft(EMPTY); // Builder resets to an empty state after save.
      toast.success("Assessment published");
      navigate("/assessments");
    } catch (e) {
      toast.error(apiError(e, "Publish failed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Builder"
        description="Compose an assessment as Category → Factor → Question. Progress is saved locally."
      />

      <Card className="shadow-sm">
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Assessment title</Label>
            <Input
              id="title"
              placeholder="Faculty readiness assessment"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t pt-4">
            <InlineCreate label="Add category" placeholder="Category name" onCreate={addCategory} />
            <Button variant="outline" size="sm" onClick={() => setLoadOpen(true)}>
              <Upload className="size-3.5" />
              Load categories
            </Button>
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
              {categories.length} categories · {questionCount} questions
            </span>
          </div>

          {categories.length === 0 ? (
            <EmptyState
              icon={FolderPlus}
              title="No categories yet"
              description="Add a category or load saved ones to begin."
              className="bg-background"
            />
          ) : (
            <Accordion multiple className="space-y-2">
              {categories.map((category) => (
                <CategoryNode
                  key={category._id}
                  category={category}
                  onRename={(name) => patchCategory(category._id, (c) => ({ ...c, name }))}
                  onDelete={() => deleteCategory(category._id)}
                  onAddFactor={(name) => addFactor(category._id, name)}
                  onRenameFactor={(fid, name) =>
                    patchFactor(category._id, fid, (f) => ({ ...f, name }))
                  }
                  onDeleteFactor={(fid) => deleteFactor(category._id, fid)}
                  onConfigQuestions={(fid) =>
                    setConfigFor({ categoryId: category._id, factorId: fid })
                  }
                  onPatchQuestion={(fid, qid, fn) => patchQuestion(category._id, fid, qid, fn)}
                  onDeleteQuestion={(fid, qid) => deleteQuestion(category._id, fid, qid)}
                />
              ))}
            </Accordion>
          )}

          <div className="flex justify-end border-t pt-5">
            <Button onClick={publish} disabled={saving}>
              <Save className="size-4" />
              {saving ? "Publishing…" : "Save & publish"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <LoadCategoriesDialog open={loadOpen} onOpenChange={setLoadOpen} onLoad={appendCategories} />
      <QuestionConfigModal
        open={configFor !== null}
        onOpenChange={(open) => !open && setConfigFor(null)}
        onGenerate={generateQuestions}
      />
    </div>
  );
}

function CategoryNode({
  category,
  onRename,
  onDelete,
  onAddFactor,
  onRenameFactor,
  onDeleteFactor,
  onConfigQuestions,
  onPatchQuestion,
  onDeleteQuestion,
}: {
  category: DraftCategory;
  onRename: (name: string) => void;
  onDelete: () => void;
  onAddFactor: (name: string) => void;
  onRenameFactor: (factorId: string, name: string) => void;
  onDeleteFactor: (factorId: string) => void;
  onConfigQuestions: (factorId: string) => void;
  onPatchQuestion: (factorId: string, questionId: string, fn: (q: Question) => Question) => void;
  onDeleteQuestion: (factorId: string, questionId: string) => void;
}) {
  const questionCount = category.factors.reduce((s, f) => s + f.questions.length, 0);
  return (
    <AccordionItem
      value={category._id}
      className="rounded-xl border bg-background not-last:border-b"
    >
      <div className="flex items-center gap-2 px-3 py-1">
        <InlineEdit
          value={category.name}
          onSave={onRename}
          ariaLabel="Edit category name"
          className="text-[0.95rem] font-semibold"
        />
        {category.libraryId && <Badge variant="success">saved</Badge>}
        <div className="ml-auto flex items-center gap-1">
          <Badge variant="info">
            {category.factors.length}f · {questionCount}q
          </Badge>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete category"
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
          </Button>
          <AccordionTrigger className="w-auto flex-none px-1.5 hover:no-underline" />
        </div>
      </div>
      <AccordionContent className="px-3">
        <div className="space-y-2 border-t pt-2">
          {category.factors.length === 0 ? (
            <p className="px-1 py-2 text-xs text-muted-foreground">No factors yet.</p>
          ) : (
            <Accordion multiple className="space-y-2">
              {category.factors.map((factor) => (
                <FactorNode
                  key={factor._id}
                  factor={factor}
                  onRename={(name) => onRenameFactor(factor._id!, name)}
                  onDelete={() => onDeleteFactor(factor._id!)}
                  onConfigQuestions={() => onConfigQuestions(factor._id!)}
                  onPatchQuestion={(qid, fn) => onPatchQuestion(factor._id!, qid, fn)}
                  onDeleteQuestion={(qid) => onDeleteQuestion(factor._id!, qid)}
                />
              ))}
            </Accordion>
          )}
          <InlineCreate
            size="xs"
            label="Add factor"
            placeholder="Factor name"
            onCreate={onAddFactor}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function FactorNode({
  factor,
  onRename,
  onDelete,
  onConfigQuestions,
  onPatchQuestion,
  onDeleteQuestion,
}: {
  factor: Factor;
  onRename: (name: string) => void;
  onDelete: () => void;
  onConfigQuestions: () => void;
  onPatchQuestion: (questionId: string, fn: (q: Question) => Question) => void;
  onDeleteQuestion: (questionId: string) => void;
}) {
  return (
    <AccordionItem value={factor._id!} className="rounded-lg border bg-card not-last:border-b">
      <div className="flex items-center gap-2 px-3 py-1">
        <InlineEdit
          value={factor.name}
          onSave={onRename}
          ariaLabel="Edit factor name"
          className="text-sm font-medium"
        />
        <div className="ml-auto flex items-center gap-1">
          <Badge variant="neutral">{factor.questions.length}q</Badge>
          <Button variant="ghost" size="icon-sm" aria-label="Delete factor" onClick={onDelete}>
            <Trash2 className="size-4" />
          </Button>
          <AccordionTrigger className="w-auto flex-none px-1.5 hover:no-underline" />
        </div>
      </div>
      <AccordionContent className="px-3">
        <div className="space-y-2 border-t pt-2">
          {factor.questions.length === 0 ? (
            <p className="px-1 py-1 text-xs text-muted-foreground">No questions yet.</p>
          ) : (
            <ol className="space-y-2">
              {factor.questions.map((q, i) => (
                <QuestionRow
                  key={q._id}
                  index={i}
                  question={q}
                  onPatch={(fn) => onPatchQuestion(q._id!, fn)}
                  onDelete={() => onDeleteQuestion(q._id!)}
                />
              ))}
            </ol>
          )}
          <Button variant="secondary" size="sm" onClick={onConfigQuestions}>
            <ListChecks className="size-3.5" />
            Add questions
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

const TYPE_META: Record<QuestionType, { label: string; icon: typeof Star }> = {
  multiple_choice: { label: "MCQ", icon: ListChecks },
  rating: { label: "Rating", icon: Star },
  text: { label: "Text", icon: TypeIcon },
};

function QuestionRow({
  index,
  question,
  onPatch,
  onDelete,
}: {
  index: number;
  question: Question;
  onPatch: (fn: (q: Question) => Question) => void;
  onDelete: () => void;
}) {
  const meta = TYPE_META[question.type];
  const Icon = meta.icon;
  return (
    <li className="rounded-lg border bg-background p-3">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-xs text-muted-foreground tabular-nums">{index + 1}.</span>
        <Badge variant="info" className="mt-0.5 gap-1">
          <Icon className="size-3" />
          {meta.label}
        </Badge>
        <div className="min-w-0 flex-1">
          <InlineEdit
            value={question.text}
            onSave={(text) => onPatch((q) => ({ ...q, text }))}
            placeholder="Question text"
            ariaLabel="Edit question text"
            className="text-sm font-medium"
          />
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Delete question" onClick={onDelete}>
          <Trash2 className="size-4" />
        </Button>
      </div>

      {question.type === "multiple_choice" && (
        <div className="mt-2 pl-6">
          <Label className="text-xs text-muted-foreground">Options (comma-separated)</Label>
          <InlineEdit
            value={(question.options ?? []).join(", ")}
            onSave={(v) =>
              onPatch((q) => ({
                ...q,
                options: v
                  .split(",")
                  .map((o) => o.trim())
                  .filter(Boolean),
              }))
            }
            placeholder="Option A, Option B"
            ariaLabel="Edit options"
            className="text-sm"
          />
        </div>
      )}

      {question.type === "rating" && (
        <div className="mt-2 flex items-center gap-2 pl-6">
          <Label htmlFor={`max-${question._id}`} className="text-xs text-muted-foreground">
            Max rating
          </Label>
          <Input
            id={`max-${question._id}`}
            type="number"
            min={2}
            max={10}
            className="h-7 w-20"
            value={question.maxRating ?? 5}
            onChange={(e) =>
              onPatch((q) => ({
                ...q,
                maxRating: Math.min(10, Math.max(2, Number(e.target.value) || 5)),
              }))
            }
          />
        </div>
      )}
    </li>
  );
}
