import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "种草智作 AI｜商品种草策略生成器",
  description: "输入商品信息，一键生成洞察与种草策略。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
