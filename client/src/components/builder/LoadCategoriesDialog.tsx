import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Category } from "@/types";
import { listCategories } from "@/api/categories";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoad: (categories: Category[]) => void;
}

export default function LoadCategoriesDialog({ open, onOpenChange, onLoad }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listCategories()
      .then(setCategories)
      .catch(() => toast.error("Could not load categories"))
      .finally(() => setLoading(false));
    setSelected(new Set());
  }, [open]);

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleAdd() {
    onLoad(categories.filter((c) => c._id && selected.has(c._id)));
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Load saved categories</DialogTitle>
        </DialogHeader>
        <div className="max-h-72 space-y-2 overflow-y-auto">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && categories.length === 0 && (
            <p className="text-sm text-muted-foreground">No saved categories.</p>
          )}
          {categories.map((c) => (
            <label
              key={c._id}
              className="flex cursor-pointer items-center gap-3 rounded-md border p-2"
            >
              <Checkbox
                checked={c._id ? selected.has(c._id) : false}
                onCheckedChange={() => c._id && toggle(c._id)}
              />
              <span>
                {c.name}{" "}
                <span className="text-xs text-muted-foreground">
                  ({c.factors.length} factor{c.factors.length === 1 ? "" : "s"})
                </span>
              </span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={selected.size === 0}>
            Add selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
