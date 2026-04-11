import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

const DOMAIN_LABELS: Record<string, string> = {
  quantum_physics: "Quantum Physics",
  ifa_studies: "Ifá Studies",
  yoruba_language: "Yoruba Language",
  alternative_medicine: "Alternative Medicine",
  epigenetics: "Epigenetics",
  medical_education: "Medical Education",
  psychology: "Psychology",
  philosophy: "Philosophy",
  other: "Other",
};

const DOMAIN_COLORS: Record<string, string> = {
  quantum_physics: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  ifa_studies: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  yoruba_language: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  alternative_medicine: "bg-green-500/20 text-green-300 border-green-500/30",
  epigenetics: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  medical_education: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  psychology: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  philosophy: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  other: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

const SOURCE_COLORS: Record<string, string> = {
  arxiv: "bg-red-500/20 text-red-300 border-red-500/30",
  pubmed: "bg-sky-500/20 text-sky-300 border-sky-500/30",
};

const DOMAINS = [
  "quantum_physics", "ifa_studies", "yoruba_language", "alternative_medicine",
  "epigenetics", "medical_education", "psychology", "philosophy",
];

export default function Research() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string | undefined>(undefined);

  const { data: papers, isLoading, refetch } = trpc.research.getLatest.useQuery({
    domain: selectedDomain,
    limit: 30,
  });

  const { data: searchResults, isLoading: isSearching } = trpc.research.search.useQuery(
    { query: activeSearch, limit: 20 },
    { enabled: activeSearch.length > 2 }
  );

  const triggerArxiv = trpc.research.triggerArxiv.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
    },
    onError: (err) => toast.error("arXiv job failed: " + err.message),
  });

  const triggerPubmed = trpc.research.triggerPubmed.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
    },
    onError: (err) => toast.error("PubMed job failed: " + err.message),
  });

  const displayPapers = activeSearch.length > 2 ? (searchResults ?? []) : (papers ?? []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0d0d14]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-sm">
                  📚
                </div>
                <h1 className="text-2xl font-bold text-white">Research Digest</h1>
              </div>
              <p className="text-gray-400 text-sm max-w-xl">
                Unstor's autonomous research agent continuously ingests peer-reviewed papers from arXiv and PubMed
                across 8 knowledge domains. New papers are fetched daily.
              </p>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => triggerArxiv.mutate()}
                  disabled={triggerArxiv.isPending}
                  className="border-red-500/30 text-red-300 hover:bg-red-500/10 text-xs"
                >
                  {triggerArxiv.isPending ? "Running..." : "▶ arXiv"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => triggerPubmed.mutate()}
                  disabled={triggerPubmed.isPending}
                  className="border-sky-500/30 text-sky-300 hover:bg-sky-500/10 text-xs"
                >
                  {triggerPubmed.isPending ? "Running..." : "▶ PubMed"}
                </Button>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="mt-6 flex gap-3">
            <Input
              placeholder="Search papers by title, abstract, or domain..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && setActiveSearch(searchQuery)}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 max-w-lg"
            />
            <Button
              onClick={() => setActiveSearch(searchQuery)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Search
            </Button>
            {activeSearch && (
              <Button
                variant="ghost"
                onClick={() => { setActiveSearch(""); setSearchQuery(""); }}
                className="text-gray-400 hover:text-white"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <Tabs defaultValue="all" onValueChange={v => setSelectedDomain(v === "all" ? undefined : v)}>
          <TabsList className="bg-white/5 border border-white/10 flex-wrap h-auto gap-1 p-1 mb-6">
            <TabsTrigger value="all" className="text-xs data-[state=active]:bg-white/10">All</TabsTrigger>
            {DOMAINS.map(d => (
              <TabsTrigger key={d} value={d} className="text-xs data-[state=active]:bg-white/10">
                {DOMAIN_LABELS[d]}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedDomain ?? "all"}>
            {isLoading || isSearching ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-3xl mb-3">🔬</div>
                <p>Loading research papers...</p>
              </div>
            ) : displayPapers.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-lg font-medium text-gray-400 mb-2">No papers yet</p>
                <p className="text-sm max-w-sm mx-auto">
                  {isAdmin
                    ? "Click the arXiv or PubMed buttons above to trigger the first research ingestion."
                    : "The research agent will automatically ingest papers daily. Check back soon."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {displayPapers.map((paper: any) => (
                  <Card key={paper.id} className="bg-white/3 border-white/10 hover:border-white/20 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${SOURCE_COLORS[paper.source] ?? "bg-gray-500/20 text-gray-300 border-gray-500/30"}`}>
                              {paper.source?.toUpperCase()}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${DOMAIN_COLORS[paper.domain] ?? DOMAIN_COLORS.other}`}>
                              {DOMAIN_LABELS[paper.domain] ?? paper.domain}
                            </span>
                            {paper.credibilityScore != null && (
                              <span className="text-xs text-gray-500">
                                Credibility: {Math.round(paper.credibilityScore * 100)}%
                              </span>
                            )}
                          </div>
                          <h3 className="text-white font-medium text-sm leading-snug mb-2 line-clamp-2">
                            {paper.title}
                          </h3>
                          {paper.authors && (
                            <p className="text-gray-500 text-xs mb-2 line-clamp-1">
                              {Array.isArray(paper.authors) ? paper.authors.slice(0, 4).join(", ") : paper.authors}
                              {Array.isArray(paper.authors) && paper.authors.length > 4 ? ` +${paper.authors.length - 4} more` : ""}
                            </p>
                          )}
                          {paper.abstract && (
                            <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">
                              {paper.abstract}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {paper.publishedAt && (
                            <span className="text-gray-600 text-xs whitespace-nowrap">
                              {new Date(paper.publishedAt).getFullYear()}
                            </span>
                          )}
                          {paper.url && (
                            <a
                              href={paper.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-xs underline whitespace-nowrap"
                            >
                              View →
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
