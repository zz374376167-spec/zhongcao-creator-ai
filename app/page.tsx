"use client";

import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clapperboard,
  Clipboard,
  Clock3,
  Coffee,
  Database,
  FileText,
  Heart,
  ImagePlus,
  Lightbulb,
  LockKeyhole,
  MessageCircleHeart,
  MousePointer2,
  PackageSearch,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TextQuote,
  TrendingUp,
  Upload,
  Users,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { MOCK_ANALYSIS } from "@/lib/mock-analysis";
import { createMockContent } from "@/lib/mock-content";
import type {
  AnalysisResult,
  AnalysisSource,
  ContentGenerationInputs,
  ContentGenerationResult,
  DifyInputs,
  Strategy,
} from "@/types/analysis";

type Step = "home" | "form" | "loading" | "error" | "result" | "content-loading" | "content-error" | "content-result";

type FormData = {
  productName: string;
  price: string;
  category: string;
  sellingPoints: string;
  description: string;
};

const DEFAULT_FORM: FormData = {
  productName: "79元随行冷萃咖啡杯",
  price: "79",
  category: "杯壶 / 咖啡器具",
  sellingPoints: "轻便、保冷、防漏",
  description: "适合通勤、办公室和户外随行使用的冷萃咖啡杯。",
};

function toDifyInputs(form: FormData): DifyInputs {
  const rawPrice = form.price.trim();
  return {
    product_name: form.productName.trim(),
    category: form.category.trim(),
    price: /元|¥/.test(rawPrice) ? rawPrice : `${rawPrice}元`,
    description: form.description.trim(),
    selling_points: form.sellingPoints.trim(),
    platform: "小红书",
  };
}

function toContentInputs(form: FormData, strategy: Strategy): ContentGenerationInputs {
  return {
    ...toDifyInputs(form),
    strategy_name: strategy.title,
    strategy_audience: strategy.audience,
    strategy_pain_point: strategy.painPoint,
    strategy_selling_points: strategy.sellingPoints.join("、"),
    strategy_angle: strategy.angle,
  };
}

const loadingStages = [
  { label: "正在理解商品信息...", icon: PackageSearch },
  { label: "正在分析潜在人群...", icon: Users },
  { label: "正在匹配用户痛点...", icon: Target },
  { label: "正在提炼核心卖点...", icon: Lightbulb },
  { label: "正在生成种草策略...", icon: WandSparkles },
];

const contentLoadingStages = [
  { label: "正在读取所选策略...", icon: Target },
  { label: "正在构思小红书标题...", icon: Sparkles },
  { label: "正在撰写种草正文...", icon: TextQuote },
  { label: "正在编排短视频脚本...", icon: Clapperboard },
];

const strategyStyles = [
  { color: "bg-[#eff6e8]", accent: "text-matcha-700" },
  { color: "bg-[#fff1ec]", accent: "text-[#db5033]" },
  { color: "bg-[#eef4f7]", accent: "text-[#3e7187]" },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-white shadow-sm">
        <Sparkles className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </div>
      <div className="leading-none">
        <div className="text-[15px] font-bold tracking-tight">种草智作 <span className="text-matcha-600">AI</span></div>
        <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.19em] text-gray-400">Content Intelligence</div>
      </div>
    </div>
  );
}

function Header({ step, onHome }: { step: Step; onHome: () => void }) {
  return (
    <header className="relative z-30 mx-auto flex h-[76px] w-full max-w-7xl items-center justify-between px-5 md:px-8">
      <button onClick={onHome} aria-label="返回首页" className="rounded-xl text-left transition-opacity hover:opacity-75">
        <Logo />
      </button>
      {step === "home" ? (
        <div className="hidden items-center gap-8 text-sm font-medium text-gray-500 md:flex">
          <a href="#how" className="transition-colors hover:text-ink">如何使用</a>
          <a href="#features" className="transition-colors hover:text-ink">核心能力</a>
          <span className="rounded-full border border-black/5 bg-white/70 px-3.5 py-2 text-xs text-matcha-700 shadow-sm backdrop-blur">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-matcha-500" />MVP · Dify API
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
          {step === "result"
            ? "分析报告已生成"
            : step === "content-result"
              ? "内容已生成"
              : step === "content-error"
                ? "内容生成未完成"
                : step === "content-loading"
                  ? "正在生成内容"
                  : step === "error"
                    ? "分析未完成"
                    : "新建商品分析"}
          <span className="h-1.5 w-1.5 rounded-full bg-matcha-400" />
        </div>
      )}
    </header>
  );
}

function Home({ onStart }: { onStart: () => void }) {
  return (
    <main className="overflow-hidden">
      <section className="relative mx-auto grid min-h-[650px] max-w-7xl items-center gap-10 px-5 pb-20 pt-12 md:px-8 lg:grid-cols-[1.08fr_.92fr] lg:pb-28 lg:pt-20">
        <div className="relative z-10 max-w-2xl animate-slide-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-matcha-200 bg-matcha-50/80 px-3.5 py-2 text-xs font-semibold text-matcha-700">
            <Zap className="h-3.5 w-3.5 fill-matcha-500 text-matcha-500" />
            从商品卖点到种草策略，一次完成
          </div>
          <h1 className="text-[44px] font-black leading-[1.08] tracking-[-0.045em] text-ink sm:text-6xl lg:text-[72px]">
            让每个好商品
            <br />
            都被<span className="relative mx-2 inline-block text-matcha-600">
              看见
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 170 10" fill="none" aria-hidden="true">
                <path d="M3 7C48 2 107 2 167 5" stroke="#a4c778" strokeWidth="5" strokeLinecap="round" opacity=".65" />
              </svg>
            </span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-gray-500 sm:text-lg">
            输入商品信息，AI 帮你快速理解用户、提炼卖点，生成有洞察、能落地的种草内容策略。
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button onClick={onStart} className="group inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-ink px-7 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(24,33,27,.2)] transition-all hover:-translate-y-0.5 hover:bg-matcha-700">
              开始分析商品
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <span className="px-2 text-xs text-gray-400">无需登录 · 约 10 秒生成</span>
          </div>
          <div className="mt-12 flex items-center gap-5 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-matcha-600" />商品洞察</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-matcha-600" />人群分析</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-matcha-600" />策略生成</span>
          </div>
        </div>

        <div className="relative mx-auto hidden h-[510px] w-full max-w-[500px] lg:block">
          <div className="absolute right-3 top-2 h-80 w-80 rounded-full bg-matcha-100/70 blur-2xl" />
          <div className="absolute left-0 top-16 w-[390px] -rotate-3 rounded-[30px] border border-white bg-white/80 p-5 shadow-soft backdrop-blur-md animate-float-slow">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eee3d6] text-[#765b43]"><Coffee className="h-5 w-5" /></div>
                <div><div className="text-sm font-bold">79元随行冷萃咖啡杯</div><div className="mt-1 text-[11px] text-gray-400">杯壶 / 咖啡器具</div></div>
              </div>
              <div className="rounded-full bg-matcha-50 px-2.5 py-1 text-[10px] font-semibold text-matcha-700">分析中</div>
            </div>
            <div className="mt-5 space-y-3">
              <div className="h-2.5 w-3/4 rounded-full bg-gray-100" />
              <div className="h-2.5 w-full rounded-full bg-gray-100" />
              <div className="h-2.5 w-5/6 rounded-full bg-gray-100" />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2.5">
              {["轻便", "保冷", "防漏"].map((item) => <div key={item} className="rounded-xl bg-matcha-50 py-3 text-center text-xs font-semibold text-matcha-700">{item}</div>)}
            </div>
          </div>
          <div className="absolute bottom-12 right-0 w-[350px] rotate-2 rounded-[28px] border border-white bg-ink p-6 text-white shadow-soft">
            <div className="flex items-center gap-2 text-xs font-semibold text-matcha-200"><Sparkles className="h-4 w-4" /> AI STRATEGY</div>
            <div className="mt-5 text-xl font-bold leading-snug">早八人的<br />冰咖啡自由</div>
            <div className="mt-4 flex gap-2">
              {["通勤 Vlog", "保冷实测"].map((item) => <span key={item} className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] text-white/70">{item}</span>)}
            </div>
            <div className="absolute -right-4 -top-4 grid h-14 w-14 place-items-center rounded-2xl bg-coral text-white shadow-lg"><Heart className="h-6 w-6 fill-white" /></div>
          </div>
          <div className="absolute right-3 top-[43%] z-10 grid h-12 w-12 place-items-center rounded-full border-[5px] border-paper bg-matcha-500 text-white shadow-lg"><MousePointer2 className="h-5 w-5 fill-white" /></div>
        </div>
      </section>

      <section id="how" className="border-y border-black/[0.04] bg-white/55 py-16 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="mb-10 flex items-end justify-between">
            <div><p className="text-xs font-bold uppercase tracking-[.2em] text-matcha-600">Simple workflow</p><h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">三步，把卖点变成内容策略</h2></div>
            <p className="hidden max-w-xs text-right text-sm leading-6 text-gray-400 md:block">减少反复开会和凭感觉创作，让每一次种草都有清晰依据。</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["01", "填写商品", "录入基础信息和核心卖点", FileText],
              ["02", "AI 深度分析", "洞察人群、痛点与购买动机", Sparkles],
              ["03", "获得策略", "一键生成 3 套可执行方向", TrendingUp],
            ].map(([num, title, desc, Icon]) => {
              const StepIcon = Icon as typeof FileText;
              return <div key={String(num)} className="group rounded-3xl border border-black/[0.05] bg-white p-6 shadow-card transition-transform hover:-translate-y-1">
                <div className="flex items-center justify-between"><span className="text-xs font-black tracking-widest text-gray-300">STEP {String(num)}</span><div className="grid h-10 w-10 place-items-center rounded-xl bg-matcha-50 text-matcha-700 transition-colors group-hover:bg-matcha-500 group-hover:text-white"><StepIcon className="h-4.5 w-4.5" /></div></div>
                <h3 className="mt-7 font-bold">{String(title)}</h3><p className="mt-2 text-sm text-gray-400">{String(desc)}</p>
              </div>;
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function ProductForm({ onBack, onAnalyze }: { onBack: () => void; onAnalyze: (data: FormData, image: string | null) => void }) {
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const submittedRef = useRef(false);

  useEffect(() => () => {
    if (imageUrl && !submittedRef.current) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  const setImage = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
    setImageName(file.name);
  };

  const onFile = (event: ChangeEvent<HTMLInputElement>) => setImage(event.target.files?.[0]);
  const update = (field: keyof FormData, value: string) => setForm((prev) => ({ ...prev, [field]: value }));
  const valid = form.productName.trim()
    && form.price.trim()
    && form.category.trim()
    && form.description.trim()
    && form.sellingPoints.trim();

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-8 md:px-8 md:pt-12">
      <button onClick={onBack} className="mb-7 flex items-center gap-1.5 text-xs font-medium text-gray-400 transition-colors hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" />返回首页</button>
      <div className="mb-9 max-w-2xl animate-slide-up">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.17em] text-matcha-600"><span className="h-px w-7 bg-matcha-400" />New analysis</div>
        <h1 className="text-3xl font-black tracking-[-.03em] md:text-4xl">先认识一下你的商品</h1>
        <p className="mt-3 text-sm leading-6 text-gray-400">信息越具体，生成的用户洞察与内容策略越准确。</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <section className="rounded-[28px] border border-black/[0.05] bg-white p-5 shadow-card sm:p-8">
          <div className="mb-7 flex items-center gap-3 border-b border-gray-100 pb-5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-matcha-50 text-matcha-700"><FileText className="h-4 w-4" /></div>
            <div><h2 className="text-sm font-bold">商品基本信息</h2><p className="mt-0.5 text-[11px] text-gray-400">已为你填入 Demo 商品，可直接体验</p></div>
          </div>
          <div className="space-y-5">
            <Field label="商品名称" required><input value={form.productName} onChange={(e) => update("productName", e.target.value)} placeholder="例如：随行冷萃咖啡杯" className="form-input" /></Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="商品价格" required><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">¥</span><input value={form.price} onChange={(e) => update("price", e.target.value)} inputMode="decimal" className="form-input pl-9" /></div></Field>
              <Field label="商品品类" required><input value={form.category} onChange={(e) => update("category", e.target.value)} className="form-input" /></Field>
            </div>
            <Field label="核心卖点" required hint="用顿号或逗号分隔"><input value={form.sellingPoints} onChange={(e) => update("sellingPoints", e.target.value)} placeholder="轻便、保冷、防漏" className="form-input" /></Field>
            <Field label="补充描述" required><textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} className="form-input resize-none py-3" /></Field>
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <section className="rounded-[28px] border border-black/[0.05] bg-white p-5 shadow-card sm:p-7">
            <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff1ec] text-coral"><ImagePlus className="h-4 w-4" /></div><div><h2 className="text-sm font-bold">商品图片</h2><p className="mt-0.5 text-[11px] text-gray-400">选填 · 仅在浏览器本地预览</p></div></div>{imageUrl && <button onClick={() => { URL.revokeObjectURL(imageUrl); setImageUrl(null); setImageName(""); }} aria-label="删除图片" className="grid h-8 w-8 place-items-center rounded-full bg-gray-50 text-gray-400 hover:text-coral"><X className="h-4 w-4" /></button>}</div>
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onFile} className="hidden" />
            {imageUrl ? (
              <button onClick={() => inputRef.current?.click()} className="group relative block h-[220px] w-full overflow-hidden rounded-2xl bg-gray-100 text-left">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="商品图片本地预览" className="h-full w-full object-cover" />
                <span className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-xl bg-black/60 px-3 py-2.5 text-xs text-white backdrop-blur"><span className="max-w-[220px] truncate">{imageName}</span><span className="font-semibold">更换图片</span></span>
              </button>
            ) : (
              <button
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); setImage(e.dataTransfer.files?.[0]); }}
                className={`grid h-[220px] w-full place-items-center rounded-2xl border border-dashed transition-colors ${dragging ? "border-matcha-500 bg-matcha-50" : "border-gray-200 bg-[#fafbf8] hover:border-matcha-300 hover:bg-matcha-50/40"}`}
              >
                <span className="text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-matcha-600 shadow-sm"><Upload className="h-5 w-5" /></span><span className="mt-4 block text-sm font-semibold">点击或拖拽上传图片</span><span className="mt-1.5 block text-[11px] text-gray-400">支持 JPG、PNG、WEBP</span></span>
              </button>
            )}
            <div className="mt-4 flex items-center gap-2 text-[11px] text-gray-400"><LockKeyhole className="h-3 w-3 text-matcha-600" />图片不会上传至服务器，仅用于本地预览</div>
          </section>

          <button disabled={!valid} onClick={() => { submittedRef.current = true; onAnalyze(form, imageUrl); }} className="group flex h-16 items-center justify-between rounded-2xl bg-ink px-6 text-white shadow-[0_12px_28px_rgba(24,33,27,.16)] transition-all enabled:hover:-translate-y-0.5 enabled:hover:bg-matcha-700 disabled:cursor-not-allowed disabled:opacity-40">
            <span className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-matcha-300" /><span className="text-left"><span className="block text-sm font-semibold">开始 AI 分析</span><span className="mt-0.5 block text-[10px] text-white/50">预计耗时 10 秒</span></span></span>
            <ArrowRight className="h-4 w-4 transition-transform group-enabled:group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </main>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 flex items-center justify-between text-xs font-semibold"><span>{label}{required && <span className="ml-1 text-coral">*</span>}</span>{hint && <span className="font-normal text-gray-300">{hint}</span>}</span>{children}</label>;
}

function LoadingScreen({
  productName,
  imageUrl,
  mode = "analysis",
  strategy,
}: {
  productName: string;
  imageUrl: string | null;
  mode?: "analysis" | "content";
  strategy?: Strategy | null;
}) {
  const [stage, setStage] = useState(0);
  const stages = mode === "content" ? contentLoadingStages : loadingStages;

  useEffect(() => {
    const timer = window.setInterval(() => setStage((current) => Math.min(current + 1, stages.length - 1)), 1800);
    return () => window.clearInterval(timer);
  }, [stages.length]);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-76px)] max-w-5xl items-center justify-center px-5 pb-16">
      <div className="grid w-full items-center gap-12 lg:grid-cols-2">
        <div className="relative mx-auto h-[360px] w-full max-w-[360px]">
          <div className="absolute inset-0 rounded-full border border-matcha-200/60 animate-pulse-soft" />
          <div className="absolute inset-8 rounded-full border border-dashed border-matcha-300/70 [animation:spin_16s_linear_infinite]" />
          <div className="absolute inset-16 overflow-hidden rounded-[38px] bg-white p-3 shadow-soft">
            <div className="relative h-full overflow-hidden rounded-[29px] bg-gradient-to-br from-[#e8efe0] to-[#f3e8df]">
              {imageUrl ? <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={imageUrl} alt="正在分析的商品" className="h-full w-full object-cover" /></> : <div className="grid h-full place-items-center"><div className="grid h-28 w-24 place-items-center rounded-[28px] border-[6px] border-white/70 bg-[#98765e] text-white shadow-xl"><Coffee className="h-12 w-12" /></div></div>}
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-white/40 to-transparent animate-scan" />
            </div>
          </div>
          {[Camera, BarChart3, Target].map((Icon, index) => <div key={index} className={`absolute grid h-11 w-11 place-items-center rounded-2xl bg-white text-matcha-600 shadow-card ${index === 0 ? "left-1 top-20" : index === 1 ? "bottom-10 left-12" : "right-0 top-32"}`}><Icon className="h-4.5 w-4.5" /></div>)}
        </div>
        <div className="max-w-md">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-matcha-600"><Sparkles className="h-4 w-4" />AI is thinking</div>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">{mode === "content" ? "正在把策略写成内容" : "正在读懂你的商品"}</h1>
          <p className="mt-3 truncate text-sm text-gray-400">{mode === "content" ? `基于策略：${strategy?.title ?? "已选策略"}` : productName}</p>
          <div className="mt-9 space-y-3">
            {stages.map(({ label, icon: Icon }, index) => {
              const done = index < stage;
              const active = index === stage;
              return <div key={label} className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-500 ${active ? "border-matcha-200 bg-white shadow-card" : "border-transparent"} ${done ? "opacity-60" : index > stage ? "opacity-30" : ""}`}>
                <div className={`grid h-8 w-8 place-items-center rounded-xl ${done ? "bg-matcha-500 text-white" : active ? "bg-matcha-50 text-matcha-700" : "bg-gray-100 text-gray-400"}`}>{done ? <Check className="h-4 w-4" /> : <Icon className={`h-4 w-4 ${active ? "animate-pulse" : ""}`} />}</div>
                <span className="text-sm font-medium">{label}</span>{active && <span className="ml-auto flex gap-1">{[0, 1, 2].map((dot) => <i key={dot} className="h-1 w-1 rounded-full bg-matcha-500 animate-bounce" style={{ animationDelay: `${dot * 120}ms` }} />)}</span>}
              </div>;
            })}
          </div>
          <div className="mt-7 h-1.5 overflow-hidden rounded-full bg-gray-200"><div className="h-full rounded-full bg-matcha-500 transition-all duration-500" style={{ width: `${((stage + 1) / stages.length) * 100}%` }} /></div>
          <p className="mt-3 text-[11px] text-gray-400">正在等待{mode === "content" ? "内容生成" : "商品分析"} Workflow 完成，请保持页面开启…</p>
        </div>
      </div>
    </main>
  );
}

function ErrorScreen({
  message,
  onRetry,
  onDemo,
  onEdit,
  description = "本次请求没有生成可用的真实 AI 结果。你可以重新调用 Dify，或明确选择演示数据继续查看页面。",
  retryLabel = "重新分析",
  editLabel = "返回修改商品信息",
}: {
  message: string;
  onRetry: () => void;
  onDemo: () => void;
  onEdit: () => void;
  description?: string;
  retryLabel?: string;
  editLabel?: string;
}) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-76px)] max-w-3xl items-center justify-center px-5 pb-20">
      <section className="w-full rounded-[30px] border border-black/[0.05] bg-white p-7 text-center shadow-soft sm:p-12">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#fff1ec] text-coral">
          <CircleAlert className="h-7 w-7" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-coral">Analysis interrupted</p>
        <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{message}</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-gray-400">{description}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button onClick={onRetry} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-ink px-6 text-sm font-semibold text-white transition-colors hover:bg-matcha-700">
            <RefreshCw className="h-4 w-4" />{retryLabel}
          </button>
          <button onClick={onDemo} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-matcha-200 bg-matcha-50 px-6 text-sm font-semibold text-matcha-700 transition-colors hover:bg-matcha-100">
            <Database className="h-4 w-4" />使用演示数据继续
          </button>
        </div>
        <button onClick={onEdit} className="mt-6 text-xs font-semibold text-gray-400 underline-offset-4 hover:text-ink hover:underline">
          {editLabel}
        </button>
      </section>
    </main>
  );
}

function Result({
  form,
  imageUrl,
  analysis,
  source,
  onRestart,
  onHome,
  onGenerate,
}: {
  form: FormData;
  imageUrl: string | null;
  analysis: AnalysisResult;
  source: AnalysisSource;
  onRestart: () => void;
  onHome: () => void;
  onGenerate: (strategy: Strategy) => void;
}) {
  const points = analysis.sellingPoints.map((item) => item.name);
  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-8 md:px-8 md:pt-12">
      <div className="mb-8 flex flex-col gap-5 border-b border-black/[0.06] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="animate-slide-up">
          <button onClick={onHome} className="mb-5 flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" />返回首页</button>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.17em] text-matcha-600"><BadgeCheck className="h-4 w-4" />Analysis complete</div>
          <h1 className="mt-3 text-3xl font-black tracking-[-.035em] md:text-4xl">商品种草分析报告</h1>
          <p className="mt-3 text-sm text-gray-400">基于「{form.productName}」的{source === "dify" ? "真实 Dify" : "演示"}智能分析</p>
        </div>
        <button onClick={onRestart} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-xs font-semibold shadow-sm transition-colors hover:border-matcha-300 hover:text-matcha-700"><Sparkles className="h-3.5 w-3.5" />分析新商品</button>
      </div>

      <section className="mb-6 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-[28px] bg-ink p-6 text-white shadow-soft md:p-8">
          <div className="flex flex-col gap-7 sm:flex-row sm:items-center">
            <div className="h-32 w-full shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#dbe8cc] to-[#ead9ca] sm:w-32">
              {imageUrl ? <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={imageUrl} alt="商品图" className="h-full w-full object-cover" /></> : <div className="grid h-full place-items-center text-[#7a5c47]"><Coffee className="h-14 w-14" /></div>}
            </div>
            <div className="min-w-0"><div className="mb-2 flex flex-wrap gap-2"><span className="rounded-full bg-matcha-400/20 px-2.5 py-1 text-[10px] font-semibold text-matcha-200">商品理解</span><span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] text-white/60">¥{form.price}</span></div><h2 className="truncate text-xl font-bold md:text-2xl">{form.productName}</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">{analysis.productAnalysis.summary}</p></div>
          </div>
        </div>
        <div className="rounded-[28px] border border-matcha-100 bg-matcha-50 p-6 md:p-7">
          <div className="flex items-center justify-between"><span className="text-xs font-bold text-matcha-700">核心价值一句话</span><MessageCircleHeart className="h-5 w-5 text-matcha-500" /></div>
          <blockquote className="mt-5 text-lg font-bold leading-8 text-matcha-900">“{analysis.productAnalysis.coreValue}”</blockquote>
          <div className="mt-5 flex flex-wrap gap-2">{points.map((point) => <span key={point} className="rounded-full border border-matcha-200 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-matcha-700">#{point}</span>)}</div>
        </div>
      </section>

      <section className="mb-6 grid gap-5 lg:grid-cols-2">
        <ResultCard icon={Users} label="01" title="目标人群" subtitle="Who they are">
          <div className="grid gap-3 sm:grid-cols-3">
            {analysis.audiences.map((audience, index) => <div key={`${audience.name}-${index}`} className="rounded-2xl bg-[#f8f9f5] p-4"><div className="mb-3 grid h-7 w-7 place-items-center rounded-lg bg-white text-[10px] font-black text-matcha-600 shadow-sm">{index + 1}</div><div className="text-[10px] font-semibold text-gray-400">{audience.label}</div><div className="mt-1.5 text-sm font-bold">{audience.name}</div><p className="mt-2 text-[11px] leading-5 text-gray-400">{audience.description}</p></div>)}
          </div>
        </ResultCard>
        <ResultCard icon={Target} label="02" title="用户痛点" subtitle="What holds them back">
          <div className="space-y-3">
            {analysis.painPoints.map((point, index) => <div key={`${point.title}-${index}`} className="flex gap-4 rounded-2xl border border-gray-100 p-3.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#fff1ec] text-[10px] font-black text-coral">{String(index + 1).padStart(2, "0")}</span><div><div className="text-sm font-bold">{point.title}</div><p className="mt-1 text-[11px] leading-5 text-gray-400">{point.description}</p></div></div>)}
          </div>
        </ResultCard>
      </section>

      <ResultCard icon={BarChart3} label="03" title="卖点优先级" subtitle="What to say first" className="mb-6">
        <div className="grid gap-6 md:grid-cols-[.9fr_1.1fr]">
          <div className="space-y-4">
            {analysis.sellingPoints.map((point, index) => {
              const colors = ["bg-matcha-600", "bg-[#7eaa78]", "bg-[#adc99f]"];
              const score = point.score ?? Math.max(58, 94 - index * 12);
              return <div key={`${point.name}-${index}`}><div className="mb-2 flex items-center justify-between gap-4 text-xs"><span className="shrink-0 font-bold"><span className="mr-2 text-gray-300">{String(index + 1).padStart(2, "0")}</span>{point.name}</span><span className="text-right text-gray-400">{point.reason}</span></div><div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${colors[index % colors.length]}`} style={{ width: `${score}%` }} /></div></div>;
            })}
          </div>
          <div className="rounded-2xl bg-[#f8f9f5] p-5"><div className="flex items-center gap-2 text-xs font-bold"><Lightbulb className="h-4 w-4 text-matcha-600" />表达建议</div><p className="mt-3 text-sm leading-7 text-gray-500">{analysis.productAnalysis.expressionSuggestion ?? analysis.productAnalysis.oneLiner}</p></div>
        </div>
      </ResultCard>

      <section>
        <div className="mb-5 flex items-end justify-between"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-matcha-600"><WandSparkles className="h-4 w-4" />{String(analysis.strategies.length).padStart(2, "0")} Strategies</div><h2 className="mt-2 text-2xl font-black tracking-tight">{analysis.strategies.length} 套种草策略</h2></div><span className="hidden text-xs text-gray-400 sm:block">可直接用于小红书内容策划</span></div>
        <div className="grid gap-5 lg:grid-cols-3">
          {analysis.strategies.map((strategy, index) => {
            const style = strategyStyles[index % strategyStyles.length];
            const number = String(index + 1).padStart(2, "0");
            return <article key={`${strategy.title}-${index}`} className={`group flex min-h-[430px] flex-col rounded-[28px] border border-black/[0.04] p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-soft ${style.color}`}>
            <div className="flex items-center justify-between"><span className={`text-[11px] font-black tracking-[.15em] ${style.accent}`}>{strategy.tag}</span><span className="text-3xl font-black text-black/[0.07]">{number}</span></div>
            <h3 className="mt-6 text-xl font-black leading-8 tracking-tight">{strategy.title}</h3>
            <p className="mt-3 text-xs leading-6 text-gray-500">{strategy.angle}</p>
            <div className="my-5 h-px bg-black/[0.06]" />
            <div className="space-y-4"><div><div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">开篇钩子</div><p className="text-sm font-semibold leading-6">“{strategy.hook}”</p></div><div><div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">画面路径</div><p className="text-[11px] leading-5 text-gray-500">{strategy.scene}</p></div></div>
            <div className="mt-auto pt-5">
              <div className="flex flex-wrap gap-2">{strategy.content.map((item) => <span key={item} className="rounded-full bg-white/60 px-2.5 py-1.5 text-[10px] font-semibold text-gray-500">{item}</span>)}</div>
              <button onClick={() => onGenerate(strategy)} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 text-xs font-semibold text-white transition-colors hover:bg-matcha-700">
                <WandSparkles className="h-4 w-4" />使用这个策略生成内容
              </button>
            </div>
          </article>})}
        </div>
      </section>

      <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-black/[0.05] bg-white/60 px-5 py-4 text-[11px] text-gray-400 sm:flex-row"><span className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-matcha-600" />{source === "dify" ? "本报告由已发布的 Dify Workflow 实时生成。" : "当前展示的是手动选择的 Mock Data，并非真实 AI 结果。"}</span><button onClick={onRestart} className="flex items-center gap-1 font-semibold text-matcha-700 hover:underline">重新分析 <ChevronRight className="h-3 w-3" /></button></div>
    </main>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button onClick={() => void copy()} className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-[11px] font-semibold text-gray-500 transition-colors hover:border-matcha-300 hover:text-matcha-700">
      {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-matcha-600" /> : <Clipboard className="h-3.5 w-3.5" />}
      {copied ? "已复制" : label}
    </button>
  );
}

function ContentResultPage({
  form,
  strategy,
  content,
  source,
  onBack,
  onRegenerate,
}: {
  form: FormData;
  strategy: Strategy;
  content: ContentGenerationResult;
  source: AnalysisSource;
  onBack: () => void;
  onRegenerate: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-8 md:px-8 md:pt-12">
      <div className="mb-8 flex flex-col gap-5 border-b border-black/[0.06] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button onClick={onBack} className="mb-5 flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" />返回选择其他策略</button>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.17em] text-matcha-600"><BadgeCheck className="h-4 w-4" />Content complete</div>
          <h1 className="mt-3 text-3xl font-black tracking-[-.035em] md:text-4xl">小红书内容创作结果</h1>
          <p className="mt-3 text-sm text-gray-400">为「{form.productName}」按已选策略定向生成</p>
        </div>
        <button onClick={onRegenerate} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-xs font-semibold shadow-sm transition-colors hover:border-matcha-300 hover:text-matcha-700"><RefreshCw className="h-3.5 w-3.5" />重新生成</button>
      </div>

      <ResultCard icon={Target} label="01" title="基于哪套策略生成" subtitle="The selected strategy" className="mb-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["策略名称", strategy.title],
            ["目标人群", strategy.audience],
            ["核心痛点", strategy.painPoint],
            ["主卖点", strategy.sellingPoints.join("、")],
            ["种草角度", strategy.angle],
          ].map(([label, value]) => <div key={label} className="rounded-2xl bg-[#f8f9f5] p-4"><div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</div><p className="mt-2 text-xs font-semibold leading-6 text-ink">{value}</p></div>)}
        </div>
      </ResultCard>

      <ResultCard icon={Sparkles} label="02" title="小红书标题" subtitle="Three title options" className="mb-6">
        <div className="space-y-3">
          {content.titles.map((title, index) => <div key={`${title}-${index}`} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-[#fafbf8] p-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-matcha-50 text-[10px] font-black text-matcha-700">{String(index + 1).padStart(2, "0")}</span><p className="min-w-0 flex-1 text-sm font-bold leading-6">{title}</p><CopyButton value={title} label="复制" /></div>)}
        </div>
      </ResultCard>

      <ResultCard icon={FileText} label="03" title="小红书正文" subtitle="Ready-to-use copy" className="mb-6">
        <div className="mb-4 flex justify-end"><CopyButton value={content.body} label="复制正文" /></div>
        <div className="whitespace-pre-wrap rounded-2xl bg-[#f8f9f5] p-5 text-sm leading-8 text-gray-600">{content.body}</div>
      </ResultCard>

      <ResultCard icon={Clapperboard} label="04" title="短视频脚本" subtitle="Structured timeline">
        <div className="space-y-4">
          {content.videoScript.map((segment, index) => <article key={`${segment.time}-${index}`} className="grid gap-4 rounded-2xl border border-gray-100 p-4 md:grid-cols-[110px_1fr] md:p-5">
            <div><div className="inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-2 text-xs font-bold text-white"><Clock3 className="h-3.5 w-3.5 text-matcha-300" />{segment.time}</div><div className="mt-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">作用</div><p className="mt-1 text-xs font-semibold">{segment.purpose}</p></div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-[#f8f9f5] p-4"><div className="text-[10px] font-bold text-matcha-700">画面</div><p className="mt-2 text-xs leading-6 text-gray-500">{segment.visual}</p></div>
              <div className="rounded-xl bg-[#f8f9f5] p-4"><div className="text-[10px] font-bold text-matcha-700">口播</div><p className="mt-2 text-xs leading-6 text-gray-500">{segment.voiceover}</p></div>
              <div className="rounded-xl bg-[#f8f9f5] p-4"><div className="text-[10px] font-bold text-matcha-700">字幕</div><p className="mt-2 text-xs leading-6 text-gray-500">{segment.subtitle}</p></div>
            </div>
          </article>)}
        </div>
      </ResultCard>

      <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-black/[0.05] bg-white/60 px-5 py-4 text-[11px] text-gray-400 sm:flex-row"><span className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-matcha-600" />{source === "dify" ? "内容由第二条 Dify Workflow 实时生成。" : "当前内容为用户主动选择的演示数据。"}</span><button onClick={onBack} className="flex items-center gap-1 font-semibold text-matcha-700 hover:underline">返回选择其他策略 <ChevronRight className="h-3 w-3" /></button></div>
    </main>
  );
}

function ResultCard({ icon: Icon, label, title, subtitle, children, className = "" }: { icon: typeof Users; label: string; title: string; subtitle: string; children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[28px] border border-black/[0.05] bg-white p-5 shadow-card md:p-7 ${className}`}><div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-matcha-50 text-matcha-700"><Icon className="h-[18px] w-[18px]" /></div><div><div className="flex items-center gap-2"><span className="text-[10px] font-black text-matcha-500">{label}</span><h2 className="text-base font-bold">{title}</h2></div><p className="mt-0.5 text-[10px] uppercase tracking-wider text-gray-300">{subtitle}</p></div></div></div>{children}</section>;
}

export default function App() {
  const [step, setStep] = useState<Step>("home");
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [source, setSource] = useState<AnalysisSource>("dify");
  const [errorMessage, setErrorMessage] = useState("AI 分析暂时失败，请重新尝试");
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [contentResult, setContentResult] = useState<ContentGenerationResult | null>(null);
  const [contentSource, setContentSource] = useState<AnalysisSource>("dify");
  const currentRequestRef = useRef<AbortController | null>(null);

  const analyze = async (data: FormData, image: string | null) => {
    currentRequestRef.current?.abort();
    const controller = new AbortController();
    currentRequestRef.current = controller;
    setForm(data);
    setImageUrl(image);
    setAnalysis(null);
    setErrorMessage("AI 分析暂时失败，请重新尝试");
    setStep("loading");
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      if (process.env.NODE_ENV !== "production") console.info("[Dify] request started");
      const response = await fetch("/api/dify/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toDifyInputs(data)),
        signal: controller.signal,
      });

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new Error("DIFY_INVALID_JSON");
      }

      const responseData = typeof payload === "object" && payload !== null
        ? payload as { analysis?: AnalysisResult; error?: { code?: string }; meta?: { workflowStatus?: string; resultPath?: string } }
        : {};

      if (!response.ok || !responseData.analysis) {
        throw new Error(responseData.error?.code ?? "DIFY_REQUEST_FAILED");
      }

      const result = responseData.analysis;
      if (
        !result.productAnalysis
        || !Array.isArray(result.audiences)
        || !Array.isArray(result.painPoints)
        || !Array.isArray(result.sellingPoints)
        || !Array.isArray(result.strategies)
      ) {
        throw new Error("INVALID_RESULT_FORMAT");
      }

      if (process.env.NODE_ENV !== "production") {
        console.info("[Dify] request success");
        console.info("[Dify] workflow status", responseData.meta?.workflowStatus);
        console.info("[Dify] result parsed", { resultPath: responseData.meta?.resultPath });
      }
      setAnalysis(result);
      setSource("dify");
      setStep("result");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      const code = error instanceof Error ? error.message : "DIFY_REQUEST_FAILED";
      if (process.env.NODE_ENV !== "production") console.error("[Dify] request failed", { code });
      setErrorMessage(
        code === "INVALID_RESULT_FORMAT" || code === "DIFY_INVALID_JSON"
          ? "AI 分析结果格式异常，请重新尝试"
          : "AI 分析暂时失败，请重新尝试",
      );
      setStep("error");
    } finally {
      if (currentRequestRef.current === controller) currentRequestRef.current = null;
    }
  };

  const useDemoData = () => {
    setAnalysis(MOCK_ANALYSIS);
    setSource("mock");
    setStep("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const generateContent = async (strategy: Strategy) => {
    currentRequestRef.current?.abort();
    const controller = new AbortController();
    currentRequestRef.current = controller;
    setSelectedStrategy(strategy);
    setContentResult(null);
    setErrorMessage("内容生成暂时失败，请重新尝试");
    setStep("content-loading");
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      if (process.env.NODE_ENV !== "production") {
        console.info("[Dify] request started", { workflow: "content", strategy: strategy.title });
      }
      const response = await fetch("/api/dify/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toContentInputs(form, strategy)),
        signal: controller.signal,
      });

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new Error("DIFY_INVALID_JSON");
      }

      const responseData = typeof payload === "object" && payload !== null
        ? payload as { content?: ContentGenerationResult; error?: { code?: string }; meta?: { workflowStatus?: string; resultPath?: string } }
        : {};

      if (!response.ok || !responseData.content) {
        throw new Error(responseData.error?.code ?? "DIFY_REQUEST_FAILED");
      }

      const content = responseData.content;
      if (
        !Array.isArray(content.titles)
        || content.titles.length < 3
        || typeof content.body !== "string"
        || !content.body.trim()
        || !Array.isArray(content.videoScript)
        || content.videoScript.length === 0
      ) {
        throw new Error("INVALID_RESULT_FORMAT");
      }

      if (process.env.NODE_ENV !== "production") {
        console.info("[Dify] response received", { workflow: "content" });
        console.info("[Dify] workflow status", responseData.meta?.workflowStatus);
        console.info("[Dify] result parsed", { resultPath: responseData.meta?.resultPath, strategy: strategy.title });
      }
      setContentResult(content);
      setContentSource("dify");
      setStep("content-result");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      const code = error instanceof Error ? error.message : "DIFY_REQUEST_FAILED";
      if (process.env.NODE_ENV !== "production") console.error("[Dify] content request failed", { code });
      setErrorMessage("内容生成暂时失败，请重新尝试");
      setStep("content-error");
    } finally {
      if (currentRequestRef.current === controller) currentRequestRef.current = null;
    }
  };

  const useDemoContent = () => {
    if (!selectedStrategy) return;
    setContentResult(createMockContent(form.productName, selectedStrategy));
    setContentSource("mock");
    setStep("content-result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const returnToStrategies = () => {
    currentRequestRef.current?.abort();
    setStep("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => () => currentRequestRef.current?.abort(), []);

  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);

  const go = (next: Step) => {
    if (next !== "loading") currentRequestRef.current?.abort();
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      <div className="noise" />
      <Header step={step} onHome={() => go("home")} />
      {step === "home" && <Home onStart={() => go("form")} />}
      {step === "form" && <ProductForm onBack={() => go("home")} onAnalyze={analyze} />}
      {step === "loading" && <LoadingScreen productName={form.productName} imageUrl={imageUrl} />}
      {step === "error" && <ErrorScreen message={errorMessage} onRetry={() => void analyze(form, imageUrl)} onDemo={useDemoData} onEdit={() => go("form")} />}
      {step === "result" && analysis && <Result form={form} imageUrl={imageUrl} analysis={analysis} source={source} onRestart={() => go("form")} onHome={() => go("home")} onGenerate={(strategy) => void generateContent(strategy)} />}
      {step === "content-loading" && selectedStrategy && <LoadingScreen productName={form.productName} imageUrl={imageUrl} mode="content" strategy={selectedStrategy} />}
      {step === "content-error" && selectedStrategy && <ErrorScreen message={errorMessage} onRetry={() => void generateContent(selectedStrategy)} onDemo={useDemoContent} onEdit={returnToStrategies} description={`基于「${selectedStrategy.title}」的真实内容生成失败。可以重新调用 Dify，或主动选择演示数据继续。`} retryLabel="重新生成" editLabel="返回选择其他策略" />}
      {step === "content-result" && selectedStrategy && contentResult && <ContentResultPage form={form} strategy={selectedStrategy} content={contentResult} source={contentSource} onBack={returnToStrategies} onRegenerate={() => void generateContent(selectedStrategy)} />}
    </div>
  );
}
