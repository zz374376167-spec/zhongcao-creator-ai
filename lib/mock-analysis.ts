import type { AnalysisResult } from "@/types/analysis";

export const MOCK_ANALYSIS: AnalysisResult = {
  productAnalysis: {
    summary:
      "一款面向日常通勤与轻户外场景的高性价比随行杯。核心价值不是单一“装咖啡”，而是以轻便、保冷和防漏，降低自带饮品的行动成本，让用户更轻松地获得随时可喝的冰爽体验。",
    coreValue: "用一杯咖啡的钱，换一个轻松带走的冰咖啡自由。",
    oneLiner: "轻装出门，也能随时喝到状态在线的冰咖啡。",
    expressionSuggestion:
      "内容中先用“敢放包里”解决风险顾虑，再通过冰块残留和杯壁状态证明保冷，最后用随手拿、轻松装强化轻便感。顺序遵循：消除担忧 → 证明体验 → 放大便利。",
  },
  audiences: [
    { label: "核心人群", name: "20–35 岁城市通勤族", description: "工作节奏快，有稳定饮咖啡习惯" },
    { label: "潜力人群", name: "学生与轻户外爱好者", description: "看重颜值、便携和价格友好" },
    { label: "消费特征", name: "理性实用型消费者", description: "愿为高频使用的小确幸买单" },
  ],
  painPoints: [
    { title: "通勤负担", description: "普通保温杯太重，占包内空间，带出门容易成为负担。" },
    { title: "温度焦虑", description: "冰咖啡快速升温、杯壁凝水，口感和桌面体验都打折。" },
    { title: "漏液顾虑", description: "担心杯盖不严弄脏电脑和文件，不敢直接放进通勤包。" },
  ],
  sellingPoints: [
    { name: "防漏", score: 94, reason: "购买决策关键点" },
    { name: "保冷", score: 88, reason: "体验感知最直观" },
    { name: "轻便", score: 76, reason: "使用频率助推器" },
  ],
  strategies: [
    {
      tag: "通勤效率型",
      title: "早八人的冰咖啡自由",
      audience: "20–35 岁城市通勤族",
      painPoint: "早高峰时间紧，外带咖啡排队且随行杯容易成为负担",
      sellingPoints: ["轻便", "防漏", "保冷"],
      angle: "用真实通勤场景证明：轻装出门，也能随时喝到状态在线的冰咖啡。",
      hook: "每天少排 10 分钟队，我的早八续命水自己带。",
      scene: "早高峰地铁 → 到工位开盖 → 杯身无水渍 → 倾斜放包内",
      content: ["通勤 Vlog", "真实测漏", "包内收纳"],
    },
    {
      tag: "价格反差型",
      title: "79 元，替代咖啡店的第 N 杯",
      audience: "学生与理性消费的年轻白领",
      painPoint: "频繁购买外带咖啡成本高，想省钱又不愿牺牲体验",
      sellingPoints: ["79 元高性价比", "保冷", "轻便"],
      angle: "将产品价格与一周外带咖啡支出对比，用低门槛获得感推动下单。",
      hook: "不到两杯咖啡钱，这只杯子承包了我整个夏天。",
      scene: "消费账单对比 → 冷萃制作 → 6 小时冰块状态 → 价格揭晓",
      content: ["价格对比", "保冷实测", "省钱清单"],
    },
    {
      tag: "安心体验型",
      title: "包里敢横放的咖啡杯",
      audience: "需要携带电脑和文件的通勤用户",
      painPoint: "担心杯盖漏液弄脏通勤包、电脑和文件",
      sellingPoints: ["防漏", "密封可靠", "便携"],
      angle: "放大用户最担心的漏液问题，通过连续测试建立确定性和信任。",
      hook: "装满咖啡塞进白色帆布包，我替你们试过了。",
      scene: "杯盖结构特写 → 倒置摇晃 → 白纸巾检验 → 包内实拍",
      content: ["极限测评", "细节特写", "结果见证"],
    },
  ],
};
