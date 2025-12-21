import { createOpencodeClient } from '@opencode-ai/sdk'

import { logger } from '../utils/logger.js'
import { OpenCodeError } from '../utils/errors.js'
import type { Session } from './types.js'

export interface OpenCodeClient {
  createSession(title: string): Promise<Session>
  deleteSession(sessionId: string): Promise<void>
  sendSystemPrompt(sessionId: string, systemPrompt: string): Promise<void>
  sendPrompt(sessionId: string, prompt: string): Promise<void>
  getCurrentSessionId(): string | null
}

export class OpenCodeClientImpl implements OpenCodeClient {
  private currentSessionId: string | null = null
  private client: ReturnType<typeof createOpencodeClient>

  constructor(serverUrl: string) {
    this.client = createOpencodeClient({
      baseUrl: serverUrl,
      throwOnError: true
    })
  }

  async createSession(title: string): Promise<Session> {
    try {
      logger.debug(`Creating OpenCode session: ${title}`)

      const response = await this.client.session.create({
        body: {
          title
        }
      })

      if (!response.data) {
        throw new OpenCodeError('Failed to create session: no data returned')
      }

      const session: Session = {
        id: response.data.id,
        title: response.data.title,
        createdAt: response.data.time.created
      }

      this.currentSessionId = session.id
      logger.info(`Created OpenCode session: ${session.id}`)

      return session
    } catch (error) {
      throw new OpenCodeError(
        `Failed to create session: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      logger.debug(`Deleting OpenCode session: ${sessionId}`)

      await this.client.session.delete({
        path: { id: sessionId }
      })

      if (this.currentSessionId === sessionId) {
        this.currentSessionId = null
      }

      logger.info(`Deleted OpenCode session: ${sessionId}`)
    } catch (error) {
      throw new OpenCodeError(
        `Failed to delete session ${sessionId}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async sendSystemPrompt(
    sessionId: string,
    systemPrompt: string
  ): Promise<void> {
    try {
      logger.debug(
        `Sending system prompt to session ${sessionId} (${systemPrompt.length} chars)`
      )

      await this.client.session.prompt({
        path: { id: sessionId },
        body: {
          noReply: true,
          parts: [
            {
              type: 'text',
              text: systemPrompt
            }
          ]
        }
      })

      logger.info(`System prompt injected into session ${sessionId}`)
    } catch (error) {
      throw new OpenCodeError(
        `Failed to send system prompt: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async sendPrompt(sessionId: string, prompt: string): Promise<void> {
    try {
      logger.debug(
        `Sending prompt to session ${sessionId} (${prompt.length} chars)`
      )

      const response = await this.client.session.prompt({
        path: { id: sessionId },
        body: {
          parts: [
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      })

      if (!response.data) {
        throw new OpenCodeError('Failed to send prompt: no response data')
      }

      logger.debug(`Prompt sent successfully to session ${sessionId}`)
    } catch (error) {
      throw new OpenCodeError(
        `Failed to send prompt: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionId
  }
}
