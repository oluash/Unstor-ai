import React from "react";

interface QuoteBlockProps {
  quote: string;
  source: string;
  type: "odu" | "science";
  yorubaLine?: string; // Yoruba original for ODU quotes
}

/**
 * Styled quote block used inside Unstor responses.
 * - "odu" variant: amber/gold accent — for Ifá verses and Odù proverbs
 *   Shows Yoruba original (italic, muted) above English translation when available
 * - "science" variant: indigo/cyan accent — for scientific findings and citations
 */
export function QuoteBlock({ quote, source, type, yorubaLine }: QuoteBlockProps) {
  const isOdu = type === "odu";

  return (
    <div className={`quote-block ${isOdu ? "quote-block--odu" : "quote-block--science"}`}>
      <div className="quote-block__mark">{"\u201C"}</div>
      {isOdu && yorubaLine && (
        <blockquote className="quote-block__yoruba">{yorubaLine}</blockquote>
      )}
      <blockquote className="quote-block__text">{quote}</blockquote>
      {isOdu && yorubaLine && (
        <div className="quote-block__lang-label">Yoruba · English</div>
      )}
      <cite className="quote-block__source">
        {isOdu ? "📿 " : "🔬 "}
        {source}
      </cite>
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
