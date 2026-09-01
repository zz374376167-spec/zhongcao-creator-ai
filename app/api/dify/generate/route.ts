import { NextResponse } from "next/server";
import { parseContentGenerationInputs, runDifyContentWorkflow } from "@/lib/dify-content";
import { DifyRequestError } from "@/lib/dify-client";
import type { ContentGenerationInputs } from "@/types/analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 100;

export async function POST(request: Request) {
  let inputs: ContentGenerationInputs;
  try {
    inputs = parseContentGenerationInputs(await request.json());
  } catch (error) {
    const message = error instanceof DifyRequestError ? error.message : "请求数据不是有效 JSON";
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message } },
      { status: 400 },
    );
  }

  try {
    const result = await runDifyContentWorkflow({
      apiUrl: process.env.DIFY_API_URL,
      apiKey: process.env.DIFY_CONTENT_API_KEY,
      inputs,
    });

    return NextResponse.json({
      content: result.content,
      meta: {
        source: "dify",
        workflowRunId: result.workflowRunId,
        workflowStatus: result.workflowStatus,
        resultPath: result.resultPath,
        retried: result.retried,
        repaired: result.repaired,
      },
    });
  } catch (error) {
    const knownError = error instanceof DifyRequestError
      ? error
      : new DifyRequestError("DIFY_REQUEST_FAILED", "未知的内容生成请求错误");

    if (process.env.NODE_ENV !== "production") {
      console.error("[Dify] generate route error", {
        code: knownError.code,
        message: knownError.message,
      });
    }

    return NextResponse.json(
      {
        error: {
          code: knownError.code,
          message: "内容生成暂时失败，请重新尝试",
        },
        fallbackAvailable: true,
      },
      { status: knownError.status },
    );
  }
}
