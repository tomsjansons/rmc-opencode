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
    'Get current review state including all threads and their statuses',
  args: {},
  async execute() {
    const state = await trpc.github.getRunState.query()
    return JSON.stringify(state, null, 2)
  }
})
