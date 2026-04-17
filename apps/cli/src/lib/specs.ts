import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import type { SpecIssue, Task } from 'types'

function findProjectRoot(start: string = process.cwd()): string {
  let dir = start
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, 'specs', 'features'))) return dir
    dir = dirname(dir)
  }
  throw new Error('specs/ ディレクトリが見つかりません。プロジェクトルートで実行してください。')
}

export function getSpecsDir(): string {
  return join(findProjectRoot(), 'specs')
}

export function readTemplate(): string {
  return readFileSync(join(getSpecsDir(), 'features', '_TEMPLATE.md'), 'utf-8')
}

export function specExists(name: string): boolean {
  return existsSync(join(getSpecsDir(), 'features', `${name}.md`))
}

export function readSpec(name: string): string {
  const path = join(getSpecsDir(), 'features', `${name}.md`)
  if (!existsSync(path)) throw new Error(`仕様が見つかりません: specs/features/${name}.md`)
  return readFileSync(path, 'utf-8')
}

export function writeSpec(name: string, content: string): void {
  writeFileSync(join(getSpecsDir(), 'features', `${name}.md`), content, 'utf-8')
}

export function getSpecStatus(content: string): string {
  const match = content.match(/ステータス:\s*(\w+)/)
  return match?.[1] ?? 'unknown'
}

export function parseSpecDependencies(content: string): string[] {
  const match = content.match(/## 依存仕様\n([\s\S]*?)(?=\n##|$)/)
  if (!match) return []
  return [...match[1].matchAll(/`([a-z][a-z0-9-]+)`/g)].map(m => m[1])
}

// 指摘事項
export function readIssues(name: string): SpecIssue[] {
  const path = join(getSpecsDir(), 'issues', `${name}.json`)
  if (!existsSync(path)) return []
  return JSON.parse(readFileSync(path, 'utf-8'))
}

export function saveIssues(name: string, issues: SpecIssue[]): void {
  const dir = join(getSpecsDir(), 'issues')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, `${name}.json`), JSON.stringify(issues, null, 2), 'utf-8')
}

// 詳細仕様
export function elaboratedSpecExists(name: string): boolean {
  return existsSync(join(getSpecsDir(), 'elaborated', `${name}.md`))
}

export function readElaboratedSpec(name: string): string {
  const path = join(getSpecsDir(), 'elaborated', `${name}.md`)
  if (!existsSync(path)) throw new Error(`詳細仕様が見つかりません: specs/elaborated/${name}.md`)
  return readFileSync(path, 'utf-8')
}

export function writeElaboratedSpec(name: string, content: string): void {
  const dir = join(getSpecsDir(), 'elaborated')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, `${name}.md`), content, 'utf-8')
}

// タスク
export interface StoredTask extends Omit<Task, 'elaborated_spec_id'> {
  depends_on: string[]
}

export function readTasks(name: string): StoredTask[] {
  const path = join(getSpecsDir(), 'tasks', `${name}.json`)
  if (!existsSync(path)) return []
  return JSON.parse(readFileSync(path, 'utf-8'))
}

export function saveTasks(name: string, tasks: StoredTask[]): void {
  const dir = join(getSpecsDir(), 'tasks')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, `${name}.json`), JSON.stringify(tasks, null, 2), 'utf-8')
}

export function listAllTaskFiles(): string[] {
  const dir = join(getSpecsDir(), 'tasks')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
}
