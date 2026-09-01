import type { ContentGenerationResult, VideoScriptSegment } from "@/types/analysis";

type UnknownRecord = Record<string, unknown>;

export class ContentFormatError extends Error {
  readonly code = "INVALID_RESULT_FORMAT";

  constructor(message: string) {
    super(message);
    this.name = "ContentFormatError";
  }
}

export type ContentRepairContext = {
  productName?: string;
  strategyName?: string;
  audience?: string;
  sellingPoints?: string[];
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(record: UnknownRecord, key: string, index?: number): string {
  const value = record[key];
  if (typeof value !== "string" || !value.trim()) {
    const path = index === undefined ? key : `video_script[${index}].${key}`;
    throw new ContentFormatError(`${path} 必须是非空文本`);
  }
  return value.trim();
}

function unwrapContentResult(value: unknown): unknown {
  let current = value;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (typeof current === "string") {
      const cleaned = current
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
      try {
        current = JSON.parse(cleaned);
        continue;
      } catch {
        throw new ContentFormatError("structured_output 不是有效 JSON");
      }
    }

    if (isRecord(current)) {
      if ("titles" in current || "video_script" in current) return current;
      if ("structured_output" in current) {
        current = current.structured_output;
        continue;
      }
      if ("result" in current) {
        current = current.result;
        continue;
      }
    }
    return current;
  }

  return current;
}

function parseSegment(value: unknown, index: number): VideoScriptSegment {
  if (!isRecord(value)) throw new ContentFormatError(`video_script[${index}] 必须是对象`);
  return {
    time: requiredString(value, "time", index),
    purpose: requiredString(value, "purpose", index),
    visual: requiredString(value, "visual", index),
    voiceover: requiredString(value, "voiceover", index),
    subtitle: requiredString(value, "subtitle", index),
  };
}

export function parseContentGenerationResult(value: unknown): ContentGenerationResult {
  const unwrapped = unwrapContentResult(value);
  if (!isRecord(unwrapped)) throw new ContentFormatError("structured_output 必须是 JSON 对象");

  const titles = unwrapped.titles;
  if (!Array.isArray(titles) || titles.length < 3) {
    throw new ContentFormatError("titles 必须至少包含 3 个标题");
  }
  const normalizedTitles = titles
    .map((title) => typeof title === "string" ? title.trim() : "")
    .filter(Boolean);
  if (normalizedTitles.length < 3) throw new ContentFormatError("titles 中存在无效标题");

  const body = requiredString(unwrapped, "body");
  const videoScript = unwrapped.video_script ?? unwrapped.videoScript;
  if (!Array.isArray(videoScript) || videoScript.length === 0) {
    throw new ContentFormatError("video_script 必须是非空数组");
  }

  return {
    titles: normalizedTitles.slice(0, 3),
    body,
    videoScript: videoScript.map(parseSegment),
  };
}

/* ------------------------------------------------------------------ */
/* 宽容修复：模型偶尔不遵循结构时，从部分结果中提取可用内容并补全。     */
/* 只用于最后兜底，保证用户总能拿到可渲染的结果，而不是校验失败报错。   */
/* ------------------------------------------------------------------ */

function cleanText(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
}

function collectTitles(value: unknown): string[] {
  const collected: string[] = [];
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = cleanText(item);
      if (text) collected.push(text);
    }
  } else {
    const text = cleanText(value);
    if (text) collected.push(...text.split(/[、,，|]/).map((item) => item.trim()).filter(Boolean));
  }
  return collected;
}

function extractSentences(text: string): string[] {
  const sentences = text
    .split(/\n|[。！？!?；;]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 4 && item.length <= 40);
  return sentences;
}

function unique(list: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of list) {
    const key = item.trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  }
  return result;
}

function fallbackTitles(context: ContentRepairContext): string[] {
  const productName = context.productName ?? "这款商品";
  const sellingPoint = context.sellingPoints?.[0] ?? "实用";
  return [
    `${productName}真实体验分享`,
    `被问爆了！${productName}凭什么值得买`,
    `${sellingPoint}实测：${productName}值不值得买？`,
  ];
}

function buildBody(titles: string[], context: ContentRepairContext): string {
  const strategyName = context.strategyName ? `按「${context.strategyName}」的思路` : "结合这次的种草策略";
  const sellingPointText = context.sellingPoints?.length ? context.sellingPoints.join("、") : "";
  const audience = context.audience ? `，很适合${context.audience}` : "";
  const lines = [
    `${titles[0] ?? context.productName ?? "真实体验"}。`,
    strategyName,
    sellingPointText ? `重点验证了${sellingPointText}这几个点${audience}。` : `实际体验下来，各方面都符合预期${audience}。`,
    "如果你也在考虑入手，可以参考这次的实测感受。",
  ];
  return lines.filter(Boolean).join("\n\n");
}

function repairVideoScript(
  value: unknown,
  titles: string[],
  body: string,
  context: ContentRepairContext,
): VideoScriptSegment[] | undefined {
  const productName = context.productName ?? "这款商品";
  const fallbackVoiceover = titles[0] ?? body.slice(0, 30);
  const fallbackVisual = productName;
  const fallbackSubtitle = titles[0] ?? fallbackVoiceover;

  const rawSegments = Array.isArray(value) ? value : [];
  if (rawSegments.length > 0) {
    const repaired: VideoScriptSegment[] = [];
    for (let index = 0; index < rawSegments.length; index += 1) {
      const segment = rawSegments[index];
      const text = cleanText(segment);
      if (text) {
        repaired.push({
          time: `0-3s`,
          purpose: "场景展示",
          visual: fallbackVisual,
          voiceover: text,
          subtitle: text,
        });
        continue;
      }
      if (isRecord(segment)) {
        const time = cleanText(segment.time) ?? `${index * 6}-${index * 6 + 3}s`;
        repaired.push({
          time,
          purpose: cleanText(segment.purpose) ?? "场景展示",
          visual: cleanText(segment.visual) ?? fallbackVisual,
          voiceover: cleanText(segment.voiceover) ?? fallbackVoiceover,
          subtitle: cleanText(segment.subtitle) ?? fallbackSubtitle,
        });
      }
    }
    if (repaired.length > 0) return repaired;
  }

  // 完全缺失时，基于现有内容生成三段最小脚本
  const sellingPoint = context.sellingPoints?.[0] ?? "核心卖点";
  return [
    {
      time: "0-3s",
      purpose: "建立冲突",
      visual: `快速展示${productName}`,
      voiceover: fallbackVoiceover,
      subtitle: fallbackSubtitle,
    },
    {
      time: "4-12s",
      purpose: "证明卖点",
      visual: `${sellingPoint} 的真实使用场景`,
      voiceover: body.split("\n")[1] ?? `${sellingPoint} 的实际表现比预期更好。`,
      subtitle: sellingPoint,
    },
    {
      time: "13-20s",
      purpose: "给出结论",
      visual: `${productName} 在日常场景中的状态`,
      voiceover: context.audience ? `${context.audience}可以重点参考这次实测。` : "想要了解更多细节，可以继续往下看。",
      subtitle: "真实种草体验",
    },
  ];
}

/**
 * 宽容修复：严格解析失败时调用，从模型的部分输出中提取可用内容并补全。
 * 修复成功返回完整结果；如果连兜底都不可行则返回 undefined（交由上层重试）。
 */
export function repairContentGenerationResult(
  value: unknown,
  context: ContentRepairContext = {},
): ContentGenerationResult | undefined {
  let unwrapped: unknown;
  try {
    unwrapped = unwrapContentResult(value);
  } catch {
    return undefined;
  }
  if (!isRecord(unwrapped)) return undefined;

  const titles = unique([
    ...collectTitles(unwrapped.titles ?? unwrapped.titles_list ?? unwrapped.title),
    ...extractSentences(typeof unwrapped.body === "string" ? unwrapped.body : ""),
    ...fallbackTitles(context),
  ]);
  if (titles.length < 3) return undefined;

  const bodyText = cleanText(unwrapped.body) ?? buildBody(titles, context);

  const videoScript = repairVideoScript(
    unwrapped.video_script ?? unwrapped.videoScript,
    titles,
    bodyText,
    context,
  );
  if (!videoScript) return undefined;

  return {
    titles: titles.slice(0, 3),
    body: bodyText,
    videoScript,
  };
}
