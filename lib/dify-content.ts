import { parseContentGenerationResult, repairContentGenerationResult } from "@/lib/content-parser";
import { DifyRequestError, executeDifyWorkflow } from "@/lib/dify-client";
import type { ContentGenerationInputs, ContentGenerationResult } from "@/types/analysis";

const CONTENT_INPUT_KEYS = [
  "product_name",
  "category",
  "price",
  "description",
  "selling_points",
  "platform",
  "strategy_name",
  "strategy_audience",
  "strategy_pain_point",
  "strategy_selling_points",
  "strategy_angle",
] as const satisfies ReadonlyArray<keyof ContentGenerationInputs>;

type RunContentWorkflowOptions = {
  apiUrl?: string;
  apiKey?: string;
  inputs: ContentGenerationInputs;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export type DifyContentRunResult = {
  content: ContentGenerationResult;
  workflowRunId?: string;
  workflowStatus: string;
  resultPath: "data.outputs.result" | "outputs.result" | "result";
  retried?: boolean;
  repaired?: boolean;
};

export type DifyContentRunMeta = {
  retried?: boolean;
  repaired?: boolean;
};

export function parseContentGenerationInputs(value: unknown): ContentGenerationInputs {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new DifyRequestError("INVALID_INPUT", "内容生成请求必须是 JSON 对象", 400);
  }

  const record = value as Record<string, unknown>;
  const missing = CONTENT_INPUT_KEYS.filter((key) => typeof record[key] !== "string" || !record[key].trim());
  if (missing.length) {
    throw new DifyRequestError("INVALID_INPUT", `缺少必填字段：${missing.join(", ")}`, 400);
  }

  return Object.fromEntries(
    CONTENT_INPUT_KEYS.map((key) => [key, (record[key] as string).trim()]),
  ) as ContentGenerationInputs;
}

export async function runDifyContentWorkflow({
  apiUrl,
  apiKey,
  inputs,
  fetchImpl,
  timeoutMs,
}: RunContentWorkflowOptions): Promise<DifyContentRunResult> {
  const isDevelopment = process.env.NODE_ENV !== "production";
  // 模型偶尔不遵循结构：优先自动重试拿到高质量结果；
  // 全部重试失败后，用宽容修复的结果兜底，避免用户空手而归。
  const maxAttempts = 3;
  let lastError: Error | undefined;
  let repairedCandidate: DifyContentRunResult | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const raw = await executeDifyWorkflow({
      apiUrl,
      apiKey,
      inputs: { ...inputs },
      fetchImpl,
      timeoutMs,
      // 首次调用保持原始 user，重试时追加序号，避免 Dify 端混淆
      user: attempt === 1 ? "web-user" : `web-user-retry-${attempt}`,
    });

    try {
      const content = parseContentGenerationResult(raw.rawResult);
      if (isDevelopment) {
        console.info("[Dify] result parsed", { resultPath: raw.resultPath, resultType: "content" });
      }
      return {
        content,
        workflowRunId: raw.workflowRunId,
        workflowStatus: raw.workflowStatus,
        resultPath: raw.resultPath,
        retried: attempt > 1,
        repaired: false,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 记录最早一份可修复的结果，作为全部重试失败后的兜底
      if (!repairedCandidate) {
        const repaired = repairContentGenerationResult(raw.rawResult, {
          productName: inputs.product_name,
          strategyName: inputs.strategy_name,
          audience: inputs.strategy_audience,
          sellingPoints: inputs.strategy_selling_points.split(/[、,，|]/).map((item) => item.trim()).filter(Boolean),
        });
        if (repaired) {
          repairedCandidate = {
            content: repaired,
            workflowRunId: raw.workflowRunId,
            workflowStatus: raw.workflowStatus,
            resultPath: raw.resultPath,
            retried: attempt > 1,
            repaired: true,
          };
        }
      }

      if (attempt < maxAttempts && isDevelopment) {
        console.warn(`[Dify] content parse failed (attempt ${attempt}/${maxAttempts}), retrying...`);
      }
    }
  }

  if (repairedCandidate) {
    if (isDevelopment) {
      console.warn("[Dify] content delivered via repair fallback after all retries failed");
    }
    // 走到兜底说明经历过多次尝试（首次严格解析已失败），retried 按实际尝试次数标记
    return { ...repairedCandidate, retried: maxAttempts > 1 };
  }

  throw new DifyRequestError(
    "INVALID_RESULT_FORMAT",
    lastError?.message ?? "内容 structured_output 格式异常",
    422,
  );
}
