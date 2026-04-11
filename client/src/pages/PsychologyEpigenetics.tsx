import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/DashboardLayout";

const EVIDENCE_COLORS: Record<string, string> = {
  established: "bg-emerald-900/40 text-emerald-300 border-emerald-700",
  emerging: "bg-amber-900/40 text-amber-300 border-amber-700",
  speculative: "bg-zinc-800 text-zinc-400 border-zinc-700",
};

export default function PsychologyEpigenetics() {
  const [activeTab, setActiveTab] = useState<"psychology" | "epigenetics">("psychology");
  const [selectedPsych, setSelectedPsych] = useState<number | null>(null);
  const [selectedEpi, setSelectedEpi] = useState<number | null>(null);

  const { data: psychEntries = [], isLoading: psychLoading } = trpc.psychology.list.useQuery({ limit: 50 });
  const { data: epiEntries = [], isLoading: epiLoading } = trpc.epigenetics.list.useQuery({ limit: 50 });

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-2xl">🧬</span> Psychology & Epigenetics
          </h1>
          <p className="text-sm text-zinc-400">
            The science of mind, behaviour, and how your experiences rewrite your genes — connected to Ifá wisdom.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "psychology" | "epigenetics")}>
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="psychology" className="data-[state=active]:bg-violet-700 data-[state=active]:text-white text-zinc-400">
              🧠 Psychology
            </TabsTrigger>
            <TabsTrigger value="epigenetics" className="data-[state=active]:bg-teal-700 data-[state=active]:text-white text-zinc-400">
              🔬 Epigenetics
            </TabsTrigger>
          </TabsList>

          {/* Psychology Tab */}
          <TabsContent value="psychology" className="mt-4">
            {psychLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-40 rounded-xl bg-zinc-800/50 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {psychEntries.map((entry) => (
                  <Card
                    key={entry.id}
                    className="bg-zinc-900 border-zinc-800 hover:border-violet-700 cursor-pointer transition-colors"
                    onClick={() => setSelectedPsych(entry.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base text-white leading-snug">{entry.technique}</CardTitle>
                        <Badge className={`text-xs shrink-0 border ${EVIDENCE_COLORS[entry.evidenceLevel]}`}>
                          {entry.evidenceLevel}
                        </Badge>
                      </div>
                      <p className="text-xs text-violet-400 font-medium">{entry.framework}</p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-zinc-400 line-clamp-3">{entry.content}</p>
                      {Array.isArray(entry.conditions) && entry.conditions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(entry.conditions as string[]).slice(0, 3).map((c) => (
                            <Badge key={c} variant="outline" className="text-xs text-zinc-500 border-zinc-700">{c}</Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Epigenetics Tab */}
          <TabsContent value="epigenetics" className="mt-4">
            {epiLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-40 rounded-xl bg-zinc-800/50 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {epiEntries.map((entry) => (
                  <Card
                    key={entry.id}
                    className="bg-zinc-900 border-zinc-800 hover:border-teal-700 cursor-pointer transition-colors"
                    onClick={() => setSelectedEpi(entry.id)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-white leading-snug">{entry.mechanism}</CardTitle>
                      {entry.genePathway && (
                        <p className="text-xs text-teal-400 font-medium">{entry.genePathway}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-zinc-400 line-clamp-3">{entry.plainLanguageSummary}</p>
                      {entry.ancestralConnection && (
                        <p className="mt-2 text-xs text-amber-400/80 italic line-clamp-2">
                          🔮 {entry.ancestralConnection}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Psychology Detail Dialog */}
        <Dialog open={selectedPsych !== null} onOpenChange={(open) => !open && setSelectedPsych(null)}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedPsych !== null && (() => {
              const entry = psychEntries.find((e) => e.id === selectedPsych);
              if (!entry) return <div className="h-40 flex items-center justify-center text-zinc-500">Loading…</div>;
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-xl text-white">{entry.technique}</DialogTitle>
                    <p className="text-sm text-violet-400">{entry.framework}</p>
                    <Badge className={`w-fit text-xs border ${EVIDENCE_COLORS[entry.evidenceLevel]}`}>
                      {entry.evidenceLevel} evidence
                    </Badge>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <section>
                      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Overview</h3>
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{entry.content}</p>
                    </section>
                    {entry.practicalApplication && (
                      <section className="bg-violet-950/30 border border-violet-800/40 rounded-lg p-3">
                        <h3 className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-1">Practical Application</h3>
                        <p className="text-sm text-violet-200 leading-relaxed">{entry.practicalApplication}</p>
                      </section>
                    )}
                    {entry.contraindications && (
                      <section className="bg-red-950/20 border border-red-900/30 rounded-lg p-3">
                        <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">⚠️ Important Notes</h3>
                        <p className="text-sm text-red-200 leading-relaxed">{entry.contraindications}</p>
                      </section>
                    )}
                    {Array.isArray(entry.conditions) && entry.conditions.length > 0 && (
                      <section>
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Relevant Conditions</h3>
                        <div className="flex flex-wrap gap-1">
                          {(entry.conditions as string[]).map((c) => (
                            <Badge key={c} variant="outline" className="text-xs text-zinc-400 border-zinc-700">{c}</Badge>
                          ))}
                        </div>
                      </section>
                    )}
                    {Array.isArray(entry.sources) && entry.sources.length > 0 && (
                      <section>
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Sources</h3>
                        <ul className="space-y-1">
                          {(entry.sources as string[]).map((s) => (
                            <li key={s} className="text-xs text-zinc-500 italic">{s}</li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Epigenetics Detail Dialog */}
        <Dialog open={selectedEpi !== null} onOpenChange={(open) => !open && setSelectedEpi(null)}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedEpi !== null && (() => {
              const entry = epiEntries.find((e) => e.id === selectedEpi);
              if (!entry) return <div className="h-40 flex items-center justify-center text-zinc-500">Loading…</div>;
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-xl text-white">{entry.mechanism}</DialogTitle>
                    {entry.genePathway && <p className="text-sm text-teal-400">{entry.genePathway}</p>}
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <section>
                      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Plain Language</h3>
                      <p className="text-sm text-zinc-200 leading-relaxed">{entry.plainLanguageSummary}</p>
                    </section>
                    <section>
                      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Full Explanation</h3>
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{entry.content}</p>
                    </section>
                    {entry.ancestralConnection && (
                      <section className="bg-amber-950/30 border border-amber-800/40 rounded-lg p-3">
                        <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">🔮 Ancestral Connection</h3>
                        <p className="text-sm text-amber-200 leading-relaxed italic">{entry.ancestralConnection}</p>
                      </section>
                    )}
                    {Array.isArray(entry.lifestyleFactors) && entry.lifestyleFactors.length > 0 && (
                      <section>
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Lifestyle Factors</h3>
                        <div className="flex flex-wrap gap-1">
                          {(entry.lifestyleFactors as string[]).map((f) => (
                            <Badge key={f} variant="outline" className="text-xs text-teal-400 border-teal-900">{f}</Badge>
                          ))}
                        </div>
                      </section>
                    )}
                    {Array.isArray(entry.researchSources) && entry.researchSources.length > 0 && (
                      <section>
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Research Sources</h3>
                        <ul className="space-y-1">
                          {(entry.researchSources as string[]).map((s) => (
                            <li key={s} className="text-xs text-zinc-500 italic">{s}</li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
