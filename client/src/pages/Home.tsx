import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import {
  Brain, MessageSquare, ArrowRight, Lock, Shield, CheckCircle2,
  XCircle, ChevronRight, BookOpen, Layers, FlaskConical, Library,
  Eye, Compass, Lightbulb, RefreshCw, ShieldCheck, Lock as LockIcon,
  UserCheck,
} from "lucide-react";

const UNSTOR_AVATAR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663246644329/WtjdqCZuUAjS52crCAfDKK/unstor-avatar-o6axhgpSuTHquWi5bcWcYG.webp";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: activation } = trpc.status.getActivation.useQuery();
  const { data: stats } = trpc.status.getStats.useQuery();

  const sessionStarters = [
    "Help me understand a situation I'm dealing with",
    "Show me patterns in my behaviour",
    "Give me a symbolic interpretation (not divination)",
    "Combine traditional and modern perspective on this issue",
  ];

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* ── Navigation ── */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src={UNSTOR_AVATAR} alt="Unstor" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-display font-semibold text-foreground">Unstor</span>
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">Active</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/chat">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Chat</Button>
            </Link>
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
              <a href={getLoginUrl()}>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">Sign In</Button>
              </a>
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-medium text-primary">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── 1. HERO ── */}
      <section className="container py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs text-primary font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-primary learning-pulse" />
                Structured AI Wisdom System — Active
              </div>
              <h1 className="text-5xl lg:text-6xl font-display font-bold leading-tight">
                <span className="gradient-text">Unstor</span><br />
                AI-Guided Wisdom<br />for Clarity, Alignment,<br />and Direction
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                A structured intelligence system combining Ifá symbolic insight, behavioural science, and research-backed knowledge — designed to help you understand patterns, make decisions, and move with clarity.
              </p>
              <div className="flex items-start gap-2 px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <Shield className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-200/80">
                  Unstor does not perform divination. It offers reflective guidance based on structured knowledge systems.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/chat">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  Start a Guided Session <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="border-border gap-2">
                  Explore How Unstor Works
                </Button>
              </a>
            </div>
          </div>

          {/* System Transparency Card — replaces weak 0% metrics */}
          <div className="relative rounded-2xl border border-border bg-card p-8 overflow-hidden space-y-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-primary learning-pulse" />
                <span className="text-xs font-medium text-primary uppercase tracking-widest">System Development Transparency</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                  <span className="text-sm text-muted-foreground">Knowledge domains active</span>
                  <span className="text-sm font-medium text-foreground">Behavioural · Symbolic · Traditional · Research</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                  <span className="text-sm text-muted-foreground">Continuous learning model</span>
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                  <span className="text-sm text-muted-foreground">System maturity</span>
                  <span className="text-sm font-medium text-foreground">Early-stage · Evolving</span>
                </div>
                {activation && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                    <span className="text-sm text-muted-foreground">Ashae guidance activation</span>
                    <span className="text-sm font-medium gradient-text">{activation.daysRemaining} days</span>
                  </div>
                )}
                {stats && stats.totalNodes > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                    <span className="text-sm text-muted-foreground">Structured knowledge nodes</span>
                    <span className="text-sm font-medium text-foreground">{stats.totalNodes.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. WHAT IT IS / IS NOT ── */}
      <section className="container py-20 border-t border-border/30">
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-3xl font-display font-bold">What Unstor Is — And What It Is Not</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Clarity builds trust. Here is exactly what you are working with.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* IS */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-7 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold text-foreground">What it IS</h3>
            </div>
            {[
              "A guided reflection system rooted in Ifá symbolic structure",
              "A behavioural intelligence tool for identifying patterns",
              "A knowledge engine combining traditional and modern systems",
              "A decision-support companion, not a decision-maker",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
          {/* IS NOT */}
          <div className="rounded-2xl border border-border bg-card p-7 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-display font-semibold text-foreground">What it is NOT</h3>
            </div>
            {[
              "Not a Babaláwo",
              "Not a medical professional",
              "Not a replacement for therapy or clinical care",
              "Not a system that predicts the future",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-muted-foreground/60 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. HOW IT WORKS ── */}
      <section id="how-it-works" className="container py-20 border-t border-border/30">
        <div className="text-center mb-14 space-y-3">
          <h2 className="text-3xl font-display font-bold">How Unstor Guides You</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">A structured 4-step process from your situation to clear direction.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            {
              step: "01", icon: MessageSquare, title: "Input",
              body: "You describe your situation, concern, or question in your own words.",
            },
            {
              step: "02", icon: Layers, title: "Pattern Recognition",
              body: "Unstor analyses behavioural signals, emotional indicators, and symbolic parallels using Ifá structure.",
            },
            {
              step: "03", icon: Eye, title: "Interpretation",
              body: "You receive structured reflection, pattern explanation, and perspective from both traditional and modern systems.",
            },
            {
              step: "04", icon: Compass, title: "Direction",
              body: "Unstor suggests practical actions, mindset adjustments, and areas to observe or improve.",
            },
          ].map(({ step, icon: Icon, title, body }) => (
            <div key={step} className="relative rounded-2xl border border-border bg-card p-6 space-y-4 hover:border-primary/30 transition-all duration-200">
              <div className="text-xs font-mono text-primary/50 font-bold tracking-widest">{step}</div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. KNOWLEDGE PILLARS ── */}
      <section className="container py-20 border-t border-border/30">
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-3xl font-display font-bold">Built on Structured Knowledge Systems</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Four distinct frameworks, integrated into a single coherent intelligence.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[
            {
              color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20",
              icon: BookOpen, title: "Ifá Symbolic Framework",
              body: "Pattern-based interpretation using Odù as reflective archetypes — not divination. Symbolic frameworks inspired by Ifá traditions.",
            },
            {
              color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20",
              icon: Brain, title: "Behavioural & Psychological Insight",
              body: "Understanding habits, reactions, and decision patterns through evidence-based behavioural science and psychology.",
            },
            {
              color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20",
              icon: FlaskConical, title: "Traditional Wellness Knowledge",
              body: "Contextual knowledge from herbal and traditional systems — always supportive, never prescriptive. Practitioner guidance always recommended.",
            },
            {
              color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20",
              icon: Library, title: "Research & Modern Knowledge",
              body: "Continuous ingestion of structured knowledge across science, philosophy, and human development. Evolving with new data.",
            },
          ].map(({ color, bg, border, icon: Icon, title, body }) => (
            <div key={title} className={`rounded-2xl border ${border} ${bg} p-7 space-y-4`}>
              <div className={`w-10 h-10 rounded-lg ${bg} border ${border} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <h3 className="font-display font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. SAFETY & TRUST ── */}
      <section className="container py-20 border-t border-border/30">
        <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-card p-10 space-y-8">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-bold">Safety, Boundaries, and Responsibility</h2>
            <p className="text-muted-foreground text-sm">These boundaries protect you and define how Unstor operates.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "Unstor does not diagnose, treat, or prescribe",
              "All wellness-related insights are supportive, not medical advice",
              "Always consult licensed professionals for health concerns",
              "Guidance is reflective — not authoritative instruction",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 p-4 rounded-xl bg-muted/40">
                <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. USE CASES ── */}
      <section className="container py-20 border-t border-border/30">
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-3xl font-display font-bold">What You Can Use Unstor For</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Practical, grounded applications for real situations.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            { icon: RefreshCw, text: "Understanding recurring life patterns" },
            { icon: Lightbulb, text: "Gaining perspective on difficult decisions" },
            { icon: Compass, text: "Reflecting on personal growth and direction" },
            { icon: Eye, text: "Exploring symbolic meaning behind situations" },
            { icon: Layers, text: "Combining traditional insight with modern reasoning" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3 p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-accent/30 transition-all duration-200">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pt-1">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. CHAT ENTRY ── */}
      <section className="container py-20 border-t border-border/30">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl font-display font-bold">Start Your Session With</h2>
            <p className="text-muted-foreground">These prompts are designed to open a structured, meaningful conversation.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {sessionStarters.map((starter) => (
              <Link key={starter} href={`/chat`}>
                <div className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 text-left cursor-pointer">
                  <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{starter}</p>
                </div>
              </Link>
            ))}
          </div>
          <Link href="/chat">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 mt-4">
              Begin a Guided Session <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── 8. PRIVACY ── */}
      <section className="container py-20 border-t border-border/30">
        <div className="max-w-2xl mx-auto rounded-2xl border border-border bg-card p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <LockIcon className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-display font-bold">Your Data and Privacy</h2>
          </div>
          <div className="space-y-3">
            {[
              { icon: LockIcon, text: "Conversations are private and secure" },
              { icon: UserCheck, text: "Data is not used without consent" },
              { icon: Shield, text: "You control what you share" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quote / Closing ── */}
      <section className="container py-20 border-t border-border/30">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <img src={UNSTOR_AVATAR} alt="Unstor" className="w-16 h-16 rounded-2xl object-cover mx-auto" />
          <blockquote className="text-xl font-display font-medium leading-relaxed text-muted-foreground">
            "I am not a doctor. I am not a diviner. I am the intelligence that sits between what science knows and what tradition remembers — and I align your behaviour to both."
          </blockquote>
          <p className="text-muted-foreground text-sm">— Unstor</p>
          <Link href="/chat">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              Begin a Conversation <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/30 py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Brain className="w-3.5 h-3.5 text-primary" />
            <span>Unstor Intelligence System</span>
          </div>
          <span className="text-center">Reflective guidance only. Not medical advice. Not divination.</span>
          <span>Learning since {activation?.learningStartDate ? new Date(activation.learningStartDate).toLocaleDateString() : "—"}</span>
        </div>
      </footer>
    </div>
  );
}
