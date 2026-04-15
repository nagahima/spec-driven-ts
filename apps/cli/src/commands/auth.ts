import { Command } from 'commander'
import { startOAuthFlow } from '../lib/oauth'
import { readConfig, writeConfig, clearAuth } from '../lib/config'

export function createAuthCommand(): Command {
  const auth = new Command('auth').description('認証の管理')

  auth
    .command('login')
    .description('GitHubでログイン')
    .action(async () => {
      const config = readConfig()
      if (config.auth) {
        console.log(`既にログイン済みです: ${config.auth.github_login} (${config.auth.github_email})`)
        console.log('ログアウトするには: sdd auth logout')
        return
      }
      try {
        const result = await startOAuthFlow()
        writeConfig({ ...config, auth: { github_token: result.token, github_login: result.login, github_email: result.email } })
        console.log(`\nログイン成功: ${result.login} (${result.email})`)
      } catch (err) {
        console.error(`\nログイン失敗: ${(err as Error).message}`)
        process.exit(1)
      }
    })

  auth
    .command('logout')
    .description('ログアウト')
    .action(() => {
      const config = readConfig()
      if (!config.auth) {
        console.log('現在ログインしていません')
        return
      }
      const login = config.auth.github_login
      clearAuth()
      console.log(`ログアウトしました: ${login}`)
    })

  auth
    .command('status')
    .description('認証状態を表示')
    .action(() => {
      const config = readConfig()
      if (!config.auth) {
        console.log('未ログイン')
        return
      }
      console.log(`ログイン中: ${config.auth.github_login} (${config.auth.github_email})`)
    })

  return auth
}
