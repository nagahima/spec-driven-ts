import { createServer } from 'http'
import { exec } from 'child_process'
import { randomBytes } from 'crypto'

const CALLBACK_PORT = 9876
const CALLBACK_URL = `http://localhost:${CALLBACK_PORT}/callback`
const AUTH_TIMEOUT_MS = 5 * 60 * 1000 // 5分

export interface GitHubAuthResult {
  token: string
  login: string
  email: string
}

function getCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    console.error('エラー: GITHUB_CLIENT_ID と GITHUB_CLIENT_SECRET を環境変数に設定してください')
    console.error('  export GITHUB_CLIENT_ID=your_client_id')
    console.error('  export GITHUB_CLIENT_SECRET=your_client_secret')
    process.exit(1)
  }
  return { clientId, clientSecret }
}

function openBrowser(url: string): void {
  const cmd =
    process.platform === 'darwin' ? `open "${url}"` :
    process.platform === 'win32'  ? `start "" "${url}"` :
                                    `xdg-open "${url}"`
  exec(cmd)
}

async function exchangeCodeForToken(code: string, clientId: string, clientSecret: string): Promise<string> {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  })
  const data = await res.json() as { access_token?: string; error?: string }
  if (!data.access_token) {
    throw new Error(data.error ?? 'トークンの取得に失敗しました')
  }
  return data.access_token
}

async function fetchGitHubUser(token: string): Promise<{ login: string; email: string }> {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
  }

  const userRes = await fetch('https://api.github.com/user', { headers })
  const user = await userRes.json() as { login: string; email: string | null }

  let email = user.email ?? ''
  if (!email) {
    const emailsRes = await fetch('https://api.github.com/user/emails', { headers })
    const emails = await emailsRes.json() as { email: string; primary: boolean }[]
    email = emails.find(e => e.primary)?.email ?? ''
  }

  return { login: user.login, email }
}

export async function startOAuthFlow(): Promise<GitHubAuthResult> {
  const { clientId, clientSecret } = getCredentials()
  const state = randomBytes(16).toString('hex')

  const authUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(CALLBACK_URL)}` +
    `&scope=read:user,user:email` +
    `&state=${state}`

  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      const url = new URL(req.url ?? '/', `http://localhost:${CALLBACK_PORT}`)
      if (url.pathname !== '/callback') {
        res.writeHead(404); res.end(); return
      }

      const code = url.searchParams.get('code')
      const returnedState = url.searchParams.get('state')

      if (returnedState !== state || !code) {
        res.writeHead(400)
        res.end('<html><body><h1>認証失敗</h1><p>このタブを閉じてください。</p></body></html>')
        server.close()
        reject(new Error('無効なstateパラメーターです'))
        return
      }

      try {
        const token = await exchangeCodeForToken(code, clientId, clientSecret)
        const { login, email } = await fetchGitHubUser(token)

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end('<html><body><h1>認証完了</h1><p>このタブを閉じてください。</p></body></html>')
        server.close()
        resolve({ token, login, email })
      } catch (err) {
        res.writeHead(500)
        res.end('<html><body><h1>認証失敗</h1></body></html>')
        server.close()
        reject(err)
      }
    })

    const timeout = setTimeout(() => {
      server.close()
      reject(new Error('認証がタイムアウトしました（5分）'))
    }, AUTH_TIMEOUT_MS)

    server.on('error', (err: NodeJS.ErrnoException) => {
      clearTimeout(timeout)
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`ポート ${CALLBACK_PORT} が使用中です。他のプロセスを停止してください。`))
      } else {
        reject(err)
      }
    })

    server.listen(CALLBACK_PORT, () => {
      console.log('ブラウザでGitHub認証を行ってください...')
      openBrowser(authUrl)
    })
  })
}
