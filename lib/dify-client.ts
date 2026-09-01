import { extractResultFromDifyResponse, parseAnalysisResult } from "@/lib/analysis-parser";
import type { AnalysisResult, DifyInputs } from "@/types/analysis";

type FetchLike = typeof fetch;

type DifyClientOptions = {
  apiUrl?: string;
  apiKey?: string;
  inputs: DifyInputs;
  fetchImpl?: FetchLike;
  user?: string;
  timeoutMs?: number;
};

type DifyRawClientOptions = Omit<DifyClientOptions, "inputs"> & {
  inputs: Record<string, string>;
};

export type DifyRunResult = {
  analysis: AnalysisResult;
  workflowRunId?: string;
  workflowStatus: string;
  resultPath: "data.outputs.result" | "outputs.result" | "result";
};

export type DifyRawRunResult = {
  rawResult: unknown;
  workflowRunId?: string;
  workflowStatus: string;
  resultPath: DifyRunResult["resultPath"];
};

export class DifyRequestError extends Error {
  constructor(
    readonly code:
      | "DIFY_NOT_CONFIGURED"
      | "DIFY_INVALID_CONFIG"
      | "INVALID_INPUT"
      | "DIFY_REQUEST_FAILED"
      | "DIFY_HTTP_ERROR"
      | "DIFY_INVALID_JSON"
      | "DIFY_WORKFLOW_FAILED"
      | "INVALID_RESULT_FORMAT",
    message: string,
    readonly status = 502,
  ) {
    super(message);
    this.name = "DifyRequestError";
  }
}

const INPUT_KEYS: Array<keyof DifyInputs> = [
  "product_name",
  "category",
  "price",
  "description",
  "selling_points",
  "platform",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateInputs(inputs: DifyInputs) {
  const missing = INPUT_KEYS.filter((key) => typeof inputs[key] !== "string" || !inputs[key].trim());
  if (missing.length) {
    throw new DifyRequestError("INVALID_INPUT", `缺少必填字段：${missing.join(", ")}`, 400);
  }
}

function validateEndpoint(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new DifyRequestError("DIFY_INVALID_CONFIG", "DIFY_API_URL 不是有效 URL", 503);
  }

  if (!/^https?:$/.test(parsed.protocol)) {
    throw new DifyRequestError("DIFY_INVALID_CONFIG", "DIFY_API_URL 必须使用 HTTP(S)", 503);
  }
  if (parsed.hostname === "udify.app" || parsed.hostname.endsWith(".udify.app")) {
    throw new DifyRequestError("DIFY_INVALID_CONFIG", "Web App 分享链接不是 Workflow API Endpoint", 503);
  }

  const base = value.replace(/\/+$/, "");
  return base.endsWith("/workflows/run") ? base : `${base}/workflows/run`;
}

function getWorkflowState(payload: unknown): { status: string; error?: string; workflowRunId?: string } {
  if (!isRecord(payload)) return { status: "unknown" };
  const data = isRecord(payload.data) ? payload.data : undefined;
  return {
    status: typeof data?.status === "string"
      ? data.status
      : typeof payload.status === "string"
        ? payload.status
        : "unknown",
    error: typeof data?.error === "string"
      ? data.error
      : typeof payload.error === "string"
        ? payload.error
        : undefined,
    workflowRunId: typeof payload.workflow_run_id === "string"
      ? payload.workflow_run_id
      : typeof data?.id === "string"
        ? data.id
        : undefined,
  };
}

function detectResultPath(payload: unknown): DifyRunResult["resultPath"] {
  if (!isRecord(payload)) return "result";
  const data = isRecord(payload.data) ? payload.data : undefined;
  if (data && isRecord(data.outputs) && "result" in data.outputs) return "data.outputs.result";
  if (isRecord(payload.outputs) && "result" in payload.outputs) return "outputs.result";
  return "result";
}

export async function executeDifyWorkflow({
  apiUrl,
  apiKey,
  inputs,
  fetchImpl = fetch,
  user = "web-user",
  timeoutMs = 95_000,
}: DifyRawClientOptions): Promise<DifyRawRunResult> {
  const missing = Object.entries(inputs)
    .filter(([, value]) => typeof value !== "string" || !value.trim())
    .map(([key]) => key);
  if (missing.length) {
    throw new DifyRequestError("INVALID_INPUT", `缺少必填字段：${missing.join(", ")}`, 400);
  }
  if (!apiUrl?.trim() || !apiKey?.trim()) {
    throw new DifyRequestError("DIFY_NOT_CONFIGURED", "Dify API 尚未配置", 503);
  }

  const endpoint = validateEndpoint(apiUrl.trim());
  const isDevelopment = process.env.NODE_ENV !== "production";
  if (isDevelopment) console.info("[Dify] request started", { endpoint, inputs: Object.keys(inputs) });

  let response: Response;
  try {
    response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs, response_mode: "blocking", user }),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (isDevelopment) console.info("[Dify] response received", { status: response.status });
  } catch (error) {
    if (isDevelopment) console.error("[Dify] request failed", error);
    throw new DifyRequestError("DIFY_REQUEST_FAILED", "无法连接 Dify Workflow API");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    if (isDevelopment) console.error("[Dify] response JSON parse failed", error);
    throw new DifyRequestError("DIFY_INVALID_JSON", "Dify 返回了无效 JSON");
  }

  if (!response.ok) {
    if (isDevelopment) console.error("[Dify] non-200 response", { status: response.status, payload });
    throw new DifyRequestError("DIFY_HTTP_ERROR", `Dify HTTP ${response.status}`);
  }

  const workflow = getWorkflowState(payload);
  if (isDevelopment) console.info("[Dify] workflow status", workflow.status);
  if (workflow.status !== "succeeded") {
    throw new DifyRequestError(
      "DIFY_WORKFLOW_FAILED",
      workflow.error || `Workflow 状态：${workflow.status}`,
    );
  }

  try {
    const resultPath = detectResultPath(payload);
    const rawResult = extractResultFromDifyResponse(payload);
    if (isDevelopment) console.info("[Dify] request success");
    return {
      rawResult,
      workflowRunId: workflow.workflowRunId,
      workflowStatus: workflow.status,
      resultPath,
    };
  } catch (error) {
    if (isDevelopment) console.error("[Dify] structured_output parse failed", error);
    throw new DifyRequestError(
      "INVALID_RESULT_FORMAT",
      error instanceof Error ? error.message : "structured_output 格式异常",
      422,
    );
  }
}

export async function runDifyWorkflow(options: DifyClientOptions): Promise<DifyRunResult> {
  validateInputs(options.inputs);
  const isDevelopment = process.env.NODE_ENV !== "production";
  // 模型偶尔不遵循结构，解析失败时自动重试
  const maxAttempts = 3;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const raw = await executeDifyWorkflow({
      ...options,
      inputs: { ...options.inputs },
      // 首次调用保持原始 user，重试时追加序号，避免 Dify 端混淆
      user: attempt === 1 ? options.user : `${options.user ?? "web-user"}-retry-${attempt}`,
    });

    try {
      const analysis = parseAnalysisResult(raw.rawResult);
      if (isDevelopment) console.info("[Dify] result parsed", { resultPath: raw.resultPath });
      return {
        analysis,
        workflowRunId: raw.workflowRunId,
        workflowStatus: raw.workflowStatus,
        resultPath: raw.resultPath,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts && isDevelopment) {
        console.warn(`[Dify] analysis parse failed (attempt ${attempt}/${maxAttempts}), retrying...`);
      }
    }
  }

  throw new DifyRequestError(
    "INVALID_RESULT_FORMAT",
    lastError?.message ?? "structured_output 格式异常",
    422,
  );
}
