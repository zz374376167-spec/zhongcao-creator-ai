import { NextResponse } from "next/server";
import { DifyRequestError, runDifyWorkflow } from "@/lib/dify-client";
import type { DifyInputs } from "@/types/analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 100;

export async function POST(request: Request) {
  let inputs: DifyInputs;
  try {
    inputs = (await request.json()) as DifyInputs;
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "请求数据不是有效 JSON" } },
      { status: 400 },
    );
  }

  try {
    const result = await runDifyWorkflow({
      apiUrl: process.env.DIFY_API_URL,
      apiKey: process.env.DIFY_ANALYZE_API_KEY,
      inputs,
    });

    return NextResponse.json({
      analysis: result.analysis,
      meta: {
        source: "dify",
        workflowRunId: result.workflowRunId,
        workflowStatus: result.workflowStatus,
        resultPath: result.resultPath,
      },
    });
  } catch (error) {
    const knownError = error instanceof DifyRequestError
      ? error
      : new DifyRequestError("DIFY_REQUEST_FAILED", "未知的 Dify 请求错误");

    if (process.env.NODE_ENV !== "production") {
      console.error("[Dify] route error", {
        code: knownError.code,
        message: knownError.message,
      });
    }

    return NextResponse.json(
      {
        error: {
          code: knownError.code,
          message: knownError.code === "INVALID_RESULT_FORMAT"
            ? "AI 分析结果格式异常，请重新尝试"
            : "AI 分析暂时失败，请重新尝试",
        },
        fallbackAvailable: true,
      },
      { status: knownError.status },
    );
  }
}
