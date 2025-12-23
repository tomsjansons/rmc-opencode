import { OPENROUTER_API_URL } from '../config/constants.js'
import { logger } from '../utils/logger.js'

const THINKING_PATTERNS = [
  /\bwait\b/i,
  /\bactually\b/i,
  /\bcorrection:/i,
  /\bon second thought\b/i,
  /\blet me (?:think|check|see|reconsider)\b/i,
  /\bhmm\b/i,
  /\bi think\b/i,
  /\bmaybe\b/i,
  /\bperhaps\b/i,
  /\bi(?:'m| am) not sure\b/i,
  /\bi need to\b/i,
  /\bhold on\b/i,
  /\bnevermind\b/i,
  /\bignore (?:that|this|the above)\b/i,
  /\bsorry,? (?:i|let me)\b/i,
  /\bno,? wait\b/i,
  /\.{3,}\s*(?:wait|actually|hmm)/i,
  /\((?:thinking|checking|wait)\)/i
]

const INCOMPLETE_PATTERNS = [
  /\.\.\.\s*$/,
  /\bso\s*$/i,
  /\bbut\s*$/i,
  /\band\s*$/i,
  /\bwhich means\s*$/i,
  /:\s*$/
]

const SELF_CORRECTION_PATTERNS = [
  /\bcorrection\b/i,
  /\bstrike that\b/i,
  /\bscratch that\b/i,
  /\bi was wrong\b/i,
  /\bi misspoke\b/i,
  /\bthat's not right\b/i,
  /\blet me rephrase\b/i,
  /\bto clarify what i meant\b/i
]

export type CommentValidationResult = {
  isValid: boolean
  suspectedThinking: boolean
  confirmedThinking: boolean
  reason?: string
  patterns?: string[]
}

export function detectSuspectedThinking(commentBody: string): {
  suspected: boolean
  matchedPatterns: string[]
} {
  const matchedPatterns: string[] = []

  for (const pattern of THINKING_PATTERNS) {
    if (pattern.test(commentBody)) {
      matchedPatterns.push(`thinking: ${pattern.source}`)
    }
  }

  for (const pattern of INCOMPLETE_PATTERNS) {
    if (pattern.test(commentBody)) {
      matchedPatterns.push(`incomplete: ${pattern.source}`)
    }
  }

  for (const pattern of SELF_CORRECTION_PATTERNS) {
    if (pattern.test(commentBody)) {
      matchedPatterns.push(`self-correction: ${pattern.source}`)
    }
  }

  return {
    suspected: matchedPatterns.length > 0,
    matchedPatterns
  }
}

export async function verifyThinkingContent(
  commentBody: string,
  apiKey: string,
  model: string
): Promise<boolean> {
  const prompt = `You are a quality assurance checker for code review comments. Your task is to determine if a comment contains internal "thinking" or reasoning that should not be published.

A comment contains problematic "thinking" if it includes:
- Self-corrections mid-thought (e.g., "wait...", "actually...", "Correction:")
- Uncertainty or hedging (e.g., "I think...", "maybe...", "perhaps...")
- Incomplete reasoning (e.g., trailing thoughts, unfinished sentences)
- Meta-commentary about the analysis process
- Internal dialogue or questions to self
- Draft notes that weren't cleaned up

A comment is CLEAN if it:
- Is complete and self-contained
- Uses confident, professional language
- Is ready to be read by a developer without confusion
- May include hedging words in APPROPRIATE context (e.g., "You might want to consider..." is fine)

Comment to analyze:
"""
${commentBody.replace(/"""/g, '\\"\\"\\"')}
"""

Does this comment contain problematic internal "thinking" that should not be published?

Respond with ONLY "yes" or "no".`

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/opencode-pr-reviewer',
        'X-Title': 'OpenCode PR Reviewer - Comment Validator'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 10
      })
    })

    if (!response.ok) {
      logger.warning(
        `Comment validation API call failed: ${response.status}, allowing comment`
      )
      return false
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }

    const content = data.choices?.[0]?.message?.content?.trim().toLowerCase()

    if (content === 'yes') {
      return true
    }

    return false
  } catch (error) {
    logger.warning(
      `Comment validation failed with error: ${error}, allowing comment`
    )
    return false
  }
}

export async function validateComment(
  commentBody: string,
  apiKey: string,
  model: string
): Promise<CommentValidationResult> {
  const { suspected, matchedPatterns } = detectSuspectedThinking(commentBody)

  if (!suspected) {
    return {
      isValid: true,
      suspectedThinking: false,
      confirmedThinking: false
    }
  }

  logger.debug(
    `Comment flagged for potential thinking content. Patterns: ${matchedPatterns.join(', ')}`
  )

  const confirmed = await verifyThinkingContent(commentBody, apiKey, model)

  if (confirmed) {
    return {
      isValid: false,
      suspectedThinking: true,
      confirmedThinking: true,
      reason:
        'Comment contains internal thinking/reasoning that should not be published. Please rephrase as a clear, professional review comment.',
      patterns: matchedPatterns
    }
  }

  return {
    isValid: true,
    suspectedThinking: true,
    confirmedThinking: false,
    patterns: matchedPatterns
  }
}
