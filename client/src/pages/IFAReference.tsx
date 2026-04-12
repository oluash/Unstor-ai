import { useParams, Link } from "wouter";
import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Streamdown } from "streamdown";
import { ArrowLeft, BookOpen, Loader2, Leaf, Shield, Sparkles, Hash, Palette, Star, Copy, Check, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

export default function IFAReference() {
  const params = useParams<{ oduName: string }>();
  const oduName = decodeURIComponent(params.oduName ?? "");
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const { data, isLoading, error } = trpc.ifa.getByName.useQuery(
    { name: oduName },
    { enabled: !!oduName }
  );

  const odu = data?.odu;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/chat">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2 ml-1">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-muted-foreground">Ifá Reference</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <p className="text-muted-foreground text-sm">Consulting the Ifá corpus for <strong className="text-foreground">{oduName}</strong>…</p>
          </div>
        )}

        {error && (
          <div className="text-center py-24">
            <p className="text-destructive mb-2">Could not load this Odù.</p>
            <p className="text-muted-foreground text-sm">{error.message}</p>
          </div>
        )}

        {odu && (
          <div className="space-y-8">
            {/* Title block */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 flex-wrap">
                <h1 className="text-3xl sm:text-4xl font-bold gradient-text leading-tight">
                  {odu.primaryName}
                </h1>
                {odu.oduNumber > 0 && (
                  <Badge className="mt-1.5 bg-amber-500/10 text-amber-400 border-amber-500/20">
                    <Hash className="w-3 h-3 mr-1" />
                    Odù {odu.oduNumber}
                  </Badge>
                )}
                {data?.source === "llm" && (
                  <Badge className="mt-1.5 bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI-generated
                  </Badge>
                )}
              </div>
              {odu.summary && (
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  {odu.summary}
                </p>
              )}
              {/* Themes */}
              {odu.themes && odu.themes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {odu.themes.map((t: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Ese verse */}
            {odu.eseVerses && (
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    The Ese (Sacred Verse)
                  </h2>
                  <div className="flex items-center gap-2">
                    {/* TTS */}
                    <button
                      onClick={() => {
                        if (!window.speechSynthesis) { toast.error("TTS not supported"); return; }
                        if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
                        window.speechSynthesis.cancel();
                        const utt = new SpeechSynthesisUtterance(odu.eseVerses ?? "");
                        utt.rate = 0.82; utt.pitch = 1.05;
                        const voices = window.speechSynthesis.getVoices();
                        const v = voices.find(v => v.lang.startsWith("yo")) ?? voices.find(v => v.lang.startsWith("en"));
                        if (v) utt.voice = v;
                        utt.onend = () => setSpeaking(false);
                        utt.onerror = () => setSpeaking(false);
                        window.speechSynthesis.speak(utt);
                        setSpeaking(true);
                      }}
                      className="quote-block__action-btn"
                      title={speaking ? "Stop" : "Listen to verse"}
                    >
                      {speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span className="text-xs hidden sm:inline">{speaking ? "Stop" : "Listen"}</span>
                    </button>
                    {/* Copy */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(odu.eseVerses ?? "").then(() => {
                          setCopied(true);
                          toast.success("Verse copied to clipboard");
                          setTimeout(() => setCopied(false), 2000);
                        }).catch(() => toast.error("Could not copy"));
                      }}
                      className="quote-block__action-btn"
                      title="Copy verse"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="text-xs hidden sm:inline">Copy</span>
                    </button>
                  </div>
                </div>
                <div className="ifa-verse-block">
                  <Streamdown className="chat-prose">{odu.eseVerses}</Streamdown>
                </div>
              </section>
            )}

            {/* Life applications */}
            {odu.lifeApplications && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-indigo-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Life Applications
                </h2>
                <div className="prose-section">
                  <Streamdown className="chat-prose">{odu.lifeApplications}</Streamdown>
                </div>
              </section>
            )}

            {/* Taboos */}
            {odu.taboos && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-rose-400 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Taboos (Eewo)
                </h2>
                <div className="prose-section border-l-2 border-rose-500/30 pl-4">
                  <Streamdown className="chat-prose">{odu.taboos}</Streamdown>
                </div>
              </section>
            )}

            {/* Prescriptions */}
            {odu.prescriptions && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-green-400 flex items-center gap-2">
                  <Leaf className="w-4 h-4" />
                  Prescriptions (Ebo)
                </h2>
                <div className="prose-section border-l-2 border-green-500/30 pl-4">
                  <Streamdown className="chat-prose">{odu.prescriptions}</Streamdown>
                </div>
              </section>
            )}

            {/* Attributes grid */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                Attributes
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {odu.deities && odu.deities.length > 0 && (
                  <div className="ifa-attr-card">
                    <p className="ifa-attr-label">Associated Orisha</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {odu.deities.map((d: string, i: number) => (
                        <Badge key={i} className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-xs">{d}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {odu.herbs && odu.herbs.length > 0 && (
                  <div className="ifa-attr-card">
                    <p className="ifa-attr-label flex items-center gap-1"><Leaf className="w-3 h-3 text-green-400" /> Herbs</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {odu.herbs.map((h: string, i: number) => (
                        <Badge key={i} className="bg-green-500/10 text-green-300 border-green-500/20 text-xs">{h}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {odu.colors && odu.colors.length > 0 && (
                  <div className="ifa-attr-card">
                    <p className="ifa-attr-label flex items-center gap-1"><Palette className="w-3 h-3 text-pink-400" /> Colors</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {odu.colors.map((c: string, i: number) => (
                        <Badge key={i} className="bg-pink-500/10 text-pink-300 border-pink-500/20 text-xs">{c}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {odu.numbers && odu.numbers.length > 0 && (
                  <div className="ifa-attr-card">
                    <p className="ifa-attr-label flex items-center gap-1"><Hash className="w-3 h-3 text-amber-400" /> Sacred Numbers</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {odu.numbers.map((n: number, i: number) => (
                        <Badge key={i} className="bg-amber-500/10 text-amber-300 border-amber-500/20 text-xs">{n}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Footer */}
            <div className="pt-4 border-t border-border/40 text-xs text-muted-foreground">
              {data?.source === "llm"
                ? "This reference was generated by Unstor's AI from the Ifá corpus. For ceremonial use, always consult a trained Babaláwo."
                : "Source: Unstor knowledge base — Ifá corpus."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
