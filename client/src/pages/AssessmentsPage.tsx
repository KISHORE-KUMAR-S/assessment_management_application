import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ClipboardList, Rocket } from "lucide-react";
import type { AssessmentSummary } from "@/types";
import { listAssessments } from "@/api/assessments";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default function AssessmentsPage() {
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
      <PageHeader title="Assessments" description="Launch an assessment to collect responses." />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border bg-card" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assessments yet"
          description="Build your first one in the Builder tab."
          action={<Button onClick={() => navigate("/builder")}>Go to Builder</Button>}
        />
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="divide-y">
              {items.map((a) => (
                <div
                  key={a._id}
                  className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{a.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Created {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => navigate(`/launch/${a._id}`)}>
                    <Rocket className="size-4" />
                    Launch
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
