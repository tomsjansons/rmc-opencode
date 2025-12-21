import { tool } from '@opencode-ai/plugin'
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'

import { TRPC_SERVER_URL } from '../../config/constants.js'
import type { AppRouter } from '../../trpc/router.js'

const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: TRPC_SERVER_URL,
      transformer: superjson
    })
  ]
})

export default tool({
  description:
    'Reply to an existing review thread. Use is_concession: true when accepting developer explanation.',
  args: {
    threadId: tool.schema.string().describe('Thread ID to reply to'),
    body: tool.schema.string().describe('Reply message'),
    isConcession: tool.schema
      .boolean()
      .optional()
      .describe('Set to true when accepting developer explanation')
  },
  async execute(args) {
    await trpc.github.replyToThread.mutate(args)
    return 'Reply posted successfully'
  }
})
