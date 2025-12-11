import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '迷雾漫步者 - The Fog Walker',
  description: '在这里，新闻是陈旧的，推荐是随机的，观点是冲突的。我们不提供真相，只提供寻找真相所需的阻力。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-neutral-900 text-stone-300 font-serif">{children}</body>
    </html>
  )
}
