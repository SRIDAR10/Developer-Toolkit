import { marked } from "marked";
import mermaid from "mermaid";
import hljs from "highlight.js";
import DOMPurify from "dompurify";
import {
  RendererCodeParams,
  RendererListItemParams,
  RendererTableRowParams,
  RendererTableCellParams,
  RendererBlockquoteParams,
} from "./markedTypes";

//  Mermaid Initialization
if (typeof window !== "undefined") {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "neutral",
    themeVariables: {
      fontFamily: "inherit",
      fontSize: "16px",
      primaryColor: window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "#1f2937"
        : "#f3f4f6",
      primaryTextColor: window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "#f9fafb"
        : "#111827",
      textColor: window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "#f9fafb"
        : "#111827",
      lineColor: "#6b7280",
    },
  });

  //  Listen to dark mode changes and re-init Mermaid theme
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        theme: "neutral",
        themeVariables: {
          fontFamily: "inherit",
          fontSize: "16px",
          primaryColor: window.matchMedia("(prefers-color-scheme: dark)")
            .matches
            ? "#1f2937"
            : "#f3f4f6",
          primaryTextColor: window.matchMedia("(prefers-color-scheme: dark)")
            .matches
            ? "#f9fafb"
            : "#111827",
          textColor: window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "#f9fafb"
            : "#111827",
          lineColor: "#6b7280",
        },
      });
    });
}

//  Configure marked with GitHub Flavored Markdown
marked.setOptions({
  gfm: true,
  breaks: true,
});

//  Custom renderer
const renderer = new marked.Renderer();

// --- Code Block Renderer (Mermaid + Syntax Highlighting) ---
renderer.code = function ({ text, lang }: RendererCodeParams): string {
  const code = typeof text === "string" ? text : String(text || "");
  const language = typeof lang === "string" ? lang : "";

  if (language === "mermaid") {
    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
    // Add a loading indicator and min-height to prevent layout shift
    return `<div class="mermaid-diagram min-h-[120px] flex items-center justify-center bg-gray-50 dark:bg-gray-900/20" data-mermaid-id="${id}" data-mermaid-code="${encodeURIComponent(
      code
    )}"><span class='mermaid-loading text-gray-400 text-sm'>Rendering diagram...</span></div>`;
  }

  const validLanguage = language && hljs.getLanguage(language) ? language : "";
  let highlighted: string;
  try {
    highlighted = validLanguage
      ? hljs.highlight(code, { language: validLanguage }).value
      : hljs.highlightAuto(code).value;
  } catch {
    highlighted = code;
  }

  return `<pre><code class="hljs ${validLanguage}">${highlighted}</code></pre>`;
};

// --- Task List Renderer ---
renderer.listitem = function ({
  text,
  task,
  checked,
}: RendererListItemParams): string {
  if (task) {
    const checkedAttr = checked ? "checked" : "";
    const checkedClass = checked ? "line-through opacity-60" : "";
    return `<li class="task-list-item flex items-center gap-2 my-1">
      <input type="checkbox" ${checkedAttr} disabled class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
      <span class="${checkedClass}">${text}</span>
    </li>`;
  }
  return `<li class="my-1">${text}</li>`;
};

// --- Table Renderer ---
renderer.table = function (token: {
  header: { text: string }[];
  rows: { text: string }[][];
}): string {
  const headerHtml = token.header.map((cell) => cell.text).join("");
  const bodyHtml = token.rows
    .map((row) => row.map((cell) => cell.text).join(""))
    .join("");
  return `<div class="overflow-x-auto my-4">
    <table class="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
      <thead class="bg-gray-50 dark:bg-gray-800">${headerHtml}</thead>
      <tbody>${bodyHtml}</tbody>
    </table>
  </div>`;
};

renderer.tablerow = function ({ text }: RendererTableRowParams): string {
  return `<tr class="border-b border-gray-200 dark:border-gray-700">${text}</tr>`;
};

renderer.tablecell = function ({
  text,
  header,
  align,
}: RendererTableCellParams): string {
  const tag = header ? "th" : "td";
  const alignAttr = align ? ` style="text-align: ${align}"` : "";
  const classes = header
    ? "px-4 py-2 font-medium text-gray-900 dark:text-gray-50 bg-gray-100 dark:bg-gray-900"
    : "px-4 py-2 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-950";
  return `<${tag} class="${classes}"${alignAttr}>${text}</${tag}>`;
};

// --- Blockquote Renderer ---
renderer.blockquote = function ({ tokens }: RendererBlockquoteParams): string {
  const quote = marked.parser(tokens);
  return `<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100">${quote}</blockquote>`;
};

marked.use({ renderer });

/**
 *  Renders markdown to HTML with syntax highlighting + Mermaid v10 support
 */
export const renderMarkdown = async (markdown: string): Promise<string> => {
  try {
    const input =
      typeof markdown === "string" ? markdown : String(markdown || "");

    let html: string = (await Promise.resolve(marked.parse(input))) as string;

    // --- Process Mermaid Diagrams ---
    const mermaidRegex =
      /<div class="mermaid-diagram[^"]*" data-mermaid-id="([^"]+)" data-mermaid-code="([^"]+)">[\s\S]*?<\/div>/g;

    const matches: { match: string; id: string; code: string }[] = [];
    let match: RegExpExecArray | null;

    while ((match = mermaidRegex.exec(html)) !== null) {
      const [fullMatch, id, encodedCode] = match;
      // Ensure code is decoded and not empty
      const code = decodeURIComponent(encodedCode);
      matches.push({ match: fullMatch, id, code });
    }

    if (matches.length > 0) {
      const renderedDiagrams = await Promise.all(
        matches.map(async (m) => {
          try {
            // Debug: log the code being rendered
            console.log("Mermaid code:", m.code);
            if (!m.code.trim()) {
              return `<div class="mermaid-error p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                <p class="text-yellow-700 dark:text-yellow-300 font-medium">Mermaid Diagram Warning</p>
                <pre class="text-sm text-yellow-600 dark:text-yellow-400 mt-2">Diagram code is empty.</pre>
              </div>`;
            }
            const { svg } = await mermaid.render(m.id, m.code);
            // Debug: log the SVG output
            console.log("Mermaid SVG output:", svg);
            return `<div class="mermaid-container my-4">${svg}</div>`;
          } catch (err) {
            return `<div class="mermaid-error p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <p class="text-red-700 dark:text-red-300 font-medium">Mermaid Diagram Error</p>
              <pre class="text-sm text-red-600 dark:text-red-400 mt-2">${
                err instanceof Error ? err.message : "Failed to render diagram"
              }</pre>
              <pre class="text-xs text-gray-500 mt-2">${m.code}</pre>
            </div>`;
          }
        })
      );

      matches.forEach((m, i) => {
        html = html.replace(m.match, renderedDiagrams[i] as string);
      });
    }

    //  Sanitize final HTML to prevent XSS
    return DOMPurify.sanitize(html, {
      ADD_TAGS: [
        "svg",
        "g",
        "path",
        "text",
        "rect",
        "circle",
        "line",
        "polygon",
        "polyline",
        "ellipse",
        "defs",
        "marker",
        "foreignObject",
      ],
      ADD_ATTR: [
        "viewBox",
        "xmlns",
        "fill",
        "stroke",
        "stroke-width",
        "transform",
        "d",
        "cx",
        "cy",
        "r",
        "x",
        "y",
        "width",
        "height",
        "points",
        "x1",
        "y1",
        "x2",
        "y2",
        "rx",
        "ry",
        "class",
        "id",
        "style",
        "marker-end",
        "marker-start",
      ],
    });
  } catch (error) {
    console.error("Markdown rendering error:", error);
    return `<div class="error p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
      <p class="text-red-700 dark:text-red-300 font-medium">Markdown Rendering Error</p>
      <pre class="text-sm text-red-600 dark:text-red-400 mt-2">${
        error instanceof Error ? error.message : "Failed to render markdown"
      }</pre>
    </div>`;
  }
};

/**
 *  Extract plain text from markdown
 */
export const extractPlainText = (markdown: string): string => {
  try {
    const input =
      typeof markdown === "string" ? markdown : String(markdown || "");
    return input
      .replace(/#{1,6}\s+/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      .replace(/>\s+/g, "")
      .replace(/[-*+]\s+/g, "")
      .replace(/\d+\.\s+/g, "")
      .replace(/\n{2,}/g, "\n")
      .trim();
  } catch (error) {
    console.error("Error extracting plain text:", error);
    return String(markdown);
  }
};

/**
 *  Count words in markdown
 */
export const countWords = (markdown: string): number => {
  const plainText = extractPlainText(markdown);
  return plainText.split(/\s+/).filter((word) => word.length > 0).length;
};

/**
 *  Estimate reading time
 */
export const estimateReadingTime = (
  markdown: string,
  wordsPerMinute: number = 200
): number => {
  const wordCount = countWords(markdown);
  return Math.ceil(wordCount / wordsPerMinute);
};
