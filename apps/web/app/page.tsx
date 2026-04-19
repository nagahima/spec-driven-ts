import { SwimlaneDashboard } from './components/SwimlaneDashboard'

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">仕様ダッシュボード</h1>
          <p className="text-sm text-gray-500 mt-1">仕様のワークフロー進捗を俯瞰する</p>
        </div>
        <SwimlaneDashboard />
      </div>
    </main>
  )
}
