# Project

This is a repo of a custom Github Action. This action will implement an LLM Code rview agent based on OpenCode.

The full project description is located at ./project-description.md

The repo is created from the https://github.com/actions/typescript-action template

Please follow ./AGENTS.md

We will work on tasks within the broader poject.

# Task

## Phase 1: Infrastructure & Configuration Setup

### Task 1.1: Update Action Metadata and Inputs

**Objective:** Configure the GitHub Action with proper inputs, outputs, and
metadata.

**Changes Required:**

- Update `action.yml` with proper branding, description, and inputs
- Define configuration inputs for OpenCode API key, model selection, thresholds,
  etc.
- Remove template placeholders

**Technical Details:** Required inputs in `action.yml`:

```yaml
inputs:
  opencode_api_key:
    description: 'API key for OpenCode SDK'
    required: true
  model:
    description: 'LLM model to use (e.g., google/gemini-flash-1.5)'
    required: false
    default: 'google/gemini-flash-1.5'
  problem_score_threshold:
    description: 'Minimum score (1-10) for reporting issues'
    required: false
    default: '5'
  score_elevation_threshold:
    description: 'Number of low-score issues to elevate collectively'
    required: false
    default: '5'
  enable_web:
    description: 'Enable web search and fetch capabilities'
    required: false
    default: 'false'
  github_token:
    description: 'GitHub token for API access'
    required: true
    default: ${{ github.token }}
```

**Acceptance Criteria:**

- [ ] `action.yml` contains all required inputs with proper defaults
- [ ] Action metadata (name, description, branding) is updated
- [ ] Inputs are properly typed and documented
- [ ] GitHub token is configured for API access

**Files to Modify:**

- `action.yml`

---

### Task 1.2: Initialize TypeScript Project Structure

**Objective:** Set up the TypeScript project structure with proper modules and
dependencies.

**Changes Required:**

- Install required dependencies (`@actions/cache`, `@actions/github`,
  `@octokit/rest`)
- Create module structure under `src/`
- Set up TypeScript configuration for the new modules

**Technical Details:** New directory structure:

```
src/
├── index.ts                    # Entry point
├── main.ts                     # Main action logic
├── config/
│   └── inputs.ts              # Input parsing and validation
├── opencode/
│   ├── server.ts              # OpenCode server lifecycle management
│   ├── client.ts              # OpenCode SDK client wrapper
│   └── tools.ts               # Custom tool implementations
├── github/
│   ├── api.ts                 # GitHub API wrapper
│   ├── comments.ts            # Comment management
│   └── state.ts               # State management with cache
├── review/
│   ├── orchestrator.ts        # Multi-pass review orchestrator
│   ├── prompts.ts             # System prompts for each pass
│   └── types.ts               # Type definitions
└── utils/
    ├── logger.ts              # Logging utilities
    └── errors.ts              # Error handling
```

Dependencies to add:

```json
{
  "@actions/cache": "^3.2.4",
  "@actions/github": "^6.0.0",
  "@octokit/rest": "^20.0.2",
  "opencode-sdk": "latest"
}
```

**Acceptance Criteria:**

- [ ] All dependencies are installed
- [ ] Directory structure is created
- [ ] TypeScript compiles without errors
- [ ] Module exports are properly configured

**Files to Create:**

- All files in the structure above (initially as stubs)

**Files to Modify:**

- `package.json` (add dependencies)
- `tsconfig.json` (if needed for module resolution)

---

### Task 1.3: Implement Configuration Parser

**Objective:** Parse and validate GitHub Action inputs into a typed
configuration object.

**Changes Required:**

- Create configuration types
- Implement input parsing with validation
- Handle environment variables and defaults

**Technical Details:** Configuration interface:

```typescript
export interface ReviewConfig {
  opencode: {
    apiKey: string
    model: string
    enableWeb: boolean
  }
  scoring: {
    problemThreshold: number // 1-10
    elevationThreshold: number // Number of issues to elevate
  }
  github: {
    token: string
    owner: string
    repo: string
    prNumber: number
  }
}
```

Implementation should:

- Use `@actions/core.getInput()` for all inputs
- Validate numeric thresholds are within valid ranges
- Extract PR context from GitHub event payload
- Throw descriptive errors for invalid configuration

**Acceptance Criteria:**

- [ ] Configuration is parsed from action inputs
- [ ] Validation catches invalid values with clear error messages
- [ ] PR context (owner, repo, number) is extracted from event
- [ ] Configuration object is properly typed
- [ ] Unit tests cover validation logic

**Files to Create:**

- `src/config/inputs.ts`
- `src/review/types.ts`

**Files to Modify:**

- None

---
