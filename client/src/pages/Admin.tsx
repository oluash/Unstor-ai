import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import {
  Brain, ArrowLeft, BarChart3, Users, MessageSquare, Network,
  Layers, TrendingUp, RefreshCw, Lock, Activity
} from "lucide-react";
import { toast } from "sonner";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from "recharts";

function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div className="text-3xl font-display font-bold text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export default function Admin() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: dashboard, refetch, isLoading } = trpc.admin.getDashboard.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });
  const { data: activation } = trpc.status.getActivation.useQuery();
  const triggerSnapshot = trpc.owner.triggerSnapshot.useMutation({
    onSuccess: () => { toast.success("Learning snapshot recorded."); refetch(); },
    onError: () => toast.error("Failed to record snapshot."),
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Brain className="w-5 h-5 text-primary animate-pulse" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Lock className="w-12 h-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-display font-semibold">Owner Access Required</h2>
          <p className="text-muted-foreground text-sm">Sign in to access the admin dashboard.</p>
          <a href={getLoginUrl()}><Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Sign In</Button></a>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Lock className="w-12 h-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-display font-semibold">Access Restricted</h2>
          <p className="text-muted-foreground text-sm">This area is reserved for the system owner.</p>
          <Link href="/"><Button variant="outline">Back to Home</Button></Link>
        </div>
      </div>
    );
  }

  const metricsChartData = (dashboard?.metrics ?? []).slice().reverse().map((m) => ({
    date: new Date(m.snapshotDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    prompts: m.totalPromptsIngested,
    nodes: m.totalKnowledgeNodes,
    readiness: m.readinessScore,
  }));

  const clusterChartData = (dashboard?.clusters ?? []).slice(0, 8).map((c) => ({
    name: c.clusterName.length > 12 ? c.clusterName.slice(0, 12) + "…" : c.clusterName,
    frequency: c.totalFrequency,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-muted-foreground w-8 h-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              <span className="font-display font-semibold text-sm">Unstor Admin</span>
            </div>
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">Owner</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs"
              onClick={() => triggerSnapshot.mutate()}
              disabled={triggerSnapshot.isPending}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${triggerSnapshot.isPending ? "animate-spin" : ""}`} />
              Snapshot
            </Button>
            <Link href="/inspect">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-xs">
                <Activity className="w-3.5 h-3.5" />
                Inspect
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-8 space-y-8">
        {/* Activation Status */}
        {activation && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-primary learning-pulse" />
                <div>
                  <div className="font-display font-semibold text-foreground">
                    {activation.phase === "LEARNING" ? "Silent Learning Phase" : "Active Phase"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {activation.daysRemaining} days remaining · {activation.progressPercent}% complete
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-xl font-display font-bold gradient-text">{activation.readinessScore}%</div>
                  <div className="text-xs text-muted-foreground">Readiness</div>
                </div>
                <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full" style={{ width: `${activation.progressPercent}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={MessageSquare} label="Prompts Ingested" value={(dashboard?.stats?.totalPrompts ?? 0).toLocaleString()} sub="Total interactions" />
            <StatCard icon={Network} label="Knowledge Nodes" value={(dashboard?.stats?.totalNodes ?? 0).toLocaleString()} sub="Unique topics" />
            <StatCard icon={Layers} label="Topic Clusters" value={(dashboard?.stats?.totalClusters ?? 0).toLocaleString()} sub="Category groups" />
            <StatCard icon={Users} label="Sessions" value={(dashboard?.stats?.totalSessions ?? 0).toLocaleString()} sub="Conversations" />
            <StatCard icon={TrendingUp} label="Readiness" value={`${dashboard?.readiness ?? 0}%`} sub="Learning score" />
          </div>
        )}

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Growth chart */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="font-display font-semibold text-sm">Knowledge Growth</h3>
            </div>
            {metricsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={metricsChartData}>
                  <defs>
                    <linearGradient id="promptGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.65 0.22 280)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.65 0.22 280)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="nodeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.65 0.18 145)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.65 0.18 145)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.02 260)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }} />
                  <Tooltip
                    contentStyle={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.20 0.02 260)", borderRadius: "8px", fontSize: "12px" }}
                    labelStyle={{ color: "oklch(0.95 0.01 260)" }}
                  />
                  <Area type="monotone" dataKey="prompts" stroke="oklch(0.65 0.22 280)" fill="url(#promptGrad)" name="Prompts" strokeWidth={2} />
                  <Area type="monotone" dataKey="nodes" stroke="oklch(0.65 0.18 145)" fill="url(#nodeGrad)" name="Nodes" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No snapshot data yet. Click "Snapshot" to record.
              </div>
            )}
          </div>

          {/* Cluster chart */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <h3 className="font-display font-semibold text-sm">Top Topic Clusters</h3>
            </div>
            {clusterChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={clusterChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.02 260)" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }} width={80} />
                  <Tooltip
                    contentStyle={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.20 0.02 260)", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="frequency" fill="oklch(0.65 0.22 280)" radius={[0, 4, 4, 0]} name="Frequency" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No topic clusters yet. Start chatting to build knowledge.
              </div>
            )}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="rounded-xl border border-border bg-card">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="font-display font-semibold text-sm">Recent Sessions</h3>
            </div>
            <Link href="/knowledge">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                View Knowledge Base
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-border">
            {(dashboard?.recentSessions ?? []).length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No sessions yet. Users will appear here as they interact with Unstor.
              </div>
            ) : (
              (dashboard?.recentSessions ?? []).map((session) => (
                <div key={session.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-medium text-muted-foreground">
                      {session.userName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{session.userName ?? "Anonymous"}</div>
                      <div className="text-xs text-muted-foreground">{session.sessionKey.slice(0, 16)}…</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-foreground">{session.totalMessages} messages</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(session.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
