import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Spec-Driven App',
  description: '仕様駆動開発のサンプルアプリ',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
