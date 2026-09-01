export type DifyInputs = {
  product_name: string;
  category: string;
  price: string;
  description: string;
  selling_points: string;
  platform: string;
};

export interface ProductAnalysis {
  summary: string;
  coreValue: string;
  oneLiner: string;
  expressionSuggestion?: string;
}

export interface Audience {
  label: string;
  name: string;
  description: string;
}

export interface PainPoint {
  title: string;
  description: string;
}

export interface SellingPoint {
  name: string;
  reason: string;
  score?: number;
}

export interface Strategy {
  tag: string;
  title: string;
  audience: string;
  painPoint: string;
  sellingPoints: string[];
  angle: string;
  hook: string;
  scene: string;
  content: string[];
}

export interface AnalysisResult {
  productAnalysis: ProductAnalysis;
  audiences: Audience[];
  painPoints: PainPoint[];
  sellingPoints: SellingPoint[];
  strategies: Strategy[];
}

export type AnalysisSource = "dify" | "mock";

export type ContentGenerationInputs = DifyInputs & {
  strategy_name: string;
  strategy_audience: string;
  strategy_pain_point: string;
  strategy_selling_points: string;
  strategy_angle: string;
};

export interface VideoScriptSegment {
  time: string;
  purpose: string;
  visual: string;
  voiceover: string;
  subtitle: string;
}

export interface ContentGenerationResult {
  titles: string[];
  body: string;
  videoScript: VideoScriptSegment[];
}
