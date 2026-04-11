import { useState } from "react";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { Brain, ArrowLeft, Network, Layers, TrendingUp, Lock, Search, ChevronDown } from "lucide-react";

function NodeCard({ node }: { node: any }) {
  const [expanded, setExpanded] = useState(false);
  const confidence = Math.round(node.confidenceScore * 100);
  const keywords: string[] = node.keywords ?? [];
  const examples: string[] = node.examples ?? [];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors">
      <div
        className="p-4 flex items-start justify-between gap-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-semibold text-sm text-foreground truncate">{node.topic}</span>
            {node.category && (
              <Badge variant="outline" className="text-xs border-border text-muted-foreground flex-shrink-0">
                {node.category}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-muted-foreground">Seen {node.frequency}×</span>
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${confidence}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{confidence}%</span>
            </div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </div>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
          {keywords.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-1.5">Keywords</div>
              <div className="flex flex-wrap gap-1.5">
                {keywords.slice(0, 10).map((kw) => (
                  <span key={kw} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{kw}</span>
                ))}
              </div>
            </div>
          )}
          {examples.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-1.5">Example</div>
              <p className="text-xs text-foreground/80 leading-relaxed bg-muted/50 rounded-lg p-3">
                "{examples[0]}"
              </p>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Last seen: {new Date(node.lastSeenAt).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
}

export default function KnowledgeExplorer() {
  const { user, isAuthenticated, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"nodes" | "clusters" | "graph">("nodes");

  const { data: nodes, isLoading: nodesLoading } = trpc.knowledge.getNodes.useQuery(
    { limit: 100, offset: 0 },
    { enabled: isAuthenticated && user?.role === "admin" }
  );
  const { data: clusters, isLoading: clustersLoading } = trpc.knowledge.getClusters.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

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
          <a href={getLoginUrl()}><Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Sign In</Button></a>
        </div>
      </div>
    );
  }

  const filteredNodes = (nodes ?? []).filter(
    (n) =>
      !search ||
      n.topic.toLowerCase().includes(search.toLowerCase()) ||
      (n.category ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredClusters = (clusters ?? []).filter(
    (c) => !search || c.clusterName.toLowerCase().includes(search.toLowerCase())
  );

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
              <Network className="w-4 h-4 text-primary" />
              <span className="font-display font-semibold text-sm">Knowledge Explorer</span>
            </div>
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
              {(nodes ?? []).length} nodes
            </Badge>
          </div>
        </div>
      </header>

      <div className="container py-8 space-y-6">
        {/* Search + Tabs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search topics, categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => setActiveTab("nodes")}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === "nodes" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
            >
              <Network className="w-3.5 h-3.5 inline mr-1.5" />
              Nodes
            </button>
            <button
              onClick={() => setActiveTab("clusters")}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === "clusters" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
            >
              <Layers className="w-3.5 h-3.5 inline mr-1.5" />
              Clusters
            </button>
            <button
              onClick={() => setActiveTab("graph")}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === "graph" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
            >
              <TrendingUp className="w-3.5 h-3.5 inline mr-1.5" />
              Graph
            </button>
          </div>
        </div>

        {/* Nodes Tab */}
        {activeTab === "nodes" && (
          <div>
            {nodesLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse h-20" />
                ))}
              </div>
            ) : filteredNodes.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Network className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground text-sm">
                  {search ? "No nodes match your search." : "No knowledge nodes yet. Start chatting to build the knowledge base."}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredNodes.map((node) => (
                  <NodeCard key={node.id} node={node} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Graph Tab */}
        {activeTab === "graph" && <KnowledgeGraph />}

        {/* Clusters Tab */}
        {activeTab === "clusters" && (
          <div>
            {clustersLoading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse h-32" />
                ))}
              </div>
            ) : filteredClusters.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Layers className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground text-sm">
                  {search ? "No clusters match your search." : "No topic clusters yet."}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredClusters.map((cluster) => {
                  const topics: string[] = cluster.topics ?? [];
                  const keywords: string[] = cluster.dominantKeywords ?? [];
                  return (
                    <div key={cluster.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-display font-semibold text-foreground">{cluster.clusterName}</h3>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {cluster.totalFrequency} interactions · {(cluster.nodeIds as number[] ?? []).length} nodes
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs font-medium text-primary">{cluster.totalFrequency}</span>
                        </div>
                      </div>
                      {topics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {topics.slice(0, 6).map((t) => (
                            <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{t}</span>
                          ))}
                          {topics.length > 6 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">+{topics.length - 6}</span>
                          )}
                        </div>
                      )}
                      {keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {keywords.slice(0, 5).map((k) => (
                            <span key={k} className="text-xs text-muted-foreground">{k}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
