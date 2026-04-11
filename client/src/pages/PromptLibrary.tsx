import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CATEGORY_ICONS: Record<string, string> = {
  ifa_quantum_bridge: "⚛️",
  yoruba_language: "🗣️",
  traditional_medicine: "🌿",
  quantum_physics: "🔬",
  psychology: "🧠",
  epigenetics: "🧬",
  personal_growth: "🌱",
  relationships: "💞",
  health_wellness: "💚",
  spiritual_development: "✨",
  financial_wisdom: "💰",
  career_purpose: "🎯",
  parenting_family: "👨‍👩‍👧",
  creativity: "🎨",
  dreams: "🌙",
  ancestors: "🏺",
  energy_work: "⚡",
  astrology_cosmology: "🌌",
  philosophy_ethics: "📜",
  science_spirituality: "🔭",
  trauma_healing: "🕊️",
  addiction_recovery: "🌅",
  grief_loss: "🕯️",
  anxiety_management: "🌊",
  depression_support: "☀️",
  confidence_building: "🦁",
  decision_making: "⚖️",
  conflict_resolution: "🤝",
  forgiveness_work: "🌸",
  gratitude_practice: "🙏",
  meditation_guidance: "🧘",
  breathwork: "💨",
  movement_practices: "🏃",
  nutrition: "🥗",
  sleep_optimization: "😴",
  stress_management: "🌿",
  time_management: "⏰",
  learning_education: "📚",
  communication_skills: "💬",
  leadership: "👑",
  community_building: "🏘️",
  environmental_awareness: "🌍",
  technology_humanity: "💻",
  future_visioning: "🔮",
  ritual_ceremony: "🕯️",
  sacred_space: "🏛️",
  protection_cleansing: "🛡️",
  manifestation: "✨",
  shadow_work: "🌑",
  integration_wholeness: "☯️",
};

export default function PromptLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { data: categories, isLoading: catLoading } = trpc.prompts.getCategories.useQuery();
  const { data: categoryPrompts, isLoading: promptsLoading } = trpc.prompts.getByCategory.useQuery(
    { category: selectedCategory!, limit: 30 },
    { enabled: !!selectedCategory && !debouncedSearch }
  );
  const { data: searchResults, isLoading: searchLoading } = trpc.prompts.search.useQuery(
    { query: debouncedSearch, limit: 30 },
    { enabled: debouncedSearch.length > 2 }
  );

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    clearTimeout((window as any)._promptSearchTimer);
    (window as any)._promptSearchTimer = setTimeout(() => setDebouncedSearch(val), 400);
    if (val) setSelectedCategory(null);
  };

  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
      toast.success("Prompt copied to clipboard.");
  };

  const displayedPrompts = debouncedSearch ? searchResults : categoryPrompts;
  const isLoading = debouncedSearch ? searchLoading : promptsLoading;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Prompt Library</h1>
          <p className="text-muted-foreground mt-1">
            18,933 prompts across 50 categories — from Ifá Quantum Bridges to Shadow Work
          </p>
        </div>

        {/* Search */}
        <Input
          placeholder="Search prompts across all categories..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="max-w-xl"
        />

        {/* Category Grid */}
        {!debouncedSearch && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {catLoading
              ? Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                ))
              : categories?.map((cat) => (
                  <button
                    key={cat.category}
                    onClick={() => setSelectedCategory(
                      selectedCategory === cat.category ? null : cat.category
                    )}
                    className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg border text-center transition-all hover:border-primary hover:bg-primary/5 ${
                      selectedCategory === cat.category
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-card-foreground"
                    }`}
                  >
                    <span className="text-2xl">{CATEGORY_ICONS[cat.category] ?? "📌"}</span>
                    <span className="text-xs font-medium leading-tight line-clamp-2">
                      {cat.categoryLabel}
                    </span>
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      {cat.count}
                    </Badge>
                  </button>
                ))}
          </div>
        )}

        {/* Prompts Panel */}
        {(selectedCategory || debouncedSearch) && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {debouncedSearch
                    ? `Search results for "${debouncedSearch}"`
                    : categories?.find((c) => c.category === selectedCategory)?.categoryLabel}
                </CardTitle>
                {selectedCategory && !debouncedSearch && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}>
                    ✕ Close
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-10 rounded bg-muted animate-pulse" />
                  ))}
                </div>
              ) : displayedPrompts?.length === 0 ? (
                <p className="text-muted-foreground text-sm">No prompts found.</p>
              ) : (
                <div className="space-y-2">
                  {displayedPrompts?.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors group"
                    >
                      <p className="text-sm text-foreground flex-1">{p.promptText}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => copyPrompt(p.promptText)}
                      >
                        Copy
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!selectedCategory && !debouncedSearch && !catLoading && (
          <p className="text-muted-foreground text-sm text-center py-4">
            Select a category above to browse prompts, or search across all 18,933 prompts.
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
