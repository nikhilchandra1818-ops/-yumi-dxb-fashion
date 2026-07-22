import React from "react";

/**
 * Parses markdown-like strings (## headings, ### subheadings, **bold**, bullet points)
 * into clean, high-contrast React elements for store policies.
 */
export function renderPolicyContent(rawContent: string) {
  if (!rawContent) return null;

  // Split content by double newlines or single newlines
  const lines = rawContent.split("\n").map((line) => line.trim()).filter(Boolean);

  return (
    <div className="space-y-4 text-charcoal leading-relaxed">
      {lines.map((line, index) => {
        // H1 or H2 (## )
        if (line.startsWith("## ")) {
          const headingText = line.replace(/^##\s+/, "").replace(/\*\*/g, "");
          return (
            <h2 key={index} className="font-heading text-2xl font-bold text-navy pt-4 pb-1 border-b border-charcoal/10">
              {headingText}
            </h2>
          );
        }

        // H3 (### )
        if (line.startsWith("### ")) {
          const subHeadingText = line.replace(/^###\s+/, "").replace(/\*\*/g, "");
          return (
            <h3 key={index} className="font-heading text-lg font-semibold text-navy pt-2">
              {subHeadingText}
            </h3>
          );
        }

        // Bullet point (- or *)
        if (line.startsWith("- ") || line.startsWith("* ")) {
          const bulletText = line.replace(/^[-*]\s+/, "");
          return (
            <div key={index} className="flex items-start gap-2 pl-3 py-1">
              <span className="text-blush font-bold text-base leading-none">•</span>
              <p className="text-sm text-charcoal font-normal">{parseInlineFormatting(bulletText)}</p>
            </div>
          );
        }

        // Regular Paragraph
        return (
          <p key={index} className="text-sm text-charcoal font-normal leading-relaxed">
            {parseInlineFormatting(line)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Parses inline **bold** text tags cleanly.
 */
function parseInlineFormatting(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold text-navy">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
