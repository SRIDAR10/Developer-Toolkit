// Type helpers for Marked renderer overrides
import type { Token } from "marked";

export type RendererCodeParams = { text: string; lang?: string };
export type RendererListItemParams = {
  text: string;
  task: boolean;
  checked?: boolean;
};
export type RendererTableParams = { header: string; body: string };
export type RendererTableRowParams = { text: string };
export type RendererTableCellParams = {
  text: string;
  header: boolean;
  align?: "center" | "left" | "right" | null;
};
export type RendererBlockquoteParams = { tokens: Token[] };
