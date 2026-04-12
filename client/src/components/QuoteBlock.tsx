import React, { useState, useCallback } from "react";
import { Link } from "wouter";
import { Copy, Check, Volume2, VolumeX, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface QuoteBlockProps {
  quote: string;
  source: string;
  type: "odu" | "science";
  yorubaLine?: string; // Yoruba original for ODU quotes
}

/**
 * Styled quote block used inside Unstor responses.
 * - "odu" variant: amber/gold accent — for Ifá verses and Odù proverbs
 *   Shows Yoruba original (italic, muted) above English translation when available.
 *   Includes: Copy verse button, Yoruba TTS button, View Odù reference link.
 * - "science" variant: indigo/cyan accent — for scientific findings and citations
 */
export function QuoteBlock({ quote, source, type, yorubaLine }: QuoteBlockProps) {
  const isOdu = type === "odu";
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // Extract Odù name from source (e.g. "Ogbe Meji — Ifá corpus, Ese 3" → "Ogbe Meji")
  const oduNameForLink = isOdu ? (source.split("—")[0]?.trim() ?? source) : "";

  const handleCopy = useCallback(() => {
    const textToCopy = yorubaLine
      ? `${yorubaLine}\n\n${quote}\n\n— ${source}`
      : `${quote}\n\n— ${source}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      toast.success("Verse copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error("Could not copy — please copy manually");
    });
  }, [quote, source, yorubaLine]);

  const handleSpeak = useCallback(() => {
    if (!window.speechSynthesis) {
      toast.error("Text-to-speech is not supported in this browser.");
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const textToSpeak = yorubaLine ?? quote;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.85;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;
    // Prefer a Yoruba or African voice if available, else use a natural English voice
    const voices = window.speechSynthesis.getVoices();
    const yorubaVoice =
      voices.find((v) => v.lang.startsWith("yo")) ??
      voices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("natural")) ??
      voices.find((v) => v.lang.startsWith("en"));
    if (yorubaVoice) utterance.voice = yorubaVoice;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }, [speaking, yorubaLine, quote]);

  return (
    <div className={`quote-block ${isOdu ? "quote-block--odu" : "quote-block--science"}`}>
      <div className="quote-block__mark">{"\u201C"}</div>

      {/* Yoruba original */}
      {isOdu && yorubaLine && (
        <blockquote className="quote-block__yoruba">{yorubaLine}</blockquote>
      )}

      {/* English translation */}
      <blockquote className="quote-block__text">{quote}</blockquote>

      {/* Language label */}
      {isOdu && yorubaLine && (
        <div className="quote-block__lang-label">Yoruba · English</div>
      )}

      {/* Footer: source + action buttons */}
      <div className="quote-block__footer">
        <cite className="quote-block__source">
          {isOdu ? "📿 " : "🔬 "}
          {isOdu ? (
            <Link
              href={`/ifa/${encodeURIComponent(oduNameForLink)}`}
              className="hover:underline hover:opacity-90 transition-opacity"
            >
              {source}
            </Link>
          ) : source}
        </cite>

        {/* Action buttons — only on ODU blocks */}
        {isOdu && (
          <div className="quote-block__actions">
            {/* TTS — read Yoruba aloud */}
            <button
              onClick={handleSpeak}
              title={speaking ? "Stop recitation" : "Listen to Yoruba verse"}
              className="quote-block__action-btn"
              aria-label={speaking ? "Stop" : "Listen"}
            >
              {speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Copy verse */}
            <button
              onClick={handleCopy}
              title="Copy verse to clipboard"
              className="quote-block__action-btn"
              aria-label="Copy verse"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* View full Odù reference */}
            <Link
              href={`/ifa/${encodeURIComponent(oduNameForLink)}`}
              className="quote-block__action-btn quote-block__ref-link"
              title={`View full ${oduNameForLink} reference`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">View Odù</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Parse ODU_QUOTE_YO / ODU_QUOTE / ODU_SOURCE and SCI_QUOTE / SCI_SOURCE markers from a text block.
 * Returns the text with markers removed, plus extracted quote data.
 */
export function parseQuotes(text: string): {
  cleaned: string;
  oduQuote: { quote: string; source: string; yorubaLine?: string } | null;
  sciQuote: { quote: string; source: string } | null;
} {
  let cleaned = text;
  let oduQuote: { quote: string; source: string; yorubaLine?: string } | null = null;
  let sciQuote: { quote: string; source: string } | null = null;

  const lines = cleaned.split("\n");
  let oduQuoteYoLine = "";
  let oduQuoteLine = "";
  let oduSourceLine = "";
  let sciQuoteLine = "";
  let sciSourceLine = "";
  const keptLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("ODU_QUOTE_YO:")) {
      oduQuoteYoLine = trimmed.replace("ODU_QUOTE_YO:", "").trim().replace(/^["']|["']$/g, "");
    } else if (trimmed.startsWith("ODU_QUOTE:")) {
      oduQuoteLine = trimmed.replace("ODU_QUOTE:", "").trim().replace(/^["']|["']$/g, "");
    } else if (trimmed.startsWith("ODU_SOURCE:")) {
      oduSourceLine = trimmed.replace("ODU_SOURCE:", "").trim().replace(/^["']|["']$/g, "");
    } else if (trimmed.startsWith("SCI_QUOTE:")) {
      sciQuoteLine = trimmed.replace("SCI_QUOTE:", "").trim().replace(/^["']|["']$/g, "");
    } else if (trimmed.startsWith("SCI_SOURCE:")) {
      sciSourceLine = trimmed.replace("SCI_SOURCE:", "").trim().replace(/^["']|["']$/g, "");
    } else {
      keptLines.push(line);
    }
  }

  if (oduQuoteLine && oduSourceLine) {
    oduQuote = {
      quote: oduQuoteLine,
      source: oduSourceLine,
      ...(oduQuoteYoLine ? { yorubaLine: oduQuoteYoLine } : {}),
    };
  }
  if (sciQuoteLine && sciSourceLine) {
    sciQuote = { quote: sciQuoteLine, source: sciSourceLine };
  }

  cleaned = keptLines.join("\n").trim();

  return { cleaned, oduQuote, sciQuote };
}
