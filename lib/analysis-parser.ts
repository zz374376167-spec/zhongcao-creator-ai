import type {
  AnalysisResult,
  Audience,
  PainPoint,
  ProductAnalysis,
  SellingPoint,
  Strategy,
} from "@/types/analysis";

type UnknownRecord = Record<string, unknown>;

export class AnalysisFormatError extends Error {
  readonly code = "INVALID_RESULT_FORMAT";

  constructor(message: string) {
    super(message);
    this.name = "AnalysisFormatError";
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanText(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
}

function firstText(record: UnknownRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const text = cleanText(record[key]);
    if (text) return text;
  }
  return undefined;
}

function firstAvailableText(record: UnknownRecord): string | undefined {
  for (const value of Object.values(record)) {
    const text = cleanText(value);
    if (text) return text;
  }
  return undefined;
}

function requiredText(record: UnknownRecord, keys: string[], fallback?: string): string {
  const text = firstText(record, keys) ?? fallback;
  if (!text) throw new AnalysisFormatError(`缺少可展示字段：${keys.join("/")}`);
  return text;
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(cleanText).filter((item): item is string => Boolean(item));
  }
  const text = cleanText(value);
  return text ? text.split(/[、,，|]/).map((item) => item.trim()).filter(Boolean) : [];
}

function unwrapStructuredValue(value: unknown): unknown {
  let current = value;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (typeof current === "string") {
      const withoutFence = current
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();

      try {
        current = JSON.parse(withoutFence);
        continue;
      } catch {
        throw new AnalysisFormatError("structured_output 不是有效 JSON");
      }
    }

    if (isRecord(current)) {
      if ("product_analysis" in current) return current;
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

function normalizeProductAnalysis(value: unknown): ProductAnalysis {
  if (typeof value === "string" && value.trim()) {
    return { summary: value.trim(), coreValue: value.trim(), oneLiner: value.trim() };
  }
  if (!isRecord(value)) throw new AnalysisFormatError("product_analysis 必须是对象或文本");

  const base = firstAvailableText(value);
  const summary = requiredText(
    value,
    ["summary", "product_summary", "understanding", "analysis", "product_positioning", "positioning", "description"],
    base,
  );

  return {
    summary,
    coreValue: requiredText(value, ["core_value", "coreValue", "value", "core_benefit"], summary),
    oneLiner: requiredText(value, ["one_liner", "oneLiner", "value_proposition", "slogan", "key_message"], summary),
    expressionSuggestion: firstText(value, [
      "expression_suggestion",
      "expressionSuggestion",
      "selling_point_guidance",
      "communication_advice",
      "content_advice",
    ]),
  };
}

function normalizeAudience(value: unknown, index: number): Audience {
  if (typeof value === "string" && value.trim()) {
    return { label: `人群 ${index + 1}`, name: value.trim(), description: value.trim() };
  }
  if (!isRecord(value)) throw new AnalysisFormatError(`audiences[${index}] 格式异常`);
  const fallback = firstAvailableText(value);
  return {
    label: firstText(value, ["label", "type", "audience_type", "segment", "group_type"]) ?? `人群 ${index + 1}`,
    name: requiredText(value, ["name", "audience", "group", "group_name", "title", "persona"], fallback),
    description: requiredText(value, ["description", "characteristics", "traits", "profile", "reason", "needs"], fallback),
  };
}

function normalizePainPoint(value: unknown, index: number): PainPoint {
  if (typeof value === "string" && value.trim()) return { title: value.trim(), description: value.trim() };
  if (!isRecord(value)) throw new AnalysisFormatError(`pain_points[${index}] 格式异常`);
  const fallback = firstAvailableText(value);
  return {
    title: requiredText(value, ["title", "pain_point", "painPoint", "name", "problem"], fallback),
    description: requiredText(value, ["description", "detail", "reason", "impact", "insight"], fallback),
  };
}

function normalizeSellingPoint(value: unknown, index: number): SellingPoint {
  if (typeof value === "string" && value.trim()) {
    return { name: value.trim(), reason: `第 ${index + 1} 优先级` };
  }
  if (!isRecord(value)) throw new AnalysisFormatError(`selling_points[${index}] 格式异常`);
  const fallback = firstAvailableText(value);
  const rawScore = value.score ?? value.priority_score ?? value.weight;
  const score = typeof rawScore === "number" && Number.isFinite(rawScore)
    ? Math.min(100, Math.max(0, rawScore))
    : undefined;
  return {
    name: requiredText(value, ["name", "selling_point", "sellingPoint", "title", "point", "benefit"], fallback),
    reason: requiredText(value, ["reason", "description", "priority_reason", "value", "evidence"], fallback),
    score,
  };
}

function normalizeStrategy(
  value: unknown,
  index: number,
  defaults: { audience: string; painPoint: string; sellingPoints: string[] },
): Strategy {
  if (!isRecord(value)) throw new AnalysisFormatError(`strategies[${index}] 必须是对象`);
  const fallback = firstAvailableText(value);
  const contentValue = value.content ?? value.content_forms ?? value.execution_points ?? value.tags ?? value.formats;
  const strategySellingPoints = stringList(
    value.strategy_selling_points ?? value.selling_points ?? value.key_selling_points ?? value.main_selling_points,
  );
  return {
    tag: firstText(value, ["tag", "type", "strategy_type", "positioning"]) ?? `策略 ${index + 1}`,
    title: requiredText(value, ["title", "strategy_name", "name", "topic", "theme"], fallback),
    audience: firstText(value, ["strategy_audience", "audience", "target_audience", "target_group"]) ?? defaults.audience,
    painPoint: firstText(value, ["strategy_pain_point", "pain_point", "user_pain_point", "core_pain_point"]) ?? defaults.painPoint,
    sellingPoints: strategySellingPoints.length ? strategySellingPoints : defaults.sellingPoints,
    angle: requiredText(value, ["angle", "core_idea", "description", "content_angle", "idea"], fallback),
    hook: requiredText(value, ["hook", "opening_hook", "opening", "lead", "headline", "title_example"], fallback),
    scene: requiredText(value, ["scene", "scene_path", "visual_path", "execution", "content_flow", "steps"], fallback),
    content: stringList(contentValue),
  };
}

function requiredArray(record: UnknownRecord, key: string): unknown[] {
  const value = record[key];
  if (!Array.isArray(value) || value.length === 0) {
    throw new AnalysisFormatError(`${key} 必须是非空数组`);
  }
  return value;
}

export function parseAnalysisResult(value: unknown): AnalysisResult {
  const unwrapped = unwrapStructuredValue(value);
  if (!isRecord(unwrapped)) throw new AnalysisFormatError("structured_output 必须是 JSON 对象");

  const requiredKeys = ["product_analysis", "audiences", "pain_points", "selling_points", "strategies"];
  const missing = requiredKeys.filter((key) => !(key in unwrapped));
  if (missing.length) throw new AnalysisFormatError(`缺少字段：${missing.join(", ")}`);

  const audiences = requiredArray(unwrapped, "audiences").map(normalizeAudience);
  const painPoints = requiredArray(unwrapped, "pain_points").map(normalizePainPoint);
  const sellingPoints = requiredArray(unwrapped, "selling_points").map(normalizeSellingPoint);
  const strategies = requiredArray(unwrapped, "strategies").map((strategy, index) => normalizeStrategy(
    strategy,
    index,
    {
      audience: audiences[index % audiences.length].name,
      painPoint: `${painPoints[index % painPoints.length].title}：${painPoints[index % painPoints.length].description}`,
      sellingPoints: sellingPoints.map((point) => point.name),
    },
  ));

  return {
    productAnalysis: normalizeProductAnalysis(unwrapped.product_analysis),
    audiences,
    painPoints,
    sellingPoints,
    strategies,
  };
}

export function extractResultFromDifyResponse(payload: unknown): unknown {
  if (!isRecord(payload)) throw new AnalysisFormatError("Dify API Response 不是 JSON 对象");

  const data = isRecord(payload.data) ? payload.data : undefined;
  const dataOutputs = data && isRecord(data.outputs) ? data.outputs : undefined;
  if (dataOutputs && "result" in dataOutputs) return dataOutputs.result;

  const outputs = isRecord(payload.outputs) ? payload.outputs : undefined;
  if (outputs && "result" in outputs) return outputs.result;
  if ("result" in payload) return payload.result;

  throw new AnalysisFormatError("Dify Response 中缺少 data.outputs.result");
}
