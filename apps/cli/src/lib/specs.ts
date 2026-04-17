import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import type { SpecIssue } from 'types'

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

export function getSpecStatus(content: string): string {
  const match = content.match(/ステータス:\s*(\w+)/)
  return match?.[1] ?? 'unknown'
}
