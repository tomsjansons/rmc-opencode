# OpenCode PR Reviewer - Implementation Review

This document lists missed features, bugs, contradictions, and incomplete
implementations when comparing the actual codebase against the requirements in
`project-description.md` and `project-tasks.md`.

---

## Critical Missing Features

### 1. OpenCode Server Management Not Implemented

**Requirement:** The action should manage the OpenCode server lifecycle within
the runner (project-description.md §4.1, §5 Phase 1)

**Current State:** While `src/opencode/server.ts` exists with full
implementation including `start()`, `stop()`, `waitForHealthy()`, the server is
**never started** in `main.ts`. The code creates `OpenCodeClientImpl` pointing
to `OPENCODE_SERVER_URL` but never starts the server.

**Location:** `src/main.ts:33-34`

**Impact:** High - Action will fail because OpenCode server is not running

**Fix Required:**

```typescript
// In main.ts, before creating OpenCodeClient:
const server = new OpenCodeServer(config)
await server.start()
// ... later in finally block:
await server.stop()
```

### 2. Score Elevation Threshold Not Passed to Agent

**Requirement:** Multiple low-score issues (>= score_elevation_threshold) should
be combined and elevated (project-description.md §3.1, project-tasks.md §7.1)

**Current State:** The `score_elevation_threshold` input is defined in
`action.yml` and parsed in `inputs.ts`, but the threshold value is not passed to
the agent prompts. The agent is instructed in Pass 4 to "combine related issues"
but doesn't know the specific threshold count.

**Location:** `src/review/prompts.ts` - PASS_4 mentions combining issues but
lacks the threshold value

**Impact:** Low - Agent can still combine issues based on judgment, but the
user-configured threshold isn't communicated

**Fix Required:** Pass `elevationThreshold` to the PASS_4 prompt so the agent
knows when to combine low-score issues

---

## Missing Infrastructure

### 3. CI/CD Workflows Not Created

**Requirement:** Create proper CI/CD workflows (project-tasks.md §6.2)

**Current State:** The `.github/workflows/` directory only contains
`example-comment-trigger.yml`. Missing:

- Main CI workflow (test, lint, build)
- Integration test workflow
- Check-dist workflow
- CodeQL analysis

The README.md still references template workflows (linter.yml, ci.yml,
check-dist.yml, codeql-analysis.yml) that don't exist.

**Impact:** Medium - No automated testing in CI

### 4. Integration Tests Not Created

**Requirement:** Create integration test workflow (project-tasks.md §6.2)

**Current State:** Only 4 basic test files exist:

- `__tests__/config.test.ts`
- `__tests__/state.test.ts`
- `__tests__/main.test.ts`
- `__tests__/wait.test.ts`

Missing tests for:

- `github/api.ts`
- `opencode/client.ts`, `opencode/server.ts`
- `review/orchestrator.ts`
- `trpc/router.ts`

**Impact:** Medium - Test coverage appears low, no integration tests

---

## Documentation Issues

### 5. README.md Not Updated

**Requirement:** Update README with usage instructions, configuration, examples
(project-tasks.md §6.3)

**Current State:** README.md is still the template README from
`actions/typescript-action`. It:

- Refers to "milliseconds" input instead of actual inputs
- Contains template examples, not PR reviewer examples
- Missing:
  - Feature overview
  - Configuration reference
  - Scoring rubric documentation
  - Troubleshooting guide
  - Example workflows

**Impact:** High for adoption - Users cannot understand how to use the action

---

## API/Feature Gaps

### 6. Missing GitHub API Pagination

**Requirement:** GitHubAPI should handle pagination for large PRs
(project-tasks.md §3.3)

**Current State:** `src/github/api.ts` has:

- `getPRFiles()` limited to 100 files with no pagination

**Impact:** Low-Medium - Large PRs with >100 files may miss some files

### 7. Comments Module Not Created

**Requirement:** Create `src/github/comments.ts` for comment formatting
(project-tasks.md §3.4)

**Current State:** Comment formatting is done inline in `trpc/router.ts`:

```typescript
const commentBody = `${input.body}\n\n---\n\`\`\`json\n${JSON.stringify(input.assessment, null, 2)}\n\`\`\``
```

No dedicated module exists for:

- Comment format validation
- Reusable formatting functions
- Documentation of format requirements

**Impact:** Low - Works but violates project structure

---

## Bugs and Contradictions

### 8. Private Method Called from External Class

**Requirement:** Proper encapsulation and visibility

**Current State:** In `orchestrator.ts:148`:

```typescript
private async executeDisputeResolution(): Promise<void> {
```

But in `main.ts:82`:

```typescript
await orchestrator.executeDisputeResolution()
```

The method is marked `private` but called from `main.ts`. This works in
JavaScript at runtime but:

- Violates TypeScript visibility rules
- TypeScript compiler should error on this
- May indicate the method should be public or the call should be removed

**Impact:** High - TypeScript compilation should fail (may work due to build
config)

### 9. Event Trigger Handling Incomplete

**Requirement:** Only runs on "Ready for Review" or new pushes
(project-description.md §8)

**Current State:** `detectExecutionMode()` in `inputs.ts` handles:

- `issue_comment` events (for question-answering)
- `pull_request` events (for full-review)

But does not check:

- If PR is draft (should skip)
- If PR is "ready for review" specifically
- Specific `pull_request` action types (`opened`, `synchronize`, etc.)

**Impact:** Low - May run on draft PRs unnecessarily

### 10. Cache Key Missing Commit SHA

**Requirement:** State should track which commit was last reviewed
(project-description.md §3.2)

**Current State:** Cache key is:

```typescript
;`${CACHE_VERSION}-pr-review-state-${owner}-${repo}-${prNumber}`
```

The `lastCommitSha` is stored IN the state but not part of the cache key. This
means:

- Cache restore might return stale state from old commits
- New commits might get incorrect "previous issues" context

**Impact:** Medium - State may be stale after cache restore

### 11. Timeout Race Condition

**Current State:** In `orchestrator.ts:97-111`:

```typescript
const timeoutPromise = new Promise<never>((_resolve, reject) => {
  setTimeout(() => {
    reject(new OrchestratorError(...))
  }, timeoutMs)
})
await Promise.race([this.executeFourPassReview(), timeoutPromise])
```

The timeout promise is never cancelled when review completes successfully. This
could cause issues in long-running processes.

**Impact:** Low - Memory/timer cleanup issue

---

## Minor Issues

### 12. External Intelligence Tools Not Configurable

**Requirement:** Optional web_search and web_fetch tools (project-description.md
§3.4)

**Current State:** `enable_web` input exists and is passed to OpenCode server
config in `server.ts`, but:

- No `web_search` tool implementation
- Only `webfetch` is mentioned in prompts' tool guidelines

**Impact:** Low - Partial implementation, webfetch works

### 13. Hardcoded Bot Usernames

**Current State:** In `state.ts:254-255`:

```typescript
.filter((r) =>
  r.user?.login !== 'opencode-reviewer[bot]' &&
  r.user?.login !== 'github-actions[bot]'
)
```

These bot names are hardcoded. If action runs under different bot account, this
filter won't work correctly.

**Impact:** Low - Works for standard setup

### 14. Missing Rate Limit Handling

**Requirement:** Handle GitHub API rate limiting with exponential backoff
(project-tasks.md §3.3)

**Current State:** No rate limit handling in `GitHubAPI`. All API calls can fail
on rate limits without retry.

**Impact:** Medium for large/active repos

### 15. Review State Not Saved After Each Tool Call

**Requirement:** "Save state after each tool invocation that modifies it"
(project-tasks.md §3.1)

**Current State:** State is saved in tool handlers (`addThread`,
`updateThreadStatus`, `recordPassCompletion`), but these save the entire state
file each time. No batching or deferred save mechanism.

**Impact:** Low - Works but may be slow with many comments

---

## Summary

| Category            | Count  | Severity |
| :------------------ | :----- | :------- |
| Critical Missing    | 2      | High     |
| Missing Infra       | 2      | Medium   |
| Documentation       | 1      | High     |
| API/Feature Gaps    | 2      | Low      |
| Bugs/Contradictions | 4      | Varies   |
| Minor Issues        | 4      | Low      |
| **Total**           | **15** |          |

## Recommended Priority

1. **Fix OpenCode server startup** - Action won't work without this
2. **Fix `executeDisputeResolution` visibility** - Compilation/runtime error
3. **Update README.md** - Users cannot adopt without docs
4. **Add CI/CD workflows** - Quality assurance
5. **Pass elevation threshold to prompts** - Minor enhancement

## Clarifications

### AGENTS.md Loading - Implemented Correctly

The AGENTS.md feature is properly implemented. The prompts instruct the OpenCode
agent to check for AGENTS.md rules in Pass 1, Pass 2, and Pass 3. Since the
agent has access to `read`, `grep`, `glob`, and `list` tools, it can read
AGENTS.md directly into its context when needed.

This is the correct approach because:

- The agent manages its own context across all 4 passes
- Instructing the agent to read the file is sufficient
- No external pre-loading is required
- The agent can intelligently decide when/if to read AGENTS.md based on the
  repository structure

**Location:** `src/review/prompts.ts` - PASS_1, PASS_2, PASS_3 all reference
AGENTS.md with specific guidance on what rules to check.

### Security Sensitivity Score Elevation - Implemented Correctly

The security sensitivity score elevation (+2 for PII/Financial data) is properly
implemented via agent instructions:

- `buildSecuritySensitivity()` detects sensitive repositories based on
  dependencies and README content
- The sensitivity string is passed to PASS_3 prompt
- The prompt includes explicit instructions: "Security findings will be
  automatically elevated by +2 points due to sensitive data handling"
- The scoring rubric in the system prompt also mentions this elevation

This is the correct approach - the agent applies the elevation when assigning
scores, which is more flexible than enforcing it in the tool layer.

**Location:** `src/review/prompts.ts` - PASS_3 and SCORING_RUBRIC
