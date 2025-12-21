export interface PostReviewCommentArgs {
  path: string
  line: number
  body: string
}

export class GitHubAPI {
  async getPRDiff(): Promise<string> {
    throw new Error('TODO: Implement in Phase 3 - GitHub API integration')
  }

  async getPRFiles(): Promise<string[]> {
    throw new Error('TODO: Implement in Phase 3 - GitHub API integration')
  }

  async postReviewComment(_args: PostReviewCommentArgs): Promise<string> {
    throw new Error('TODO: Implement in Phase 3 - GitHub API integration')
  }

  async replyToComment(_threadId: string, _body: string): Promise<void> {
    throw new Error('TODO: Implement in Phase 3 - GitHub API integration')
  }

  async resolveThread(_threadId: string, _reason: string): Promise<void> {
    throw new Error('TODO: Implement in Phase 3 - GitHub API integration')
  }
}
