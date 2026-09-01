import assert from "node:assert/strict";
import test from "node:test";
import { DifyRequestError, runDifyWorkflow } from "@/lib/dify-client";
import type { DifyInputs } from "@/types/analysis";

const inputs: DifyInputs = {
  product_name: "随行冷萃咖啡杯",
  category: "杯具 / 咖啡周边",
  price: "79元",
  description: "适合日常通勤使用的随行冷萃咖啡杯",
  selling_points: "轻便、防漏、保冷",
  platform: "小红书",
};

function structuredOutput(productName = "随行冷萃咖啡杯") {
  return {
    product_analysis: {
      summary: `${productName}的商品理解`,
      core_value: "随时享受冰咖啡",
      one_liner: "轻装带走冰咖啡自由",
      expression_suggestion: "先证明防漏，再展示保冷。",
    },
    audiences: [
      { label: "核心人群", name: "城市通勤族", description: "有稳定饮咖啡习惯" },
    ],
    pain_points: [
      { title: "漏液顾虑", description: "担心咖啡弄脏通勤包" },
    ],
    selling_points: [
      { name: "防漏", reason: "降低携带风险", score: 95 },
    ],
    strategies: [
      {
        tag: "实测型",
        title: "包里敢横放的咖啡杯",
        angle: "用真实测试建立信任",
        hook: "装满咖啡放进白包，我替你试了。",
        scene: "倒置 → 摇晃 → 白纸巾验证",
        content: ["极限测评", "细节特写"],
      },
    ],
  };
}

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("Case 1: blocking 请求使用精确的 6 个 inputs，并解析 data.outputs.result", async () => {
  let capturedBody: Record<string, unknown> | undefined;
  let capturedUrl = "";
  const fetchMock = (async (url: string | URL | Request, init?: RequestInit) => {
    capturedUrl = String(url);
    capturedBody = JSON.parse(String(init?.body));
    return response({
      task_id: "task-1",
      workflow_run_id: "run-1",
      data: {
        status: "succeeded",
        outputs: { result: JSON.stringify(structuredOutput()) },
        error: null,
      },
    });
  }) as typeof fetch;

  const result = await runDifyWorkflow({
    apiUrl: "https://api.dify.ai/v1",
    apiKey: "test-key-not-real",
    inputs,
    fetchImpl: fetchMock,
  });

  assert.deepEqual(capturedBody, {
    inputs,
    response_mode: "blocking",
    user: "web-user",
  });
  assert.equal(capturedUrl, "https://api.dify.ai/v1/workflows/run");
  assert.equal(result.workflowStatus, "succeeded");
  assert.equal(result.resultPath, "data.outputs.result");
  assert.equal(result.analysis.productAnalysis.summary, "随行冷萃咖啡杯的商品理解");
});

test("Case 2: API Key 不存在时，不发送上游请求", async () => {
  let called = false;
  const fetchMock = (async () => {
    called = true;
    return response({});
  }) as typeof fetch;

  await assert.rejects(
    runDifyWorkflow({
      apiUrl: "https://api.dify.ai/v1/workflows/run",
      apiKey: "",
      inputs,
      fetchImpl: fetchMock,
    }),
    (error: unknown) => error instanceof DifyRequestError && error.code === "DIFY_NOT_CONFIGURED",
  );
  assert.equal(called, false);
});

test("Case 3: Dify 非 200 和 Workflow failed 都会显式失败", async (context) => {
  await context.test("非 200", async () => {
    await assert.rejects(
      runDifyWorkflow({
        apiUrl: "https://api.dify.ai/v1/workflows/run",
        apiKey: "test-key-not-real",
        inputs,
        fetchImpl: (async () => response({ code: "bad_request", message: "invalid" }, 400)) as typeof fetch,
      }),
      (error: unknown) => error instanceof DifyRequestError && error.code === "DIFY_HTTP_ERROR",
    );
  });

  await context.test("Workflow failed", async () => {
    await assert.rejects(
      runDifyWorkflow({
        apiUrl: "https://api.dify.ai/v1/workflows/run",
        apiKey: "test-key-not-real",
        inputs,
        fetchImpl: (async () => response({ data: { status: "failed", outputs: {}, error: "LLM failed" } })) as typeof fetch,
      }),
      (error: unknown) => error instanceof DifyRequestError && error.code === "DIFY_WORKFLOW_FAILED",
    );
  });
});

test("Case 4: structured_output 缺字段或不是 JSON 时返回格式异常", async (context) => {
  await context.test("缺少 strategies", async () => {
    const invalid = structuredOutput() as Record<string, unknown>;
    delete invalid.strategies;
    await assert.rejects(
      runDifyWorkflow({
        apiUrl: "https://api.dify.ai/v1/workflows/run",
        apiKey: "test-key-not-real",
        inputs,
        fetchImpl: (async () => response({ data: { status: "succeeded", outputs: { result: invalid } } })) as typeof fetch,
      }),
      (error: unknown) => error instanceof DifyRequestError && error.code === "INVALID_RESULT_FORMAT",
    );
  });

  await context.test("JSON 解析失败", async () => {
    await assert.rejects(
      runDifyWorkflow({
        apiUrl: "https://api.dify.ai/v1/workflows/run",
        apiKey: "test-key-not-real",
        inputs,
        fetchImpl: (async () => response({ data: { status: "succeeded", outputs: { result: "not-json" } } })) as typeof fetch,
      }),
      (error: unknown) => error instanceof DifyRequestError && error.code === "INVALID_RESULT_FORMAT",
    );
  });
});

test("Case 5: 连续分析两个商品时结果不会串用", async () => {
  const fetchMock = (async (_url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { inputs: DifyInputs };
    return response({
      workflow_run_id: `run-${body.inputs.product_name}`,
      data: {
        status: "succeeded",
        outputs: { result: structuredOutput(body.inputs.product_name) },
      },
    });
  }) as typeof fetch;

  const first = await runDifyWorkflow({
    apiUrl: "https://api.dify.ai/v1/workflows/run",
    apiKey: "test-key-not-real",
    inputs,
    fetchImpl: fetchMock,
  });
  const second = await runDifyWorkflow({
    apiUrl: "https://api.dify.ai/v1/workflows/run",
    apiKey: "test-key-not-real",
    inputs: { ...inputs, product_name: "便携榨汁杯" },
    fetchImpl: fetchMock,
  });

  assert.equal(first.analysis.productAnalysis.summary, "随行冷萃咖啡杯的商品理解");
  assert.equal(second.analysis.productAnalysis.summary, "便携榨汁杯的商品理解");
  assert.notEqual(first.workflowRunId, second.workflowRunId);
});
