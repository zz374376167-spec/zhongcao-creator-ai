import assert from "node:assert/strict";
import test from "node:test";
import { ContentFormatError, parseContentGenerationResult } from "@/lib/content-parser";
import { runDifyContentWorkflow } from "@/lib/dify-content";
import { DifyRequestError } from "@/lib/dify-client";
import { createMockContent } from "@/lib/mock-content";
import type { ContentGenerationInputs, Strategy } from "@/types/analysis";

const inputs: ContentGenerationInputs = {
  product_name: "79元随行冷萃咖啡杯",
  category: "杯具 / 咖啡周边",
  price: "79元",
  description: "适合日常通勤使用的随行冷萃咖啡杯",
  selling_points: "轻便、防漏、保冷",
  platform: "小红书",
  strategy_name: "通勤包防漏实测",
  strategy_audience: "城市通勤族",
  strategy_pain_point: "担心咖啡漏进包里",
  strategy_selling_points: "防漏、轻便",
  strategy_angle: "用白包倒置测试建立信任",
};

const structuredOutput = {
  titles: ["标题一", "标题二", "标题三"],
  body: "这是一篇按所选策略生成的小红书正文。",
  video_script: [
    {
      time: "0-3s",
      purpose: "建立冲突",
      visual: "咖啡杯横放进白色通勤包",
      voiceover: "咖啡杯真的敢横着放吗？",
      subtitle: "白包防漏实测",
    },
  ],
};

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("内容 Workflow 使用精确的 11 个策略 inputs，并解析 data.outputs.result", async () => {
  let capturedBody: Record<string, unknown> | undefined;
  let capturedUrl = "";
  const fetchMock = (async (url: string | URL | Request, init?: RequestInit) => {
    capturedUrl = String(url);
    capturedBody = JSON.parse(String(init?.body));
    return response({
      workflow_run_id: "content-run-1",
      data: {
        status: "succeeded",
        outputs: { result: JSON.stringify(structuredOutput) },
      },
    });
  }) as typeof fetch;

  const result = await runDifyContentWorkflow({
    apiUrl: "https://api.dify.ai/v1",
    apiKey: "test-key-not-real",
    inputs,
    fetchImpl: fetchMock,
  });

  assert.deepEqual(capturedBody, { inputs, response_mode: "blocking", user: "web-user" });
  assert.equal(Object.keys((capturedBody?.inputs ?? {}) as object).length, 11);
  assert.equal(capturedUrl, "https://api.dify.ai/v1/workflows/run");
  assert.equal(result.resultPath, "data.outputs.result");
  assert.equal(result.content.titles.length, 3);
  assert.equal(result.content.videoScript[0].purpose, "建立冲突");
});

test("内容 structured_output 会校验 titles、body 和完整 video_script", () => {
  assert.throws(
    () => parseContentGenerationResult({ ...structuredOutput, titles: ["只有一个"] }),
    (error: unknown) => error instanceof ContentFormatError,
  );
  assert.throws(
    () => parseContentGenerationResult({ ...structuredOutput, video_script: [{ time: "0-3s" }] }),
    (error: unknown) => error instanceof ContentFormatError,
  );
});

test("第一次输出无法解析时自动重试，重试成功后返回结果", async () => {
  let callCount = 0;
  const users: string[] = [];
  const fetchMock = (async (_url: string | URL | Request, init?: RequestInit) => {
    callCount += 1;
    users.push((JSON.parse(String(init?.body)) as { user: string }).user);
    if (callCount === 1) {
      // 第一次：result 不是合法 JSON，严格解析失败，也无法修复
      return response({
        workflow_run_id: "content-run-fail",
        data: {
          status: "succeeded",
          outputs: { result: "这不是 JSON" },
        },
      });
    }
    return response({
      workflow_run_id: "content-run-ok",
      data: {
        status: "succeeded",
        outputs: { result: JSON.stringify(structuredOutput) },
      },
    });
  }) as typeof fetch;

  const result = await runDifyContentWorkflow({
    apiUrl: "https://api.dify.ai/v1",
    apiKey: "test-key-not-real",
    inputs,
    fetchImpl: fetchMock,
  });

  assert.equal(callCount, 2);
  assert.deepEqual(users, ["web-user", "web-user-retry-2"]);
  assert.equal(result.retried, true);
  assert.equal(result.repaired, false);
  assert.deepEqual(result.content.titles, ["标题一", "标题二", "标题三"]);
});

test("全部重试失败但输出可修复时，用宽容修复兜底返回", async () => {
  let callCount = 0;
  const partialOutput = {
    titles: ["只有一个标题"],
    body: "这是一篇完整的种草正文。\n咖啡杯真的很防漏。\n通勤带它太省心了。",
    video_script: [
      {
        time: "0-3s",
        purpose: "建立冲突",
        visual: "咖啡杯横放进白色通勤包",
        voiceover: "咖啡杯真的敢横着放吗？",
        subtitle: "白包防漏实测",
      },
    ],
  };
  const fetchMock = (async (_url: string | URL | Request, _init?: RequestInit) => {
    callCount += 1;
    return response({
      workflow_run_id: "content-run-partial",
      data: {
        status: "succeeded",
        outputs: { result: JSON.stringify(partialOutput) },
      },
    });
  }) as typeof fetch;

  const result = await runDifyContentWorkflow({
    apiUrl: "https://api.dify.ai/v1",
    apiKey: "test-key-not-real",
    inputs,
    fetchImpl: fetchMock,
  });

  assert.equal(callCount, 3);
  assert.equal(result.retried, true);
  assert.equal(result.repaired, true);
  assert.equal(result.content.titles.length, 3);
  assert.ok(result.content.body.includes("咖啡杯真的很防漏"));
  assert.equal(result.content.videoScript.length, 1);
});

test("全部重试失败且输出无法修复时抛出 INVALID_RESULT_FORMAT", async () => {
  let callCount = 0;
  const fetchMock = (async (_url: string | URL | Request, _init?: RequestInit) => {
    callCount += 1;
    return response({
      workflow_run_id: "content-run-bad",
      data: {
        status: "succeeded",
        outputs: { result: "无法解析的内容" },
      },
    });
  }) as typeof fetch;

  await assert.rejects(
    runDifyContentWorkflow({
      apiUrl: "https://api.dify.ai/v1",
      apiKey: "test-key-not-real",
      inputs,
      fetchImpl: fetchMock,
    }),
    (error: unknown) => error instanceof DifyRequestError && error.code === "INVALID_RESULT_FORMAT",
  );
  assert.equal(callCount, 3);
});

test("内容 API Key 缺失时不请求 Dify", async () => {
  let called = false;
  await assert.rejects(
    runDifyContentWorkflow({
      apiUrl: "https://api.dify.ai/v1",
      apiKey: "",
      inputs,
      fetchImpl: (async () => {
        called = true;
        return response({});
      }) as typeof fetch,
    }),
    (error: unknown) => error instanceof DifyRequestError && error.code === "DIFY_NOT_CONFIGURED",
  );
  assert.equal(called, false);
});

test("选择策略 A 和 B 会生成明显不同的演示内容，不会随机串用策略", () => {
  const base: Strategy = {
    tag: "实测型",
    title: "策略 A：通勤包防漏实测",
    audience: "城市通勤族",
    painPoint: "担心漏液弄脏通勤包",
    sellingPoints: ["防漏", "轻便"],
    angle: "用倒置实测建立信任",
    hook: "白包敢不敢放？",
    scene: "倒置与摇晃测试",
    content: ["极限实测"],
  };
  const alternative: Strategy = {
    ...base,
    title: "策略 B：午后冰感陪伴",
    audience: "办公室咖啡爱好者",
    painPoint: "下午咖啡很快变温",
    sellingPoints: ["保冷", "颜值"],
    angle: "用一整天温度变化记录突出保冷",
    hook: "早上的冰，下午还在吗？",
  };

  const first = createMockContent(inputs.product_name, base);
  const second = createMockContent(inputs.product_name, alternative);
  assert.notDeepEqual(first.titles, second.titles);
  assert.match(first.body, /城市通勤族/);
  assert.match(second.body, /办公室咖啡爱好者/);
  assert.match(first.body, /防漏/);
  assert.match(second.body, /保冷/);
});
