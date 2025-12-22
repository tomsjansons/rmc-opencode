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
    'Escalate an unresolved dispute to human reviewers for final decision. Only available when human escalation is enabled.',
  args: {
    threadId: tool.schema.string().describe('Thread ID to escalate'),
    agentPosition: tool.schema
      .string()
      .describe("Summary of the agent's position on the issue"),
    developerPosition: tool.schema
      .string()
      .describe("Summary of the developer's counter-argument")
  },
  async execute(args) {
    await trpc.github.escalateDispute.mutate(args)
    return 'Dispute escalated to human reviewers successfully'
  }
})
