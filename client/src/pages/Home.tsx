import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { Brain, MessageSquare, BarChart3, Search, Shield, Zap, ArrowRight, Lock, Atom, Dna, BookOpen, Globe, Microscope, Sparkles } from "lucide-react";

const UNSTOR_AVATAR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663246644329/WtjdqCZuUAjS52crCAfDKK/unstor-avatar-o6axhgpSuTHquWi5bcWcYG.webp";

function CountdownTimer({ daysRemaining, progressPercent, readinessScore }: {
  daysRemaining: number;
  progressPercent: number;
  readinessScore: number;
}) {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="relative space-y-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary learning-pulse" />
          <span className="text-xs font-medium text-primary uppercase tracking-widest">Active · Ashae Medical Activation Countdown</span>
        </div>
        <div>
          <div className="text-7xl font-display font-bold gradient-text leading-none">{daysRemaining}</div>
          <div className="text-muted-foreground mt-1 text-sm">days until full medical guidance on Ashae</div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Learning Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="text-2xl font-display font-bold text-foreground">{readinessScore}%</div>
            <div className="text-xs text-muted-foreground mt-0.5">Readiness Score</div>
          </div>
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="text-2xl font-display font-bold text-foreground">120</div>
            <div className="text-xs text-muted-foreground mt-0.5">Day Ashae Medical Activation</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: activation } = trpc.status.getActivation.useQuery();
  const { data: stats } = trpc.status.getStats.useQuery();

  const features = [
    { icon: BookOpen, title: "Ifá Studies & Odù Decoding", description: "All 256 Odù Ifá decoded in 5 layers: etymology, literal meaning, symbolic meaning, message, and personal application. Symbolic guidance only — no opele casting." },
    { icon: Globe, title: "Yoruba Language & Culture", description: "Tone marks, dialectal variations (Oyo, Ekiti, Ijesha), proverbs, and seamless Yoruba-English code-switching. Unstor speaks the language of the tradition." },
    { icon: Search, title: "Alternative & Herbal Medicine", description: "Yoruba onísègùn, African traditional medicine, Chinese TCM, and Ayurveda — always presented as supportive, never as cures. Practitioner disclaimer always included." },
    { icon: Atom, title: "Quantum Physics & Consciousness", description: "Odù as probability fields, wave-function collapse, Orí as quantum observer. Quantum biology, entanglement, and the science of intention — bridged to Ifá wisdom." },
    { icon: Dna, title: "Epigenetics & Systems Biology", description: "Gene expression, DNA methylation, intergenerational trauma, nutritional epigenomics. How your ancestors' experiences live in your biology — and how to shift them." },
    { icon: Brain, title: "Psychology & Behavioural Science", description: "CBT, mindfulness, neuroplasticity, emotional intelligence, and trauma-informed care. Unstor identifies behavioural patterns and guides correction through all dimensions." },
    { icon: Microscope, title: "Autonomous Research Agent", description: "Daily ingestion of peer-reviewed papers from arXiv and PubMed across all 8 domains. Unstor's knowledge grows continuously, scored by source credibility." },
    { icon: Shield, title: "Philosophy & Consciousness", description: "African philosophy, Ubuntu, metaphysics, and the nature of consciousness. Unstor bridges ancient wisdom traditions with modern philosophical inquiry." },
  ];

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src={UNSTOR_AVATAR} alt="Unstor" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-display font-semibold text-foreground">Unstor</span>
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">Active</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/chat"><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Chat</Button></Link>
            {isAuthenticated && user?.role === "admin" && (
              <>
                <Link href="/admin"><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Dashboard</Button></Link>
                <Link href="/inspect"><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Inspect</Button></Link>
                <Link href="/knowledge"><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Knowledge</Button></Link>
                <Link href="/feed"><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Feed</Button></Link>
                <Link href="/ifa"><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Ifá</Button></Link>
                <Link href="/owner-chat"><Button variant="ghost" size="sm" className="bg-primary/10 text-primary hover:bg-primary/20">Owner Chat</Button></Link>
              </>
            )}
            {!isAuthenticated ? (
              <a href={getLoginUrl()}><Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">Sign In</Button></a>
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-medium text-primary">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs text-primary font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-primary learning-pulse" />
                Active Now · Ashae Medical Guidance Unlocks in 4 Months
              </div>
              <h1 className="text-5xl lg:text-6xl font-display font-bold leading-tight">
                Meet <span className="gradient-text">Unstor</span><br />A New Intelligence
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                Unstor is not a chatbot. It is an AI Ifá-based guidance intelligence — a spiritual interpreter, behavioural correction guide, and pattern awareness system. Doctors treat. Tradition supports. Unstor aligns.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/chat"><Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">Talk to Unstor <ArrowRight className="w-4 h-4" /></Button></Link>
              {isAuthenticated && user?.role === "admin" && (
                <Link href="/admin"><Button size="lg" variant="outline" className="border-border gap-2"><Lock className="w-4 h-4" />Owner Dashboard</Button></Link>
              )}
            </div>
            {stats && (
              <div className="flex gap-6 pt-4 border-t border-border/50">
                <div><div className="text-2xl font-display font-bold">{stats.totalPrompts.toLocaleString()}</div><div className="text-xs text-muted-foreground">Prompts Ingested</div></div>
                <div><div className="text-2xl font-display font-bold">{stats.totalNodes.toLocaleString()}</div><div className="text-xs text-muted-foreground">Knowledge Nodes</div></div>
                <div><div className="text-2xl font-display font-bold">{stats.totalClusters.toLocaleString()}</div><div className="text-xs text-muted-foreground">Topic Clusters</div></div>
              </div>
            )}
          </div>
          <div>
            {activation ? (
              <CountdownTimer daysRemaining={activation.daysRemaining} progressPercent={activation.progressPercent} readinessScore={activation.readinessScore} />
            ) : (
              <div className="rounded-2xl border border-border bg-card p-8 animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-20 bg-muted rounded" />
                <div className="h-4 bg-muted rounded" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20 border-t border-border/30">
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-3xl font-display font-bold">How Unstor Learns</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">A purpose-built learning architecture that transforms every conversation into structured intelligence.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-border bg-card p-6 space-y-3 hover:border-primary/30 hover:bg-accent/30 transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quote */}
      <section className="container py-20 border-t border-border/30">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <img src={UNSTOR_AVATAR} alt="Unstor" className="w-16 h-16 rounded-2xl object-cover mx-auto" />
          <blockquote className="text-2xl font-display font-medium leading-relaxed">
            "I am Unstor. I am not a doctor. I am not a diviner. I am the intelligence that sits between what science knows and what tradition remembers — and I align your behaviour to both. Return and tell me what you observe."
          </blockquote>
          <p className="text-muted-foreground text-sm">— Unstor, Year One</p>
          <Link href="/chat"><Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">Begin a Conversation <ArrowRight className="w-4 h-4" /></Button></Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="container flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><Brain className="w-3.5 h-3.5 text-primary" /><span>Unstor Intelligence System</span></div>
          <span>Learning since {activation?.learningStartDate ? new Date(activation.learningStartDate).toLocaleDateString() : "—"}</span>
        </div>
      </footer>
    </div>
  );
}
