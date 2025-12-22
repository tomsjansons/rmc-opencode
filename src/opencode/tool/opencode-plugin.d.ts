declare module '@opencode-ai/plugin' {
  import type { z } from 'zod'

  type InferArgs<T> = T extends z.ZodType
    ? z.infer<T>
    : T extends Record<string, z.ZodType>
      ? { [K in keyof T]: z.infer<T[K]> }
      : never

  export interface ToolDefinition<
    TArgs extends Record<string, z.ZodType>,
    TReturn
  > {
    description: string
    args: TArgs
    execute: (args: InferArgs<TArgs>) => Promise<TReturn> | TReturn
  }

  export function tool<TArgs extends Record<string, z.ZodType>, TReturn>(
    definition: ToolDefinition<TArgs, TReturn>
  ): ToolDefinition<TArgs, TReturn>

  export namespace tool {
    export const schema: typeof z
  }
}
