import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Brain, ArrowLeft, Loader2, User, Sparkles, Send } from "lucide-react";
import { Streamdown } from "streamdown";
import { nanoid } from "nanoid";
import { toast } from "sonner";

const UNSTOR_AVATAR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663246644329/WtjdqCZuUAjS52crCAfDKK/unstor-avatar-o6axhgpSuTHquWi5bcWcYG.webp";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
        <Brain className="w-4 h-4 text-primary" />
      </div>
      <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center h-5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary typing-dot" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary typing-dot" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary typing-dot" />
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const { user } = useAuth();
  const [sessionKey] = useState(() => `session_${nanoid()}`);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Dynamic prompt suggestions from the library
  const { data: dynamicSuggestions } = trpc.prompts.getRandom.useQuery({ count: 6 });

  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response, timestamp: new Date() },
      ]);
      setIsLoading(false);
    },
    onError: (err) => {
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
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
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="container max-w-3xl py-8 space-y-6">
          {/* Welcome state */}
          {messages.length === 0 && (
            <div className="text-center py-16 space-y-4">
              <img src={UNSTOR_AVATAR} alt="Unstor" className="w-16 h-16 rounded-2xl object-cover mx-auto" />
              <div>
                <h2 className="text-xl font-display font-semibold text-foreground">Unstor is listening</h2>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                  Every message you send becomes part of Unstor's growing knowledge. Ask anything.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                {(dynamicSuggestions && dynamicSuggestions.length > 0
                  ? dynamicSuggestions.map((s) => s.promptText)
                  : [
                      "What are you learning?",
                      "Tell me about yourself",
                      "How does your learning work?",
                      "What can you help me with?",
                    ]
                ).map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all text-left max-w-xs"
                  >
                    {suggestion.length > 80 ? suggestion.slice(0, 77) + "..." : suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${
                  message.role === "user"
                    ? "bg-secondary border border-border"
                    : "border-0"
                }`}
              >
                {message.role === "user" ? (
                  <User className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <img src={UNSTOR_AVATAR} alt="Unstor" className="w-full h-full object-cover" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-card border border-border text-card-foreground rounded-tl-sm"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <Streamdown>{message.content}</Streamdown>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                )}
                <div
                  className={`text-xs mt-2 ${
                    message.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container max-w-3xl py-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Unstor..."
                className="resize-none min-h-[52px] max-h-[200px] bg-card border-border focus:border-primary/50 text-foreground placeholder:text-muted-foreground rounded-xl pr-4 py-3 custom-scrollbar"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="w-[52px] h-[52px] rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            <Sparkles className="w-3 h-3 inline mr-1 text-primary" />
            Every conversation deepens Unstor's knowledge
          </p>
        </div>
      </div>
    </div>
  );
}
