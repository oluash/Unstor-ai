import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DashboardLayout from "@/components/DashboardLayout";

const DIFFICULTY_COLORS: Record<string, string> = {
  introductory: "bg-emerald-900/40 text-emerald-300 border-emerald-700",
  intermediate: "bg-amber-900/40 text-amber-300 border-amber-700",
  advanced: "bg-red-900/40 text-red-300 border-red-700",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  introductory: "Introductory",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

type DifficultyFilter = "all" | "introductory" | "intermediate" | "advanced";

export default function QuantumExplorer() {
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [selected, setSelected] = useState<number | null>(null);

  const { data: entries = [], isLoading } = trpc.quantum.list.useQuery({ difficulty, limit: 50 });
  const { data: detail } = trpc.quantum.get.useQuery(
    { id: selected! },
    { enabled: selected !== null }
  );

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-2xl">⚛️</span> Quantum Reality & Ifá
          </h1>
          <p className="text-sm text-zinc-400">
            Explore the quantum physics principles that mirror the wisdom of Ifá — from superposition to consciousness.
          </p>
        </div>

        {/* Difficulty filter */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "introductory", "intermediate", "advanced"] as DifficultyFilter[]).map((d) => (
            <Button
              key={d}
              size="sm"
              variant={difficulty === d ? "default" : "outline"}
              onClick={() => setDifficulty(d)}
              className={difficulty === d ? "bg-violet-700 text-white" : "text-zinc-300 border-zinc-700"}
            >
              {d === "all" ? "All Levels" : DIFFICULTY_LABELS[d]}
            </Button>
          ))}
        </div>

        {/* Entries grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 rounded-xl bg-zinc-800/50 animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">No entries found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entries.map((entry) => (
              <Card
                key={entry.id}
                className="bg-zinc-900 border-zinc-800 hover:border-violet-700 cursor-pointer transition-colors"
                onClick={() => setSelected(entry.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base text-white leading-snug">{entry.topic}</CardTitle>
                    <Badge className={`text-xs shrink-0 border ${DIFFICULTY_COLORS[entry.difficultyLevel]}`}>
                      {DIFFICULTY_LABELS[entry.difficultyLevel]}
                    </Badge>
                  </div>
                  {entry.subtopic && (
                    <p className="text-xs text-violet-400 font-medium">{entry.subtopic}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-400 line-clamp-3">{entry.plainLanguageSummary}</p>
                  {entry.ifaBridge && (
                    <p className="mt-2 text-xs text-amber-400/80 italic line-clamp-2">
                      🔮 {entry.ifaBridge}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detail dialog */}
        <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
            {detail ? (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl text-white">{detail.topic}</DialogTitle>
                  {detail.subtopic && (
                    <p className="text-sm text-violet-400">{detail.subtopic}</p>
                  )}
                  <Badge className={`w-fit text-xs border ${DIFFICULTY_COLORS[detail.difficultyLevel]}`}>
                    {DIFFICULTY_LABELS[detail.difficultyLevel]}
                  </Badge>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  <section>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Plain Language Summary</h3>
                    <p className="text-sm text-zinc-200 leading-relaxed">{detail.plainLanguageSummary}</p>
                  </section>

                  <section>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Full Explanation</h3>
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{detail.content}</p>
                  </section>

                  {detail.ifaBridge && (
                    <section className="bg-amber-950/30 border border-amber-800/40 rounded-lg p-3">
                      <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">🔮 Ifá Bridge</h3>
                      <p className="text-sm text-amber-200 leading-relaxed italic">{detail.ifaBridge}</p>
                    </section>
                  )}

                  {Array.isArray(detail.keywords) && detail.keywords.length > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Keywords</h3>
                      <div className="flex flex-wrap gap-1">
                        {(detail.keywords as string[]).map((kw) => (
                          <Badge key={kw} variant="outline" className="text-xs text-zinc-400 border-zinc-700">{kw}</Badge>
                        ))}
                      </div>
                    </section>
                  )}

                  {Array.isArray(detail.sources) && detail.sources.length > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Sources</h3>
                      <ul className="space-y-1">
                        {(detail.sources as string[]).map((s) => (
                          <li key={s} className="text-xs text-zinc-500 italic">{s}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              </>
            ) : (
              <div className="h-40 flex items-center justify-center text-zinc-500">Loading…</div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
