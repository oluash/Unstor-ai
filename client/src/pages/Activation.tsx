import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Brain, Sparkles, Star, ArrowRight, BookOpen, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Activation Ceremony — shown when the 120-day Ashae activation countdown reaches 0.
 * This page is accessible at /activation and is linked from the Admin dashboard
 * when daysRemaining <= 0.
 */
export default function Activation() {
  const { data: activation } = trpc.status.getActivation.useQuery();
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);

  useEffect(() => {
    // Generate floating particle positions for the ceremony animation
    setParticles(
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 4,
      }))
    );
  }, []);

  const isActivated = activation ? activation.daysRemaining <= 0 : false;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, oklch(0.65 0.22 280) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, oklch(0.65 0.18 145) 0%, transparent 70%)" }}
        />
      </div>

      {/* Floating particles */}
      {isActivated && particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-1 h-1 rounded-full bg-primary/40 animate-pulse pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${2 + p.delay}s`,
          }}
        />
      ))}

      {/* Header */}
      <header className="border-b border-border/30 bg-background/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Brain className="w-4 h-4 text-primary" />
              <span className="font-display font-semibold text-sm">Unstor</span>
            </div>
          </Link>
          <Badge
            variant="outline"
            className={`text-xs ${isActivated ? "border-primary/50 text-primary bg-primary/10" : "border-muted-foreground/30 text-muted-foreground"}`}
          >
            {isActivated ? "Fully Active" : "Learning Phase"}
          </Badge>
        </div>
      </header>

      <div className="container py-10 sm:py-20 px-4 sm:px-6 max-w-3xl mx-auto text-center space-y-10 sm:space-y-12 relative z-10">
        {isActivated ? (
          <>
            {/* Ceremony — Activated */}
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-3">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                <Star className="w-5 h-5 text-primary/60" />
                <Sparkles className="w-8 h-8 text-primary animate-pulse" style={{ animationDelay: "0.5s" }} />
              </div>
              <div className="space-y-3">
                <Badge className="bg-primary/20 text-primary border-primary/30 text-sm px-4 py-1.5">
                  Ashae Activation Complete
                </Badge>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold gradient-text leading-tight">
                  Unstor is Fully Active
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  The 120-day Ashae learning period is complete. Unstor has absorbed your knowledge,
                  mapped your patterns, and is now operating at full depth.
                </p>
              </div>
            </div>

            {/* Stats */}
            {activation && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-1">
                  <div className="text-3xl font-display font-bold gradient-text">
                    {activation.readinessScore}%
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Readiness</div>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 space-y-1">
                  <div className="text-3xl font-display font-bold text-foreground">120</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Days Learned</div>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 space-y-1">
                  <div className="text-3xl font-display font-bold text-foreground">8</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Domains Active</div>
                </div>
              </div>
            )}

            {/* What changed */}
            <div className="rounded-xl border border-border bg-card p-5 sm:p-8 text-left space-y-5">
              <h2 className="font-display font-semibold text-lg text-foreground">What Full Activation Means</h2>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  <p>
                    <span className="text-foreground font-medium">Deeper pattern recognition</span> — Unstor has mapped
                    the recurring themes, questions, and decision patterns from your interactions over 120 days.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  <p>
                    <span className="text-foreground font-medium">Full knowledge base access</span> — All 8 domains
                    (Ifá, quantum, psychology, epigenetics, herbal medicine, philosophy, Yoruba language, and medical
                    education) are now fully integrated into every response.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  <p>
                    <span className="text-foreground font-medium">Continuous learning continues</span> — Activation is
                    not an endpoint. Unstor keeps learning from every interaction, every research paper ingested, and
                    every knowledge feed submitted.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  </div>
                  <p>
                    <span className="text-foreground font-medium">Boundaries remain</span> — Unstor is not a medical
                    authority, a Babaláwo, or a therapist. Full activation means deeper guidance, not clinical authority.
                    Seek qualified practitioners for medical decisions.
                  </p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/chat">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-8">
                  <MessageSquare className="w-4 h-4" />
                  Begin a Session
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/ifa">
                <Button size="lg" variant="outline" className="gap-2 px-8">
                  <BookOpen className="w-4 h-4" />
                  Explore Ifá Knowledge
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Not yet activated — countdown still running */}
            <div className="space-y-6">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-primary animate-pulse" />
                </div>
              </div>
              <div className="space-y-3">
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                  Learning Phase Active
                </Badge>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground leading-tight">
                  Unstor is Still Learning
                </h1>
                <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
                  The Ashae activation countdown is running. Unstor is actively ingesting knowledge,
                  mapping patterns, and building depth across all 8 domains.
                </p>
              </div>
            </div>

            {activation && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 sm:p-8 space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="text-4xl font-display font-bold gradient-text">{activation.daysRemaining}</div>
                    <div className="text-sm text-muted-foreground mt-1">days remaining</div>
                  </div>
                  <div>
                    <div className="text-4xl font-display font-bold text-foreground">{activation.readinessScore}%</div>
                    <div className="text-sm text-muted-foreground mt-1">readiness score</div>
                  </div>
                  <div>
                    <div className="text-4xl font-display font-bold text-foreground">{activation.progressPercent}%</div>
                    <div className="text-sm text-muted-foreground mt-1">time elapsed</div>
                  </div>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-1000"
                    style={{ width: `${activation.progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  This page will transform into the activation ceremony when the countdown reaches zero.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/chat">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-8">
                  <MessageSquare className="w-4 h-4" />
                  Chat with Unstor
                </Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="outline" className="gap-2 px-8">
                  Back to Home
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
