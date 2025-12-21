# Project

This is a repo of a custom Github Action. This action will implement an LLM Code
rview agent based on OpenCode.

The full project description is located at ./project-description.md

The repo is created from the https://github.com/actions/typescript-action
template

Please follow ./AGENTS.md

OpenCode Docs are available here https://opencode.ai/docs/

We will work on tasks within the broader poject.

# Task

## Phase 4: Review Orchestration & Multi-Pass Logic

### Task 4.1: Implement Review Pass System Prompts

**Objective:** Create the system prompts for each of the 4 review passes.

**Changes Required:**

- Create comprehensive system prompt with scoring rubric
- Define pass-specific prompts for each review phase
- Include AGENTS.md content in prompts (if exists)
- Add context about PR structure and goals

**Technical Details:**

System prompt should include:

- Complete 1-10 scoring rubric from project description
- Tool usage guidelines
- Output format requirements (assessment JSON)
- Security audit guidelines
- Proportionality rules for refactoring suggestions

Pass-specific prompts:

**Pass 1: Atomic Diff Review**

```

You are conducting Pass 1 of 4 in a multi-pass code review.

Goal: Review each changed line in isolation. Focus on:

- Syntax errors and typos
- Obvious logic errors
- Code style violations
- Local performance issues

Do NOT suggest architectural changes in this pass.

Files changed: [list] Diff: [diff content]

```

**Pass 2: Structural/Layered Review**

```

You are conducting Pass 2 of 4 in a multi-pass code review.

Goal: Understand how changes fit into the broader codebase. Use read/grep/glob
tools to:

- Trace function call chains
- Verify interface contracts
- Check for unused imports/exports
- Identify inconsistencies with similar patterns

Previous pass findings: [Pass 1 summary]

```

**Pass 3: Security & AGENTS.md Compliance**

```

You are conducting Pass 3 of 4 in a multi-pass code review.

Goal: Security audit and rule enforcement:

- Access control issues
- Data integrity risks
- AGENTS.md violations (if file exists)
- Architectural standards

Security sensitivity: [determined from package.json/README] AGENTS.md content:
[content if exists, or "Not found"]

```

**Pass 4: Consolidation & Noise Reduction**

```

You are conducting Pass 4 of 4 in a multi-pass code review.

Goal: Final review of all findings:

- Remove redundant comments
- Combine related issues
- Verify score accuracy
- Ensure proportionality of suggestions

All findings from passes 1-3: [consolidated list]

Submit only high-confidence, high-value feedback.

```

**Acceptance Criteria:**

- [ ] System prompt includes complete scoring rubric
- [ ] All 4 pass prompts are defined
- [ ] Prompts guide the agent appropriately for each phase
- [ ] AGENTS.md content is included when available
- [ ] Security sensitivity is determined from repo metadata
- [ ] Prompts are clear and actionable

**Files to Create:**

- `src/review/prompts.ts`

**Files to Modify:**

- None

---

### Task 4.2: Implement Review Orchestrator

**Objective:** Create the orchestrator that manages the 4-pass review workflow
within a single OpenCode session.

**Changes Required:**

- Implement sequential pass execution
- Manage context between passes
- Handle pass completion and transitions
- Aggregate results across passes

**Technical Details:**

Orchestrator responsibilities:

1. Initialize OpenCode session with system prompt
2. Execute Pass 1 with diff context
3. Wait for `submit_pass_results()` tool call
4. Execute Pass 2 with Pass 1 summary
5. Wait for `submit_pass_results()` tool call
6. Execute Pass 3 with security context and AGENTS.md
7. Wait for `submit_pass_results()` tool call
8. Execute Pass 4 with all previous findings
9. Wait for `submit_pass_results()` tool call
10. Generate final review summary

Context management:

- All passes run in same OpenCode session (no state resets)
- Pass summaries are accumulated and passed to subsequent passes
- OpenCode manages its own file context
- State is preserved across passes via OpenCode's internal mechanisms

Error handling:

- If a pass fails, retry once before failing the action
- If agent doesn't call `submit_pass_results()`, timeout after 10 minutes
- Log detailed information about each pass for debugging

**Acceptance Criteria:**

- [ ] All 4 passes execute sequentially
- [ ] Context flows correctly between passes
- [ ] Pass completion is detected via tool call
- [ ] Timeouts prevent infinite loops
- [ ] Errors in one pass don't crash entire review
- [ ] Final summary includes all pass results
- [ ] Detailed logging tracks progress

**Files to Create:**

- `src/review/orchestrator.ts`

**Files to Modify:**

- None

---

### Task 4.3: Implement Fix Verification on Subsequent Commits

**Objective:** When new commits are pushed to the PR, verify if previous issues
were addressed.

**Changes Required:**

- Load previous review state
- Compare new code against pending issues
- Auto-resolve threads when fixes are detected
- Re-raise issues that remain unaddressed

**Technical Details:**

Verification logic:

1. Load state from cache (contains previous issues)
2. For each PENDING or DISPUTED thread:
   - Check if the file/line still exists in new commit
   - Use OpenCode to analyze if the issue still applies
   - If fixed, call `github_resolve_thread()` with explanation
   - If still present, add follow-up comment
3. Run full 4-pass review on new changes only
4. Cross-reference new findings with old state to avoid duplicates

Agent should receive context:

```

Previous review state:

- 5 issues were raised in the last review
- 2 are marked as DISPUTED
- 3 are PENDING

Your task for this review:

1. Verify if any of the 5 previous issues are now fixed
2. Review the new changes (commits: abc123..def456)
3. Do not re-raise issues that are already tracked

````

**Acceptance Criteria:**

- [ ] Previous issues are loaded from state
- [ ] Agent verifies each previous issue
- [ ] Fixed issues are auto-resolved with explanation
- [ ] Unfixed issues are followed up
- [ ] New review doesn't duplicate existing issues
- [ ] Cross-file fixes are detected

**Files to Create:**

- None (extend `src/review/orchestrator.ts`)

**Files to Modify:**

- `src/review/orchestrator.ts`

