import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { Brain, ArrowLeft, Send, Loader2, Lock, Activity, Clock, Target } from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

interface QueryResult {
  query: string;
  response: string;
  matchedTopics: string[];
  matchedNodeIds: number[];
  confidenceLevel: number;
  processingTimeMs: number;
  timestamp: Date;
}

export default function OwnerInspection() {
  const { user, isAuthenticated, loading } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QueryResult[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);

  const { data: history } = trpc.owner.getQueryHistory.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const queryMutation = trpc.owner.query.useMutation({
    onSuccess: (data) => {
      setResults((prev) => [
        {
          query,
          response: data.response,
          matchedTopics: data.matchedTopics,
          matchedNodeIds: data.matchedNodeIds,
          confidenceLevel: data.confidenceLevel,
          processingTimeMs: data.processingTimeMs,
          timestamp: new Date(),
        },
        ...prev,
      ]);
      setQuery("");
      setIsQuerying(false);
    },
    onError: (err) => {
      toast.error("Query failed: " + err.message);
      setIsQuerying(false);
    },
  });

  const handleQuery = () => {
    const trimmed = query.trim();
    if (!trimmed || isQuerying) return;
    setIsQuerying(true);
    queryMutation.mutate({ query: trimmed });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Brain className="w-5 h-5 text-primary animate-pulse" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Lock className="w-12 h-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-display font-semibold">Owner Access Required</h2>
          <p className="text-muted-foreground text-sm">This interface is restricted to the system owner.</p>
          <a href={getLoginUrl()}><Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Sign In</Button></a>
        </div>
      </div>
    );
  }

  const suggestions = [
    "What topics have you learned the most about?",
    "What is your current confidence level on technology topics?",
    "What patterns have you observed in user conversations?",
    "How many knowledge nodes have you built?",
    "What are your strongest knowledge areas?",
    "What topics are you still learning about?",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="text-muted-foreground w-8 h-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="font-display font-semibold text-sm">Owner Inspection</span>
            </div>
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
              Direct Knowledge Query
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {(history ?? []).length} queries logged
          </div>
        </div>
      </header>

      <div className="container max-w-4xl py-8 space-y-8">
        {/* Explanation */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold text-sm text-foreground">Inspect Unstor's Knowledge State</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This interface allows you to directly query what Unstor has learned from all interactions so far. Ask about specific topics, confidence levels, patterns, or knowledge areas. Unstor will report its current understanding based on its knowledge graph.
          </p>
        </div>

        {/* Query Input */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-display font-semibold text-sm text-foreground">Query Unstor's Knowledge</h3>
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleQuery(); }
            }}
            placeholder="Ask Unstor what it has learned... e.g., 'What do you know about machine learning?'"
            className="resize-none min-h-[100px] bg-background border-border focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
            disabled={isQuerying}
          />
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 3).map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all"
                >
                  {s.length > 35 ? s.slice(0, 35) + "…" : s}
                </button>
              ))}
            </div>
            <Button
              onClick={handleQuery}
              disabled={!query.trim() || isQuerying}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 flex-shrink-0"
            >
              {isQuerying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Query
            </Button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-sm text-foreground">Query Results</h3>
            {results.map((result, index) => (
              <div key={index} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Query */}
                <div className="p-4 border-b border-border/50 bg-muted/30">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">{result.query}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {result.processingTimeMs}ms
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Target className="w-3 h-3 text-primary" />
                        <span className="text-primary">{Math.round(result.confidenceLevel * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Response */}
                <div className="p-4 space-y-3">
                  <div className="prose prose-sm prose-invert max-w-none text-sm">
                    <Streamdown>{result.response}</Streamdown>
                  </div>

                  {result.matchedTopics.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-xs text-muted-foreground mr-1">Matched topics:</span>
                        {result.matchedTopics.slice(0, 8).map((topic) => (
                          <span key={topic} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {topic}
                          </span>
                        ))}
                      </div>
                      {result.matchedNodeIds.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Knowledge node IDs: {result.matchedNodeIds.slice(0, 10).join(", ")}
                          {result.matchedNodeIds.length > 10 && ` +${result.matchedNodeIds.length - 10} more`}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    {result.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Query History */}
        {(history ?? []).length > 0 && results.length === 0 && (
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-sm text-foreground">Previous Queries</h3>
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {(history ?? []).slice(0, 10).map((q) => (
                <div key={q.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">{q.query}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Target className="w-3 h-3 text-primary" />
                      <span className="text-primary">{Math.round((q.confidenceLevel ?? 0) * 100)}%</span>
                    </div>
                  </div>
                  {q.response && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{q.response.slice(0, 150)}…</p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {new Date(q.createdAt).toLocaleDateString()} · {q.processingTimeMs}ms
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions when empty */}
        {results.length === 0 && (history ?? []).length === 0 && (
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-sm text-foreground">Suggested Queries</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="text-left p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-accent/30 transition-all text-sm text-muted-foreground hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
