import type { ContentGenerationResult, Strategy } from "@/types/analysis";

export function createMockContent(productName: string, strategy: Strategy): ContentGenerationResult {
  const sellingPointText = strategy.sellingPoints.join("、");
  return {
    titles: [
      `${strategy.title}｜${productName}真实体验`,
      `被问爆了！这只${productName}真的懂${strategy.audience}`,
      `${strategy.sellingPoints[0] ?? "实用"}实测：${productName}值不值得买？`,
    ],
    body: `最近按「${strategy.title}」这个思路认真试了试${productName}。\n\n我最在意的是：${strategy.painPoint}。实际用下来，${sellingPointText}这几个点确实直接解决了我的顾虑。${strategy.angle}\n\n适合${strategy.audience}，如果你也在找一个能高频使用、又不会增加负担的小物，可以把它放进备选清单。\n\n#通勤好物 #咖啡日常 #种草分享`,
    videoScript: [
      {
        time: "0–3s",
        purpose: "建立冲突",
        visual: `快速展示${strategy.painPoint}`,
        voiceover: strategy.hook,
        subtitle: strategy.hook,
      },
      {
        time: "4–12s",
        purpose: "证明卖点",
        visual: strategy.scene,
        voiceover: `我重点测试了${sellingPointText}，结果比预期更适合日常使用。`,
        subtitle: sellingPointText,
      },
      {
        time: "13–20s",
        purpose: "给出结论",
        visual: `展示${productName}在真实使用场景中的状态`,
        voiceover: `${strategy.audience}可以重点看看，这次不是只讲参数。`,
        subtitle: `适合${strategy.audience}`,
      },
    ],
  };
}
