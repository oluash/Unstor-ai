import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Link2, FileText, BookOpen, Database, Globe, Brain, CheckCircle, XCircle, Clock, Loader2, Rss, RefreshCw, Plus } from "lucide-react";
import { getLoginUrl } from "@/const";

const FEED_TYPE_CONFIG = {
  url: { icon: Link2, label: "URL / Website", color: "text-blue-400", desc: "Paste any web URL — Unstor will fetch and learn from it" },
  text: { icon: FileText, label: "Raw Text", color: "text-green-400", desc: "Paste any text, article, or note directly" },
  book: { icon: BookOpen, label: "Book / Document", color: "text-purple-400", desc: "Paste book chapters, PDFs text, or long-form content" },
  data: { icon: Database, label: "Structured Data", color: "text-amber-400", desc: "Paste JSON, CSV, or structured knowledge data" },
  pdf: { icon: FileText, label: "PDF Content", color: "text-rose-400", desc: "Paste extracted text from a PDF document" },
};

const STATUS_CONFIG = {
  pending: { icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10", label: "Pending" },
  processing: { icon: Loader2, color: "text-blue-400", bg: "bg-blue-400/10", label: "Processing" },
  learned: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10", label: "Learned" },
  failed: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/10", label: "Failed" },
};

export default function FeedManager() {
  const { user, loading, isAuthenticated } = useAuth();
  const [feedType, setFeedType] = useState<"url" | "text" | "book" | "data" | "pdf">("url");
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [rawContent, setRawContent] = useState("");
  const [tags, setTags] = useState("");
  const [activeTab, setActiveTab] = useState("submit");

  const submitFeed = trpc.feed.submit.useMutation({
    onSuccess: (data) => {
      toast.success(`Feed submitted! Unstor is learning from it now.`, {
        description: `Feed ID: ${data.feedId}`,
      });
      setTitle("");
      setSourceUrl("");
      setRawContent("");
      setTags("");
      refetchFeeds();
    },
    onError: (err) => toast.error(`Submission failed: ${err.message}`),
  });

  const triggerCrawl = trpc.feed.triggerCrawl.useMutation({
    onSuccess: (data) => toast.success(data.message),
    onError: (err) => toast.error(err.message),
  });

  const seedQueue = trpc.feed.seedCrawlQueue.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchCrawlQueue();
    },
    onError: (err) => toast.error(err.message),
  });

  const { data: feedsData, refetch: refetchFeeds } = trpc.feed.list.useQuery(
    { limit: 30, offset: 0 },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: crawlQueue, refetch: refetchCrawlQueue } = trpc.feed.crawlQueue.useQuery(
    { limit: 20 },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Card className="bg-[#12121a] border-indigo-500/20 max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Brain className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Owner Access Required</h2>
            <p className="text-slate-400 mb-6">The Feed Manager is restricted to Unstor's owner only.</p>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
              <a href={getLoginUrl()}>Sign In as Owner</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const typeConfig = FEED_TYPE_CONFIG[feedType];
  const TypeIcon = typeConfig.icon;

  const handleSubmit = () => {
    if (feedType === "url" && !sourceUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }
    if (feedType !== "url" && !rawContent.trim()) {
      toast.error("Please enter some content");
      return;
    }
    submitFeed.mutate({
      feedType,
      title: title || undefined,
      sourceUrl: feedType === "url" ? sourceUrl : undefined,
      rawContent: feedType !== "url" ? rawContent : undefined,
      tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <div className="border-b border-indigo-500/10 bg-[#0d0d14]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-white text-sm">← Back</Link>
            <span className="text-slate-600">/</span>
            <div className="flex items-center gap-2">
              <Rss className="w-5 h-5 text-indigo-400" />
              <span className="text-white font-semibold">Feed Manager</span>
            </div>
          </div>
          <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20">
            Owner Only
          </Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Teach <span className="text-indigo-400">Unstor</span>
          </h1>
          <p className="text-slate-400">
            Submit links, books, data, and text for Unstor to learn from. Every feed becomes part of Unstor's permanent knowledge.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#12121a] border border-indigo-500/10 mb-6">
            <TabsTrigger value="submit" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <Plus className="w-4 h-4 mr-2" />
              Submit Feed
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <Brain className="w-4 h-4 mr-2" />
              Learning History ({feedsData?.feeds?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="crawler" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <Globe className="w-4 h-4 mr-2" />
              Web Crawler
            </TabsTrigger>
          </TabsList>

          {/* ── Submit Feed Tab ── */}
          <TabsContent value="submit">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Feed Type Selector */}
              <div className="lg:col-span-1 space-y-3">
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Feed Type</h3>
                {(Object.entries(FEED_TYPE_CONFIG) as [keyof typeof FEED_TYPE_CONFIG, typeof FEED_TYPE_CONFIG[keyof typeof FEED_TYPE_CONFIG]][]).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => setFeedType(type)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        feedType === type
                          ? "border-indigo-500 bg-indigo-500/10"
                          : "border-slate-700/50 bg-[#12121a] hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <Icon className={`w-4 h-4 ${config.color}`} />
                        <span className="text-white text-sm font-medium">{config.label}</span>
                      </div>
                      <p className="text-xs text-slate-500 ml-7">{config.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Feed Form */}
              <div className="lg:col-span-2">
                <Card className="bg-[#12121a] border-indigo-500/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                      {typeConfig.label}
                    </CardTitle>
                    <CardDescription className="text-slate-400">{typeConfig.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Title (optional)</label>
                      <Input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Give this feed a descriptive title..."
                        className="bg-[#0a0a0f] border-slate-700 text-white placeholder:text-slate-600"
                      />
                    </div>

                    {feedType === "url" ? (
                      <div>
                        <label className="text-sm text-slate-400 mb-1 block">URL *</label>
                        <Input
                          value={sourceUrl}
                          onChange={e => setSourceUrl(e.target.value)}
                          placeholder="https://example.com/article-to-learn-from"
                          className="bg-[#0a0a0f] border-slate-700 text-white placeholder:text-slate-600"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="text-sm text-slate-400 mb-1 block">Content *</label>
                        <Textarea
                          value={rawContent}
                          onChange={e => setRawContent(e.target.value)}
                          placeholder={
                            feedType === "book"
                              ? "Paste book chapters or long-form content here..."
                              : feedType === "data"
                              ? "Paste JSON, CSV, or structured data here..."
                              : "Paste your text, article, or notes here..."
                          }
                          className="bg-[#0a0a0f] border-slate-700 text-white placeholder:text-slate-600 min-h-[200px] font-mono text-sm"
                        />
                        <p className="text-xs text-slate-600 mt-1">{rawContent.split(/\s+/).filter(Boolean).length} words</p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Tags (comma-separated, optional)</label>
                      <Input
                        value={tags}
                        onChange={e => setTags(e.target.value)}
                        placeholder="ifa, herbs, medicine, africa..."
                        className="bg-[#0a0a0f] border-slate-700 text-white placeholder:text-slate-600"
                      />
                    </div>

                    <Button
                      onClick={handleSubmit}
                      disabled={submitFeed.isPending}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {submitFeed.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Unstor is learning...</>
                      ) : (
                        <><Brain className="w-4 h-4 mr-2" /> Submit to Unstor</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ── Learning History Tab ── */}
          <TabsContent value="history">
            <div className="space-y-3">
              {!feedsData?.feeds?.length ? (
                <Card className="bg-[#12121a] border-indigo-500/10">
                  <CardContent className="p-12 text-center">
                    <Brain className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No feeds submitted yet. Start teaching Unstor!</p>
                  </CardContent>
                </Card>
              ) : (
                feedsData.feeds.map((feed: any) => {
                  const status = STATUS_CONFIG[feed.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
                  const StatusIcon = status.icon;
                  return (
                    <Card key={feed.id} className="bg-[#12121a] border-slate-700/30 hover:border-indigo-500/20 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-medium truncate">
                                {feed.title ?? feed.sourceUrl ?? "Untitled Feed"}
                              </span>
                              <Badge variant="outline" className="text-xs shrink-0 border-slate-600 text-slate-400">
                                {feed.feedType}
                              </Badge>
                            </div>
                            {feed.processedContent && (
                              <p className="text-sm text-slate-400 line-clamp-2">{feed.processedContent}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                              {feed.wordCount > 0 && <span>{feed.wordCount.toLocaleString()} words</span>}
                              {feed.nodesCreated > 0 && <span className="text-indigo-400">{feed.nodesCreated} knowledge nodes created</span>}
                              {feed.chunkCount > 0 && <span>{feed.chunkCount} chunks</span>}
                              <span>{new Date(feed.createdAt).toLocaleDateString()}</span>
                            </div>
                            {(feed.tags as string[] ?? []).length > 0 && (
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {(feed.tags as string[]).map((tag: string) => (
                                  <Badge key={tag} className="text-xs bg-indigo-500/10 text-indigo-300 border-indigo-500/20">{tag}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${status.bg} shrink-0`}>
                            <StatusIcon className={`w-3.5 h-3.5 ${status.color} ${feed.status === "processing" ? "animate-spin" : ""}`} />
                            <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                          </div>
                        </div>
                        {feed.errorMessage && (
                          <p className="text-xs text-red-400 mt-2 bg-red-500/5 rounded p-2">{feed.errorMessage}</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* ── Web Crawler Tab ── */}
          <TabsContent value="crawler">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#12121a] border-indigo-500/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-indigo-400" />
                    Autonomous Web Learning
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Unstor crawls the web autonomously to learn from trusted sources on African medicine, Ifá, Chinese TCM, and health knowledge.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => seedQueue.mutate()}
                    disabled={seedQueue.isPending}
                    variant="outline"
                    className="w-full border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
                  >
                    {seedQueue.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rss className="w-4 h-4 mr-2" />}
                    Seed Learning Sources
                  </Button>
                  <Button
                    onClick={() => triggerCrawl.mutate()}
                    disabled={triggerCrawl.isPending}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    {triggerCrawl.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />}
                    Crawl Next URL
                  </Button>
                  <Button
                    onClick={() => refetchCrawlQueue()}
                    variant="ghost"
                    size="sm"
                    className="w-full text-slate-400 hover:text-white"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-2" />
                    Refresh Queue
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-[#12121a] border-indigo-500/10">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Crawl Queue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {!crawlQueue?.length ? (
                      <p className="text-slate-500 text-sm text-center py-4">Queue is empty. Seed learning sources first.</p>
                    ) : (
                      crawlQueue.map((item: any) => {
                        const status = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
                        const StatusIcon = status.icon;
                        return (
                          <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-[#0a0a0f]">
                            <StatusIcon className={`w-3.5 h-3.5 ${status.color} shrink-0 ${item.status === "crawling" ? "animate-spin" : ""}`} />
                            <span className="text-xs text-slate-400 truncate flex-1">{item.url}</span>
                            {item.nodesCreated > 0 && (
                              <span className="text-xs text-indigo-400 shrink-0">{item.nodesCreated} nodes</span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Simple Link component for internal navigation
function Link({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return <a href={href} className={className}>{children}</a>;
}
