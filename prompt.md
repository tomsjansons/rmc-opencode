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

### Task 7.4: Review and Dispute Resolution Logic and Implement missing features

**Objective:** Handle developer disputes of raised issues with intelligent
resolution logic.

**Changes Required:**

- Detect when developer disputes an issue
- Agent evaluates the reasoning
- Agent decides to concede or maintain position
- Escalate unresolved disputes to human reviewers

**Technical Details:**

Dispute handling flow:

1. **Detection**: Monitor for developer replies to agent comments
2. **Classification**: Determine if reply is:
   - Acknowledgment (will fix)
   - Dispute (disagrees with finding)
   - Question (needs clarification)
   - Out-of-scope (will fix later)

3. **Agent evaluation** (automated via OpenCode):
   - Re-examine the code with dispute reasoning
   - Assess if reasoning is valid
   - Consider:
     - Is the original finding still accurate?
     - Does the explanation address the concern?
     - Is the proposed alternative acceptable?
     - Does "fix later" introduce temporary risk?

4. **Resolution actions**:
   - **Concede**: Call `github_reply_to_thread(is_concession=true)` + resolve
   - **Maintain**: Explain why finding still stands
   - **Escalate**: Request human reviewer (if configured)

Example dispute scenarios:

**Scenario 1: Valid dispute (agent concedes)**

```
Agent: "This nested loop is O(n²), consider using a Map for O(n)" (score: 6)
Dev: "The array is always <10 items (config validation ensures this), so O(n²) is acceptable"
Agent: "You're correct. Given the size constraint, the performance impact is negligible. Conceding." [Resolves thread]
```

**Scenario 2: Invalid dispute (agent maintains)**

```
Agent: "Missing authorization check on this endpoint" (score: 9)
Dev: "Authorization is handled by middleware"
Agent: "I've reviewed the middleware, and it only applies to routes in /api/admin/. This endpoint at /api/user/data requires explicit checks. The finding stands."
```

**Scenario 3: Future fix risk (agent rejects)**

```
Agent: "Race condition in payment processing" (score: 9)
Dev: "Acknowledged, will fix in next sprint"
Agent: "This creates a data corruption risk in production. The PR should not merge until this is addressed, as the impact is critical."
```

State updates for disputes:

- Thread status becomes "DISPUTED"
- Dispute reasoning is stored in thread history
- If agent concedes, status becomes "RESOLVED"
- If agent maintains and dev accepts, status becomes "PENDING"
- If neither concedes, status stays "DISPUTED"

Human escalation (optional feature):

- If configured, tag a human reviewer on disputed threads
- Provide summary of agent vs. developer positions
- Human reviewer makes final call

**Acceptance Criteria:**

- [ ] Developer disputes are detected
- [ ] Agent evaluates reasoning intelligently
- [ ] Concessions are handled correctly
- [ ] Agent maintains position when appropriate
- [ ] High-risk "fix later" responses are rejected
- [ ] Dispute state is tracked correctly
- [ ] Human escalation works (if implemented)
