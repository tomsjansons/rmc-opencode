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
  description: 'Resolve a review thread when the issue is verified as fixed',
  args: {
    threadId: tool.schema.string().describe('Thread ID to resolve'),
    reason: tool.schema
      .string()
      .describe('Clear reason explaining why issue is resolved')
  },
  async execute(args) {
    await trpc.github.resolveThread.mutate(args)
    return 'Thread resolved successfully'
  }
})
