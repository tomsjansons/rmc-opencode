import type { Session } from './types.js'

export interface OpenCodeClient {
  createSession(title: string): Promise<Session>
  deleteSession(sessionId: string): Promise<void>
  sendPrompt(sessionId: string, prompt: string): Promise<void>
  getCurrentSessionId(): string | null
}

export class OpenCodeClientImpl implements OpenCodeClient {
  private currentSessionId: string | null = null

  constructor(private serverUrl: string) {}

  async createSession(_title: string): Promise<Session> {
    throw new Error(
      `TODO: implement OpenCode SDK session.create() at ${this.serverUrl}`
    )
  }

  async deleteSession(_sessionId: string): Promise<void> {
    throw new Error('TODO: implement OpenCode SDK session.delete()')
  }

  async sendPrompt(_sessionId: string, _prompt: string): Promise<void> {
    throw new Error('TODO: implement OpenCode SDK session.prompt()')
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionId
  }

  setCurrentSessionId(sessionId: string): void {
    this.currentSessionId = sessionId
  }
}
