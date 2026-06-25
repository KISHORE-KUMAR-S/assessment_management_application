import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Rocket } from "lucide-react";
import type { AssessmentSummary } from "@/types";
import { listAssessments } from "@/api/assessments";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default function LaunchPadIndexPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAssessments()
      .then(setItems)
      .catch(() => toast.error("Could not load assessments"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Launch Pad" description="Pick an assessment to take and submit responses." />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border bg-card" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Rocket}
          title="Nothing to launch"
          description="Build an assessment first, then come back to take it."
          action={<Button onClick={() => navigate("/builder")}>Go to Builder</Button>}
        />
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="divide-y">
              {items.map((a) => (
                <button
                  key={a._id}
                  type="button"
                  onClick={() => navigate(`/launch/${a._id}`)}
                  className="flex w-full items-center gap-3 p-4 text-left transition-colors duration-150 ease-out hover:bg-muted/40 active:scale-[0.997]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{a.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Created {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Rocket className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
