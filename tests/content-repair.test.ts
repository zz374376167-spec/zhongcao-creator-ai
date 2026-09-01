import assert from "node:assert/strict";
import test from "node:test";
import { repairContentGenerationResult } from "@/lib/content-parser";

const context = {
  productName: "79元随行冷萃咖啡杯",
  strategyName: "通勤包防漏实测",
  audience: "城市通勤族",
  sellingPoints: ["防漏", "轻便"],
};

test("titles 只有 1 个时，从正文提句补足到 3 个", () => {
  const result = repairContentGenerationResult(
    {
      titles: ["防漏实测"],
      body: "这是一篇完整的种草正文。\n咖啡杯真的很防漏。\n通勤带它太省心了。",
      video_script: [
        { time: "0-3s", purpose: "建立冲突", visual: "白包", voiceover: "敢放吗？", subtitle: "实测" },
      ],
    },
    context,
  );

  assert.ok(result);
  assert.equal(result.titles.length, 3);
  assert.ok(result.titles.includes("防漏实测"));
  // 从 body 提取的句子被用作补充标题
  assert.ok(result.titles.some((title) => title.includes("防漏")));
});

test("titles 完全缺失时，用产品与策略信息生成 fallback 标题", () => {
  const result = repairContentGenerationResult(
    {
      body: "今天实测了这款冷萃咖啡杯，防漏效果很好。",
      video_script: [
        { time: "0-3s", purpose: "建立冲突", visual: "白包", voiceover: "敢放吗？", subtitle: "实测" },
      ],
    },
    context,
  );

  assert.ok(result);
  assert.equal(result.titles.length, 3);
  assert.ok(result.titles.some((title) => title.includes("79元随行冷萃咖啡杯")));
});

test("video_script 完全缺失时，生成三段最小可用脚本", () => {
  const result = repairContentGenerationResult(
    { titles: ["标题一", "标题二", "标题三"], body: "正文内容。\n第二句。\n第三句。" },
    context,
  );

  assert.ok(result);
  assert.equal(result.videoScript.length, 3);
  for (const segment of result.videoScript) {
    assert.ok(segment.time);
    assert.ok(segment.purpose);
    assert.ok(segment.visual);
    assert.ok(segment.voiceover);
    assert.ok(segment.subtitle);
  }
});

test("video_script 段缺少字段时用 fallback 补全", () => {
  const result = repairContentGenerationResult(
    {
      titles: ["标题一", "标题二", "标题三"],
      body: "正文内容。",
      video_script: [{ time: "0-3s" }],
    },
    context,
  );

  assert.ok(result);
  assert.equal(result.videoScript.length, 1);
  const segment = result.videoScript[0];
  assert.equal(segment.time, "0-3s");
  assert.ok(segment.purpose);
  assert.ok(segment.visual);
  assert.ok(segment.voiceover);
  assert.ok(segment.subtitle);
});

test("完全无法解析的输入返回 undefined", () => {
  assert.equal(repairContentGenerationResult("这不是 JSON"), undefined);
  assert.equal(repairContentGenerationResult(42), undefined);
  assert.equal(repairContentGenerationResult(null), undefined);
});
