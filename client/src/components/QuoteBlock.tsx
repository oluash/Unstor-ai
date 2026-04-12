import React from "react";

interface QuoteBlockProps {
  quote: string;
  source: string;
  type: "odu" | "science";
}

/**
 * Styled quote block used inside Unstor responses.
 * - "odu" variant: amber/gold accent — for Ifá verses and Odù proverbs
 * - "science" variant: indigo/cyan accent — for scientific findings and citations
 */
export function QuoteBlock({ quote, source, type }: QuoteBlockProps) {
  const isOdu = type === "odu";

  return (
    <div className={`quote-block ${isOdu ? "quote-block--odu" : "quote-block--science"}`}>
      <div className="quote-block__mark">{"\u201C"}</div>
      <blockquote className="quote-block__text">{quote}</blockquote>
      <cite className="quote-block__source">
        {isOdu ? "📿 " : "🔬 "}
        {source}
      </cite>
    </div>
  );
}

/**
 * Parse ODU_QUOTE / ODU_SOURCE and SCI_QUOTE / SCI_SOURCE markers from a text block.
 * Returns the text with markers removed, plus extracted quote data.
 */
export function parseQuotes(text: string): {
  cleaned: string;
  oduQuote: { quote: string; source: string } | null;
  sciQuote: { quote: string; source: string } | null;
} {
  let cleaned = text;
  let oduQuote: { quote: string; source: string } | null = null;
  let sciQuote: { quote: string; source: string } | null = null;

  // Use line-by-line parsing to avoid /s flag (ES2018 only)
  const lines = cleaned.split("\n");
  let oduQuoteLine = "";
  let oduSourceLine = "";
  let sciQuoteLine = "";
  let sciSourceLine = "";
  const keptLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("ODU_QUOTE:")) {
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
    oduQuote = { quote: oduQuoteLine, source: oduSourceLine };
  }
  if (sciQuoteLine && sciSourceLine) {
    sciQuote = { quote: sciQuoteLine, source: sciSourceLine };
  }

  cleaned = keptLines.join("\n").trim();

  return { cleaned, oduQuote, sciQuote };
}
