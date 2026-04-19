import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Spec-Driven Dashboard',
  description: '仕様駆動開発ダッシュボード',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-slate-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
