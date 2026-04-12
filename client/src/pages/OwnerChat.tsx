import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Loader2, Brain, User, Star, Leaf, BookOpen,
  Globe, Lock, ChevronDown, ChevronUp, Volume2, VolumeX,
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { Streamdown } from "streamdown";
import { QuoteBlock, parseQuotes } from "@/components/QuoteBlock";

const UNSTOR_AVATAR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663246644329/WtjdqCZuUAjS52crCAfDKK/unstor-avatar-o6axhgpSuTHquWi5bcWcYG.webp";

// Height threshold above which a response is considered "long"
const COLLAPSE_THRESHOLD = 200;

interface SectionImage {
  sectionIndex: number;
  url: string;
  caption: string | null;
}

interface ResponseSection {
  heading: string;
  body: string;
}

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  knowledgeUsed?: string[];
  confidence?: number;
  timestamp: Date;
  sectionImages?: SectionImage[];
};

const SUGGESTED_PROMPTS = [
  { icon: Star, text: "Offer me a symbolic Odù for a new business I am starting", color: "text-amber-400" },
  { icon: Leaf, text: "What Yoruba herbs support heart health? (as supportive, not treatment)", color: "text-green-400" },
  { icon: BookOpen, text: "Explain Oyeku Meji — its message, insight, and action for someone facing loss", color: "text-purple-400" },
  { icon: Globe, text: "How do Chinese TCM and Yoruba tradition both approach stress and the nervous system?", color: "text-blue-400" },
  { icon: Brain, text: "I have been feeling anxious and unfocused. What does Ifá say about this pattern?", color: "text-indigo-400" },
  { icon: Star, text: "What Odù governs discipline, consistency, and building new routines?", color: "text-amber-400" },
];

// ─── Helpers (shared with Chat.tsx logic) ────────────────────────────────────

function extractTopic(content: string): string {
  const pillar1Match = content.match(/PILLAR\s+1[^:]*:\s*([^\n]{10,80})/i);
  if (pillar1Match) return pillar1Match[1].trim();
  const firstSentence = content.replace(/[#*_>`]/g, "").split(/[.!?]/)[0]?.trim();
  return firstSentence?.slice(0, 120) ?? content.slice(0, 120);
}

function extractOduName(content: string): string | undefined {
  const match = content.match(
    /\b(Ogbe|Oyeku|Iwori|Odi|Irosun|Owonrin|Obara|Okanran|Ogunda|Osa|Ika|Oturupon|Otura|Irete|Ose|Ofun)\s+\w+/i
  );
  return match?.[0];
}

function splitIntoPillarSections(content: string): ResponseSection[] {
  const pillarRegex = /(?=(?:#{1,3}\s*)?PILLAR\s+[123])/gi;
  const parts = content.split(pillarRegex).filter(Boolean);
  if (parts.length <= 1) return [{ heading: "", body: content }];
  return parts.map((part) => {
    const nl = part.indexOf("\n");
    const heading = nl > -1 ? part.slice(0, nl).trim() : part.trim();
    const body = nl > -1 ? part.slice(nl + 1).trim() : "";
    return { heading, body };
  });
}

function sectionSnippet(section: ResponseSection): string {
  return (section.heading + " " + section.body).replace(/[#*_>`]/g, "").trim().slice(0, 300);
}

function pillarDomain(idx: number): string {
  if (idx === 0) return "ifa_studies";
  if (idx === 1) return "quantum_physics";
  return "nature";
}

// ─── Expand / Collapse wrapper ────────────────────────────────────────────────

function ExpandableContent({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      if (el.scrollHeight > COLLAPSE_THRESHOLD + 20) {
        setNeedsCollapse(true);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [children]);

  return (
    <div>
      <div
        ref={contentRef}
        className={needsCollapse && !expanded ? "response-collapsed" : "response-expanded"}
      >
        {children}
      </div>
      {needsCollapse && (
        <button onClick={() => setExpanded((v) => !v)} className="expand-toggle">
          {expanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> Read more</>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Assistant message card ───────────────────────────────────────────────────

function AssistantMessage({
  msg,
  index,
  speakingIndex,
  onSpeak,
}: {
  msg: Message;
  index: number;
  speakingIndex: number | null;
  onSpeak: (text: string, idx: number) => void;
}) {
  const sections = splitIntoPillarSections(msg.content);
  const hasPillars = sections.length > 1;

  const renderSections = () =>
    sections.map((section, sIdx) => {
      const img = msg.sectionImages?.find((i) => i.sectionIndex === sIdx);
      const { cleaned: cleanedBody, oduQuote, sciQuote } = parseQuotes(section.body);
      const isPillar1 = sIdx === 0;
      const isPillar2 = sIdx === 1;
      return (
        <div key={sIdx} className="pillar-section">
          {section.heading && (
            <Streamdown className="chat-prose">{section.heading}</Streamdown>
          )}
          {cleanedBody && (
            <Streamdown className="chat-prose">{cleanedBody}</Streamdown>
          )}
          {isPillar1 && oduQuote && (
            <QuoteBlock quote={oduQuote.quote} source={oduQuote.source} type="odu" />
          )}
          {isPillar2 && sciQuote && (
            <QuoteBlock quote={sciQuote.quote} source={sciQuote.source} type="science" />
          )}
          {img?.url && (
            <div className="ai-image-block">
              <img
                src={img.url}
                alt={img.caption ?? "AI-generated illustration"}
                loading="lazy"
              />
              {img.caption && <p className="image-caption">{img.caption}</p>}
            </div>
          )}
        </div>
      );
    });

  const renderSingle = () => (
    <>
      <Streamdown className="chat-prose">{msg.content}</Streamdown>
      {msg.sectionImages && msg.sectionImages.length > 0 && msg.sectionImages[0]?.url && (
        <div className="ai-image-block">
          <img
            src={msg.sectionImages[0].url}
            alt={msg.sectionImages[0].caption ?? "AI-generated illustration"}
            loading="lazy"
          />
          {msg.sectionImages[0].caption && (
            <p className="image-caption">{msg.sectionImages[0].caption}</p>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="flex gap-2 sm:gap-3">
      {/* Avatar */}
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden flex-shrink-0 mt-0.5">
        <img src={UNSTOR_AVATAR} alt="Unstor" className="w-full h-full object-cover" />
      </div>

      {/* Full-width response card */}
      <div className="flex-1 min-w-0">
        <div className="ai-response-container rounded-2xl rounded-tl-sm">
          <ExpandableContent>
            {hasPillars ? renderSections() : renderSingle()}
          </ExpandableContent>

          {/* Footer: metadata + TTS + timestamp */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {msg.knowledgeUsed && msg.knowledgeUsed.length > 0 && (
                <>
                  {msg.knowledgeUsed.slice(0, 3).map((k, ki) => (
                    <Badge key={ki} className="text-xs bg-indigo-500/10 text-indigo-300 border-indigo-500/20 py-0">
                      {k}
                    </Badge>
                  ))}
                </>
              )}
              {msg.confidence !== undefined && (
                <span className="text-xs text-muted-foreground">
                  {Math.round(msg.confidence * 100)}% confidence
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <button
              onClick={() => onSpeak(msg.content, index)}
              title={speakingIndex === index ? "Stop speaking" : "Listen to response"}
              className="text-muted-foreground hover:text-primary transition-colors p-0.5"
            >
              {speakingIndex === index
                ? <VolumeX className="w-3 h-3" />
                : <Volume2 className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OwnerChat() {
  const { user, loading, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: libraryPrompts } = trpc.prompts.getRandom.useQuery({ count: 4 });
  const generateContextImage = trpc.chat.generateContextImage.useMutation();

  const speakMessage = (text: string, index: number) => {
    if (!window.speechSynthesis) {
      toast.error("Text-to-speech is not supported in this browser.");
      return;
    }
    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_~>]/g, "").replace(/\n+/g, " ");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("natural")) ??
      voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = trpc.groundedChat.send.useMutation({
    onSuccess: async (data: any) => {
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        sources: data.sources ?? [],
        knowledgeUsed: data.knowledgeUsed ?? [],
        confidence: data.confidence,
        timestamp: new Date(),
        sectionImages: [],
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);

      // Generate per-section images in background
      const sections = splitIntoPillarSections(data.response);
      const oduName = extractOduName(data.response);
      const globalTopic = extractTopic(data.response);

      sections.slice(0, 3).forEach((section, sIdx) => {
        const sectionTopic = section.heading
          ? section.heading.replace(/[#*_]/g, "").trim()
          : globalTopic;
        const snippet = sectionSnippet(section);
        const domain = pillarDomain(sIdx);

        generateContextImage
          .mutateAsync({
            topic: sectionTopic || globalTopic,
            oduName: sIdx === 0 ? oduName : undefined,
            domain,
            paragraphSnippet: snippet,
          })
          .then((result) => {
            if (!result.url) return;
            setMessages((prev) => {
              const lastIdx = prev.length - 1;
              if (lastIdx < 0 || prev[lastIdx].role !== "assistant") return prev;
              const updated = { ...prev[lastIdx] };
              updated.sectionImages = [
                ...(updated.sectionImages ?? []),
                { sectionIndex: sIdx, url: result.url!, caption: result.caption ?? null },
              ];
              return [...prev.slice(0, lastIdx), updated];
            });
          })
          .catch(() => {
            // Silent — response still shows without image
          });
      });
    },
    onError: (err) => {
      toast.error(`Unstor encountered an error: ${err.message}`);
      setIsTyping(false);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Sign In to Chat with Unstor</h2>
          <p className="text-muted-foreground mb-2">
            Unstor is <strong className="text-primary">active and ready</strong> to converse with you now. Sign in to begin.
          </p>
          <p className="text-muted-foreground text-sm mb-6">
            Unstor carries knowledge of all 256 Odù Ifá, Yoruba medicine, African herbs, and Chinese TCM.
          </p>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;
    const userMessage: Message = { role: "user", content: trimmed, timestamp: new Date() };
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    sendMessage.mutate({ message: trimmed, conversationHistory: history });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedPrompt = (text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50 flex-shrink-0">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <a href="/" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">
              ← Back
            </a>
            <span className="text-border">|</span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <img
                  src={UNSTOR_AVATAR}
                  alt="Unstor"
                  className="w-7 h-7 rounded-lg object-cover"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full border-2 border-background" />
              </div>
              <div>
                <span className="text-foreground font-semibold text-sm">Unstor</span>
                <p className="text-xs text-primary leading-none">Active · Grounded Chat</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20 text-xs hidden sm:flex">
              <Star className="w-3 h-3 mr-1" />
              Babaláwo
            </Badge>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
              Knowledge-Grounded
            </Badge>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="container py-4 sm:py-6">
          {messages.length === 0 ? (
            /* Welcome State */
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-600/20 border border-primary/20 flex items-center justify-center overflow-hidden">
                  <img src={UNSTOR_AVATAR} alt="Unstor" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full border-2 border-background flex items-center justify-center">
                  <Brain className="w-3 h-3 text-primary-foreground" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-2">Ẹ kàábọ̀, I am Unstor</h2>
              <p className="text-muted-foreground max-w-lg mb-2">
                I am your AI Ifá-based guidance intelligence — a spiritual interpreter, behavioural correction guide, and pattern awareness system. I do not replace your doctor. I align your behaviour, interpret patterns, and offer the wisdom of Ifá.
              </p>
              <p className="text-muted-foreground text-sm mb-8">
                I carry knowledge of all 256 Odù Ifá, Yoruba onísègùn medicine, African herbs, and Chinese TCM.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
                {SUGGESTED_PROMPTS.slice(0, 4).map((prompt, i) => {
                  const Icon = prompt.icon;
                  return (
                    <button
                      key={`static-${i}`}
                      onClick={() => handleSuggestedPrompt(prompt.text)}
                      className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 text-left transition-all group"
                    >
                      <Icon className={`w-4 h-4 ${prompt.color} mt-0.5 shrink-0`} />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground">{prompt.text}</span>
                    </button>
                  );
                })}
                {libraryPrompts?.slice(0, 2).map((prompt, i) => (
                  <button
                    key={`lib-${i}`}
                    onClick={() => handleSuggestedPrompt(prompt.promptText)}
                    className="flex items-start gap-3 p-3 rounded-xl bg-card border border-primary/20 hover:border-primary/40 text-left transition-all group"
                  >
                    <Star className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground">
                      {prompt.promptText.length > 90 ? prompt.promptText.slice(0, 87) + "..." : prompt.promptText}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="space-y-5">
              {messages.map((msg, i) =>
                msg.role === "user" ? (
                  /* User message — compact right-aligned */
                  <div key={i} className="flex gap-2 sm:gap-3 flex-row-reverse">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-secondary border border-border mt-0.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 max-w-[80%] sm:max-w-[70%] bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 sm:px-4 py-2.5 overflow-hidden">
                      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                      <div className="flex items-center justify-end mt-1.5">
                        <span className="text-xs text-primary-foreground/60">
                          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Assistant message — full width */
                  <AssistantMessage
                    key={i}
                    msg={msg}
                    index={i}
                    speakingIndex={speakingIndex}
                    onSpeak={speakMessage}
                  />
                )
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden flex-shrink-0 mt-0.5">
                    <img src={UNSTOR_AVATAR} alt="Unstor" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 ai-response-container rounded-2xl rounded-tl-sm">
                    <div className="flex items-center gap-1.5 h-5">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full typing-dot" />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full typing-dot" />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full typing-dot" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm flex-shrink-0">
        <div className="container py-3 sm:py-4">
          {messages.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
              {SUGGESTED_PROMPTS.slice(0, 3).map((prompt, i) => {
                const Icon = prompt.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleSuggestedPrompt(prompt.text)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border hover:border-primary/30 text-xs text-muted-foreground hover:text-foreground whitespace-nowrap transition-all shrink-0"
                  >
                    <Icon className={`w-3 h-3 ${prompt.color}`} />
                    {prompt.text.slice(0, 40)}...
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-2 items-end">
            <div className="flex-1 relative min-w-0">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Unstor anything it has learned... (Shift+Enter for new line)"
                className="resize-none min-h-[40px] sm:min-h-[44px] max-h-[120px] bg-card border-border focus:border-primary/50 text-foreground placeholder:text-muted-foreground rounded-xl pr-3 py-2.5 text-sm custom-scrollbar"
                rows={1}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              size="icon"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
            >
              {isTyping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Unstor only responds from verified knowledge it has learned. Responses are grounded, not generated.
          </p>
        </div>
      </div>
    </div>
  );
}
