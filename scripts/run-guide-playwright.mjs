import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const host = '127.0.0.1'
const port = 5175
const baseUrl = `http://${host}:${port}`

const server = await createServer({
  server: {
    host,
    port,
    strictPort: true,
  },
})

let child

async function shutdown(code = 0) {
  if (child && !child.killed) {
    child.kill('SIGTERM')
  }

  await server.close()
  process.exit(code)
}

process.on('SIGINT', () => void shutdown(130))
process.on('SIGTERM', () => void shutdown(143))

try {
  await server.listen()

  const playwrightCli = fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url))
  const specs = ['tests/e2e/platform-guide.spec.ts']
  if (process.env.E2E_AUTH_ENABLED === 'true') {
    specs.push('tests/e2e/platform-guide-auth.spec.ts')
  }

  child = spawn(
    process.execPath,
    [
      playwrightCli,
      'test',
      ...specs,
      '--config=playwright.guide.config.ts',
    ],
    {
      cwd: new URL('..', import.meta.url),
      env: {
        ...process.env,
        E2E_BASE_URL: baseUrl,
      },
      stdio: 'inherit',
    },
  )

  child.on('close', (code) => {
    void shutdown(code ?? 1)
  })
} catch (error) {
  console.error(error)
  await shutdown(1)
}
