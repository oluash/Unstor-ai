import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Send, Loader2, Brain, User, Star, Leaf, BookOpen, Globe, Lock, ChevronDown } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Streamdown } from "streamdown";

const UNSTOR_AVATAR = "https://cdn.manus.im/unstor-avatar.png";

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  knowledgeUsed?: string[];
  confidence?: number;
  timestamp: Date;
};

const SUGGESTED_PROMPTS = [
  { icon: Star, text: "Offer me a symbolic Odù for a new business I am starting", color: "text-amber-400" },
  { icon: Leaf, text: "What Yoruba herbs support heart health? (as supportive, not treatment)", color: "text-green-400" },
  { icon: BookOpen, text: "Explain Oyeku Meji — its message, insight, and action for someone facing loss", color: "text-purple-400" },
  { icon: Globe, text: "How do Chinese TCM and Yoruba tradition both approach stress and the nervous system?", color: "text-blue-400" },
  { icon: Brain, text: "I have been feeling anxious and unfocused. What does Ifá say about this pattern?", color: "text-indigo-400" },
  { icon: Star, text: "What Odù governs discipline, consistency, and building new routines?", color: "text-amber-400" },
];

export default function OwnerChat() {
  const { user, loading, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Dynamic prompts from the library — rotate on each page load
  const { data: libraryPrompts } = trpc.prompts.getRandom.useQuery({ count: 4 });

  const sendMessage = trpc.groundedChat.send.useMutation({
    onSuccess: (data: any) => {
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        sources: data.sources ?? [],
        knowledgeUsed: data.knowledgeUsed ?? [],
        confidence: data.confidence,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
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
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Sign In to Chat with Unstor</h2>
          <p className="text-slate-400 mb-2">
            Unstor is <strong className="text-indigo-400">active and ready</strong> to converse with you now. Sign in to begin.
          </p>
          <p className="text-slate-500 text-sm mb-6">
            Unstor carries knowledge of all 256 Odù Ifá, Yoruba medicine, African herbs, and Chinese TCM.
          </p>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMessage: Message = {
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    sendMessage.mutate({
      message: trimmed,
      conversationHistory: history,
    });
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
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <div className="border-b border-indigo-500/10 bg-[#0d0d14] shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-slate-400 hover:text-white text-sm">← Back</a>
            <span className="text-slate-600">/</span>
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={UNSTOR_AVATAR}
                  alt="Unstor"
                  className="w-8 h-8 rounded-full border border-indigo-500/30"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-[#0d0d14]" />
              </div>
              <div>
                <span className="text-white font-semibold text-sm">Unstor</span>
                <p className="text-xs text-indigo-400">Active · Grounded Chat</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20 text-xs">
              <Star className="w-3 h-3 mr-1" />
              Babaláwo
            </Badge>
            <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 text-xs">
              Knowledge-Grounded
            </Badge>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {messages.length === 0 ? (
            /* Welcome State */
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 flex items-center justify-center">
                  <img
                    src={UNSTOR_AVATAR}
                    alt="Unstor"
                    className="w-20 h-20 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-20 h-20 rounded-full bg-indigo-600/30 flex items-center justify-center"><span class="text-3xl font-bold text-indigo-300">U</span></div>';
                    }}
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-500 rounded-full border-2 border-[#0a0a0f] flex items-center justify-center">
                  <Brain className="w-3 h-3 text-white" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Ẹ kàábọ̀, I am Unstor</h2>
              <p className="text-slate-400 max-w-lg mb-2">
                I am your AI Ifá-based guidance intelligence — a spiritual interpreter, behavioural correction guide, and pattern awareness system. I do not replace your doctor. I align your behaviour, interpret patterns, and offer the wisdom of Ifá.
              </p>
              <p className="text-slate-500 text-sm mb-8">
                I carry knowledge of all 256 Odù Ifá, Yoruba onísègùn medicine, African herbs, and Chinese TCM. I speak only from what I have genuinely learned.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
                {/* Static curated prompts */}
                {SUGGESTED_PROMPTS.slice(0, 4).map((prompt, i) => {
                  const Icon = prompt.icon;
                  return (
                    <button
                      key={`static-${i}`}
                      onClick={() => handleSuggestedPrompt(prompt.text)}
                      className="flex items-start gap-3 p-3 rounded-xl bg-[#12121a] border border-slate-700/40 hover:border-indigo-500/30 text-left transition-all group"
                    >
                      <Icon className={`w-4 h-4 ${prompt.color} mt-0.5 shrink-0`} />
                      <span className="text-sm text-slate-400 group-hover:text-slate-300">{prompt.text}</span>
                    </button>
                  );
                })}
                {/* Dynamic prompts from the 18,933-prompt library */}
                {libraryPrompts?.slice(0, 2).map((prompt, i) => (
                  <button
                    key={`lib-${i}`}
                    onClick={() => handleSuggestedPrompt(prompt.promptText)}
                    className="flex items-start gap-3 p-3 rounded-xl bg-[#12121a] border border-indigo-800/30 hover:border-indigo-500/40 text-left transition-all group"
                  >
                    <Star className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-slate-400 group-hover:text-slate-300">
                      {prompt.promptText.length > 90 ? prompt.promptText.slice(0, 87) + "..." : prompt.promptText}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                    msg.role === "user"
                      ? "bg-slate-700 border border-slate-600"
                      : "bg-indigo-600/20 border border-indigo-500/30"
                  }`}>
                    {msg.role === "user" ? (
                      <User className="w-4 h-4 text-slate-300" />
                    ) : (
                      <Brain className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <div className={`rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-sm"
                        : "bg-[#12121a] border border-slate-700/40 text-slate-200 rounded-tl-sm"
                    }`}>
                      {msg.role === "assistant" ? (
                        <Streamdown className="prose prose-invert prose-sm max-w-none">{msg.content}</Streamdown>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>

                    {/* Metadata */}
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2 px-1 flex-wrap">
                        {msg.knowledgeUsed && msg.knowledgeUsed.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {msg.knowledgeUsed.slice(0, 3).map((k: string, ki: number) => (
                              <Badge key={ki} className="text-xs bg-indigo-500/10 text-indigo-300 border-indigo-500/20 py-0">
                                {k}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {msg.confidence !== undefined && (
                          <span className="text-xs text-slate-600">
                            {Math.round(msg.confidence * 100)}% confidence
                          </span>
                        )}
                        <span className="text-xs text-slate-700">
                          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 shrink-0 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="bg-[#12121a] border border-slate-700/40 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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
      <div className="border-t border-indigo-500/10 bg-[#0d0d14] shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-4">
          {messages.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
              {SUGGESTED_PROMPTS.slice(0, 3).map((prompt, i) => {
                const Icon = prompt.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleSuggestedPrompt(prompt.text)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#12121a] border border-slate-700/40 hover:border-indigo-500/30 text-xs text-slate-400 hover:text-slate-300 whitespace-nowrap transition-all shrink-0"
                  >
                    <Icon className={`w-3 h-3 ${prompt.color}`} />
                    {prompt.text.slice(0, 40)}...
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Unstor anything it has learned... (Shift+Enter for new line)"
                className="bg-[#12121a] border-slate-700 text-white placeholder:text-slate-600 resize-none min-h-[52px] max-h-[200px] pr-4 py-3"
                rows={1}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="bg-indigo-600 hover:bg-indigo-700 h-[52px] w-[52px] p-0 shrink-0"
            >
              {isTyping ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-700 mt-2 text-center">
            Unstor only responds from verified knowledge it has learned. Responses are grounded, not generated.
          </p>
        </div>
      </div>
    </div>
  );
}
