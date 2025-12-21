import { createHTTPServer } from '@trpc/server/adapters/standalone'

import {
  TRPC_SERVER_HOST,
  TRPC_SERVER_PORT,
  TRPC_SERVER_URL
} from '../config/constants.js'
import type { GitHubAPI } from '../github/api.js'
import type { ReviewOrchestrator } from '../review/orchestrator.js'
import { logger } from '../utils/logger.js'
import { appRouter, type TRPCContext } from './router.js'

export class TRPCServer {
  private server: ReturnType<typeof createHTTPServer> | null = null

  constructor(
    private orchestrator: ReviewOrchestrator,
    private github: GitHubAPI,
    private port: number = TRPC_SERVER_PORT
  ) {}

  async start(): Promise<void> {
    const context: TRPCContext = {
      orchestrator: this.orchestrator,
      github: this.github
    }

    this.server = createHTTPServer({
      router: appRouter,
      createContext: () => context
    })

    await new Promise<void>((resolve) => {
      if (!this.server) {
        throw new Error('Server not initialized')
      }
      this.server.listen(this.port, () => {
        logger.info(`tRPC server listening on ${TRPC_SERVER_HOST}:${this.port}`)
        resolve()
      })
    })
  }

  async stop(): Promise<void> {
    if (this.server) {
      const httpServer = (
        this.server as unknown as {
          server: { close: (cb: () => void) => void }
        }
      ).server
      await new Promise<void>((resolve) => {
        httpServer.close(() => {
          logger.info('tRPC server stopped')
          resolve()
        })
      })
    }
  }

  getUrl(): string {
    return TRPC_SERVER_URL
  }
}
