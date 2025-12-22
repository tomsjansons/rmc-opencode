# Question Answering with @review-my-code-bot

The OpenCode PR Reviewer can answer questions about your codebase when mentioned
in PR comments.

## How to Use

Simply mention `@review-my-code-bot` in any PR comment with your question:

```
@review-my-code-bot Why is the UserService needed in this component?
```

```
@review-my-code-bot How does authentication work in this API endpoint?
```

```
@review-my-code-bot What happens if the payment fails?
```

## What the Bot Can Do

The bot has access to the entire codebase and can:

- **Find relevant code**: Uses grep, glob, and file reading to locate related
  code
- **Trace execution flows**: Follows function calls and dependencies
- **Explain purpose**: Analyzes code to understand intent and design decisions
- **Identify edge cases**: Examines error handling and boundary conditions
- **Reference specific locations**: Provides file paths and line numbers in
  answers

## Example Interactions

### Question: Why is this function needed?

**Developer asks:**

```
@review-my-code-bot Why is the calculateDiscount function needed? Can't we just use percentages directly?
```

**Bot responds:**

```
**@alice asked: "Why is the calculateDiscount function needed? Can't we just use percentages directly?"**

The `calculateDiscount` function (src/billing/discount.ts:23-45) handles complex discount rules that go beyond simple percentages:

1. **Tiered Discounts**: Applies different rates based on cart total
   - Orders $0-$50: 5%
   - Orders $50-$100: 10%
   - Orders $100+: 15%

2. **Promotional Codes**: Integrates with PromotionService.validate() to apply special codes

3. **Member Benefits**: Adds loyalty bonuses from UserService.getMembershipLevel()

This is called by CheckoutService.processOrder() (src/checkout/service.ts:87) to ensure consistent discount calculation across all payment flows.

---
*Answered by @review-my-code-bot using codebase analysis*
```

### Question: How does error handling work?

**Developer asks:**

```
@review-my-code-bot How are API errors handled in this new endpoint?
```

**Bot responds:**

```
**@bob asked: "How are API errors handled in this new endpoint?"**

Looking at the new `/api/users/profile` endpoint (src/routes/users.ts:142-178), errors are handled through a 3-layer approach:

1. **Input Validation** (line 145-149):
   - Uses Zod schema validation
   - Returns 400 Bad Request for invalid inputs
   - Includes field-specific error messages

2. **Service Layer Errors** (line 152-165):
   - Wrapped in try-catch block
   - Database errors caught and logged via Logger.error()
   - Returns 500 Internal Server Error with sanitized message

3. **Global Error Handler** (middleware/errorHandler.ts:12-34):
   - Catches any unhandled errors
   - Logs to monitoring service
   - Returns appropriate HTTP status codes
   - Hides sensitive details in production

The pattern matches existing endpoints like `/api/users/settings` (src/routes/users.ts:89).

---
*Answered by @review-my-code-bot using codebase analysis*
```

## How It Works

1. **Trigger**: Workflow detects `@review-my-code-bot` mention in issue_comment
   event
2. **Parse**: Extracts the question text from the comment
3. **Context**: Gathers PR context (changed files, diffs) if available
4. **Explore**: OpenCode agent uses read/grep/glob tools to explore codebase
5. **Answer**: Agent formulates response based on actual code
6. **Reply**: Posts answer as a comment reply

## Workflow Setup

Add the `issue_comment` trigger to your workflow:

```yaml
name: Code Review Bot

on:
  pull_request:
    types: [opened, synchronize, ready_for_review]
  issue_comment:
    types: [created]

jobs:
  review:
    if: |
      github.event_name == 'pull_request' || 
      (github.event_name == 'issue_comment' && 
       github.event.issue.pull_request && 
       contains(github.event.comment.body, '@review-my-code-bot'))

    runs-on: ubuntu-latest

    permissions:
      pull-requests: write
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Checkout PR head for comment events
        if: github.event_name == 'issue_comment'
        run: gh pr checkout ${{ github.event.issue.number }}
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Run OpenCode PR Reviewer
        uses: your-org/opencode-pr-reviewer@v1
        with:
          opencode_api_key: ${{ secrets.OPENCODE_API_KEY }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

## Best Practices

### Ask Specific Questions

**Good:**

- "Why is caching disabled in the UserRepository?"
- "How does the retry logic work for failed payments?"
- "Where is the email validation performed?"

**Less Effective:**

- "Explain this code" (too broad)
- "Is this correct?" (needs context)
- "What does this do?" (be more specific)

### Provide Context

When asking about specific code, comment on the relevant file or line:

```typescript
// In UserService.ts, line 42
const result = (await this.cache.get(key)) || (await this.db.fetch(key))

// Comment on this line:
// @review-my-code-bot Why check cache first? Doesn't the DB have the latest data?
```

### Use for Learning

Great for:

- Understanding architectural decisions
- Learning how features work
- Discovering edge cases
- Finding related code

Not ideal for:

- Requesting code changes (use PR review comments instead)
- Getting opinions on style (use linters/formatters)
- Debugging runtime issues (provide logs/context separately)

## Limitations

- **Codebase Only**: Bot only knows what's in the repository, not external
  documentation
- **Static Analysis**: Cannot run code or predict runtime behavior
- **No Memory**: Each question is independent (no conversation history)
- **Rate Limits**: GitHub API rate limits apply

## Tips

1. **Be Clear**: Specific questions get better answers
2. **Check Replies**: Bot responds as a comment reply to your original comment
3. **Multiple Questions**: Ask separately for distinct topics
4. **Complex Questions**: Break down into smaller, focused questions

## Privacy & Security

- Bot only accesses code in the repository
- No external data sources without explicit configuration
- Answers are posted as public PR comments
- API keys are stored securely in GitHub Secrets
