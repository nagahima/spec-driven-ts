import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const CONFIG_DIR = join(homedir(), '.sdd')
const CONFIG_PATH = join(CONFIG_DIR, 'config.json')

export interface AuthConfig {
  github_token: string
  github_login: string
  github_email: string
}

export interface SddConfig {
  auth?: AuthConfig
}

export function readConfig(): SddConfig {
  if (!existsSync(CONFIG_PATH)) return {}
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'))
  } catch {
    return {}
  }
}

export function writeConfig(config: SddConfig): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
  }
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8')
}

export function clearAuth(): void {
  const config = readConfig()
  delete config.auth
  writeConfig(config)
}
