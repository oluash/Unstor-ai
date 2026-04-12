import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Brain, ArrowLeft, Loader2, User, Sparkles, Send,
  Mic, MicOff, Download, Volume2, VolumeX, ChevronDown, ChevronUp,
} from "lucide-react";
import { Streamdown } from "streamdown";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { QuoteBlock, parseQuotes } from "@/components/QuoteBlock";

const UNSTOR_AVATAR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663246644329/WtjdqCZuUAjS52crCAfDKK/unstor-avatar-o6axhgpSuTHquWi5bcWcYG.webp";

// Height threshold (px) above which a response is considered "long"
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

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sectionImages?: SectionImage[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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

/**
 * Split a markdown response into sections by PILLAR headings.
 * Falls back to a single section if no PILLAR headings are found.
 */
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

/** Extract a short snippet from a section body for the image prompt */
function sectionSnippet(section: ResponseSection): string {
  const raw = (section.heading + " " + section.body).replace(/[#*_>`]/g, "").trim();
  return raw.slice(0, 300);
}

/** Domain for image generation based on pillar index */
function pillarDomain(idx: number): string {
  if (idx === 0) return "ifa_studies";
  if (idx === 1) return "quantum_physics";
  return "nature";
}

// ─── Typing indicator ────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2">
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden flex-shrink-0 mt-0.5">
        <img src={UNSTOR_AVATAR} alt="Unstor" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 ai-response-container rounded-2xl rounded-tl-sm">
        <div className="flex gap-1.5 items-center h-5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary typing-dot" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary typing-dot" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary typing-dot" />
        </div>
      </div>
    </div>
  );
}

// ─── Expand/collapse wrapper ─────────────────────────────────────────────────

function ExpandableContent({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    // Give the DOM time to paint before measuring
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
        <button
          onClick={() => setExpanded((v) => !v)}
          className="expand-toggle"
        >
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

// ─── Single assistant message ─────────────────────────────────────────────────

function AssistantMessage({
  message,
  index,
  speakingIndex,
  onSpeak,
}: {
  message: Message;
  index: number;
  speakingIndex: number | null;
  onSpeak: (text: string, idx: number) => void;
}) {
  const sections = splitIntoPillarSections(message.content);
  const hasPillars = sections.length > 1;

  const renderSections = () =>
    sections.map((section, sIdx) => {
      const img = message.sectionImages?.find((i) => i.sectionIndex === sIdx);
      // Parse quote markers out of the body text
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
          {/* Odu verse quote — shown in Pillar 1 */}
          {isPillar1 && oduQuote && (
            <QuoteBlock quote={oduQuote.quote} source={oduQuote.source} type="odu" yorubaLine={oduQuote.yorubaLine} />
          )}
          {/* Scientific quote — shown in Pillar 2 */}
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
              {img.caption && (
                <p className="image-caption">{img.caption}</p>
              )}
            </div>
          )}
        </div>
      );
    });

  const renderSingle = () => (
    <>
      <Streamdown className="chat-prose">{message.content}</Streamdown>
      {message.sectionImages && message.sectionImages.length > 0 && message.sectionImages[0]?.url && (
        <div className="ai-image-block">
          <img
            src={message.sectionImages[0].url}
            alt={message.sectionImages[0].caption ?? "AI-generated illustration"}
            loading="lazy"
          />
          {message.sectionImages[0].caption && (
            <p className="image-caption">{message.sectionImages[0].caption}</p>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="flex items-start gap-2">
      {/* Avatar */}
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden flex-shrink-0 mt-0.5">
        <img src={UNSTOR_AVATAR} alt="Unstor" className="w-full h-full object-cover" />
      </div>

      {/* Full-width response card */}
      <div className="flex-1 min-w-0 ai-response-container rounded-2xl rounded-tl-sm">
        <ExpandableContent>
          {hasPillars ? renderSections() : renderSingle()}
        </ExpandableContent>

        {/* Footer: timestamp + TTS */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30 gap-2">
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button
            onClick={() => onSpeak(message.content, index)}
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
  );
}

// ─── SpeechRecognition types ─────────────────────────────────────────────────

interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

// ─── Main Chat page ───────────────────────────────────────────────────────────

export default function Chat() {
  const { user } = useAuth();
  const [sessionKey] = useState(() => `session_${nanoid()}`);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const startVoiceInput = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast.error("Voice input is not supported in this browser.");
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as any[])
        .map((r: any) => r[0].transcript)
        .join("");
      setInput(transcript);
    };
    recognition.onerror = () => {
      toast.error("Voice recognition error. Please try again.");
      setIsRecording(false);
    };
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const exportConversation = () => {
    if (!messages.length) {
      toast.error("No messages to export.");
      return;
    }
    const lines = messages.map(
      (m) =>
        `[${m.timestamp.toLocaleTimeString()}] ${m.role === "user" ? "You" : "Unstor"}: ${m.content}`
    );
    const blob = new Blob([lines.join("\n\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unstor-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Conversation exported.");
  };

  const { data: dynamicSuggestions } = trpc.prompts.getRandom.useQuery({ count: 6 });
  const generateContextImage = trpc.chat.generateContextImage.useMutation();

  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: async (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response, timestamp: new Date(), sectionImages: [] },
      ]);
      setIsLoading(false);

      const sections = splitIntoPillarSections(data.response);
      const oduName = extractOduName(data.response);
      const globalTopic = extractTopic(data.response);

      // Generate one image per pillar section in parallel
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
    onError: () => {
      toast.error("Unstor encountered an issue. Please try again.");
      setIsLoading(false);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    const userMessage: Message = { role: "user", content: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    sendMessage.mutate({
      sessionKey,
      message: trimmed,
      history: messages.map((m) => ({ role: m.role, content: m.content })),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50 flex-shrink-0">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground w-8 h-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <img src={UNSTOR_AVATAR} alt="Unstor" className="w-7 h-7 rounded-lg object-cover" />
              <span className="font-display font-semibold text-sm text-foreground">Unstor</span>
            </div>
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary learning-pulse mr-1.5" />
              Learning
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {messages.length > 0 ? `${messages.length} messages` : "New conversation"}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="container py-4 sm:py-6 space-y-4 sm:space-y-5">
          {/* Welcome state */}
          {messages.length === 0 && (
            <div className="text-center py-12 space-y-4">
              <img src={UNSTOR_AVATAR} alt="Unstor" className="w-16 h-16 rounded-2xl object-cover mx-auto" />
              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">Start a Guided Session</h2>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                  Describe your situation, concern, or question. Unstor will respond with Ifá wisdom, science, and a real-world example.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                {(dynamicSuggestions && dynamicSuggestions.length > 0
                  ? dynamicSuggestions.map((s) => s.promptText)
                  : [
                      "Help me understand a situation I'm dealing with",
                      "Show me patterns in my behaviour",
                      "Give me a symbolic interpretation (not divination)",
                      "Combine traditional and modern perspective on this issue",
                    ]
                ).map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all text-left max-w-[260px]"
                  >
                    {suggestion.length > 80 ? suggestion.slice(0, 77) + "..." : suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((message, index) =>
            message.role === "user" ? (
              /* User message — compact right-aligned bubble */
              <div key={index} className="flex items-start gap-2 flex-row-reverse">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-secondary border border-border mt-0.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 max-w-[80%] sm:max-w-[70%] bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 sm:px-4 py-2.5 overflow-hidden">
                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
                  <div className="flex items-center justify-end mt-1.5">
                    <span className="text-xs text-primary-foreground/60">
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Assistant message — full width */
              <AssistantMessage
                key={index}
                message={message}
                index={index}
                speakingIndex={speakingIndex}
                onSpeak={speakMessage}
              />
            )
          )}

          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm flex-shrink-0">
        <div className="container py-3 sm:py-4">
          <div className="flex gap-2 items-end">
            <Button
              onClick={startVoiceInput}
              size="icon"
              variant="outline"
              title={isRecording ? "Stop recording" : "Voice input"}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex-shrink-0 transition-all ${
                isRecording
                  ? "border-red-500/60 bg-red-500/10 text-red-400 hover:bg-red-500/20 animate-pulse"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
              }`}
              disabled={isLoading}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <div className="flex-1 relative min-w-0">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRecording ? "Listening..." : "Message Unstor..."}
                className="resize-none min-h-[40px] sm:min-h-[44px] max-h-[120px] bg-card border-border focus:border-primary/50 text-foreground placeholder:text-muted-foreground rounded-xl pr-3 py-2.5 text-sm custom-scrollbar"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 inline mr-1 text-primary" />
              Every conversation deepens Unstor's knowledge
            </p>
            {messages.length > 0 && (
              <button
                onClick={exportConversation}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <Download className="w-3 h-3" />
                Export
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
