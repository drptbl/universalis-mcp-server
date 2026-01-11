import { CHARACTER_LIMIT } from "../constants.js";
import { ResponseFormat } from "../schemas/common.js";

export interface ToolResponseOptions<T> {
  title: string;
  responseFormat: ResponseFormat;
  data: T;
  meta?: Record<string, unknown>;
  summaryLines?: string[];
}

export function buildToolResponse<T>({
  title,
  responseFormat,
  data,
  meta,
  summaryLines,
}: ToolResponseOptions<T>) {
  let metaOut = meta ? { ...meta } : undefined;
  let output: { data: T; meta?: Record<string, unknown> } = {
    data,
    ...(metaOut ? { meta: metaOut } : {}),
  };

  let text = renderText(responseFormat, title, summaryLines, output);
  let textTruncated = false;

  if (text.length > CHARACTER_LIMIT) {
    textTruncated = true;
    metaOut = { ...(metaOut ?? {}), text_truncated: true };
    output = { data, meta: metaOut };
    text = renderText(responseFormat, title, summaryLines, output);
    if (text.length > CHARACTER_LIMIT) {
      text = `${text.slice(0, CHARACTER_LIMIT - 120)}\n\n... truncated ...`;
    }
  }

  return {
    content: [{ type: "text" as const, text }],
    structuredContent: {
      data,
      ...(metaOut ? { meta: metaOut } : {}),
    },
  };
}

function renderText(
  responseFormat: ResponseFormat,
  title: string,
  summaryLines: string[] | undefined,
  output: { data: unknown; meta?: Record<string, unknown> },
) {
  if (responseFormat === ResponseFormat.JSON) {
    return JSON.stringify(output, null, 2);
  }

  const lines = [`# ${title}`];
  if (summaryLines && summaryLines.length > 0) {
    lines.push("", ...summaryLines.map((line) => `- ${line}`));
  }
  lines.push("", "```json", JSON.stringify(output, null, 2), "```");
  return lines.join("\n");
}
