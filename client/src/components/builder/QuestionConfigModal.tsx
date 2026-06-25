import { useState } from "react";
import type { Question, QuestionType } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (questions: Question[]) => void;
}

const TYPES: { type: QuestionType; label: string }[] = [
  { type: "multiple_choice", label: "Multiple Choice" },
  { type: "rating", label: "Rating Scale" },
  { type: "text", label: "Text" },
];

function blankQuestion(type: QuestionType): Question {
  return {
    text: "",
    type,
    ...(type === "multiple_choice" ? { options: ["Option 1", "Option 2"] } : {}),
    ...(type === "rating" ? { maxRating: 5 } : {}),
  };
}

export default function QuestionConfigModal({ open, onOpenChange, onGenerate }: Props) {
  const [counts, setCounts] = useState<Record<QuestionType, number>>({
    multiple_choice: 0,
    rating: 0,
    text: 0,
  });

  function setCount(type: QuestionType, n: number) {
    setCounts((c) => ({ ...c, [type]: Math.max(0, n) }));
  }

  function handleGenerate() {
    const questions: Question[] = [];
    for (const { type } of TYPES) {
      for (let i = 0; i < counts[type]; i++) questions.push(blankQuestion(type));
    }
    onGenerate(questions);
    setCounts({ multiple_choice: 0, rating: 0, text: 0 });
    onOpenChange(false);
  }

  const total = counts.multiple_choice + counts.rating + counts.text;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add questions</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {TYPES.map(({ type, label }) => (
            <div key={type} className="flex items-center justify-between gap-4">
              <Label htmlFor={`count-${type}`}>{label}</Label>
              <Input
                id={`count-${type}`}
                type="number"
                min={0}
                className="w-24"
                value={counts[type]}
                onChange={(e) => setCount(type, Number(e.target.value))}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={total === 0}>
            Add {total > 0 ? `${total} ` : ""}question{total === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
