declare module '@opencode-ai/plugin' {
  import type { z } from 'zod'

  export interface ToolDefinition<TArgs, TReturn> {
    description: string
    args: TArgs
    execute: (
      args: z.infer<TArgs extends z.ZodType ? TArgs : never>
    ) => Promise<TReturn> | TReturn
  }

  export function tool<TArgs, TReturn>(
    definition: ToolDefinition<TArgs, TReturn>
  ): ToolDefinition<TArgs, TReturn>

  export namespace tool {
    export const schema: typeof z
  }
}
