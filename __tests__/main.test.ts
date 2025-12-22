/**
 * Unit tests for the action's main functionality, src/main.ts
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'

jest.unstable_mockModule('@actions/core', () => core)

const { run } = await import('../src/main.js')

describe('main.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GITHUB_EVENT_NAME = 'pull_request'
    process.env.GITHUB_REPOSITORY = 'test-owner/test-repo'
  })

  afterEach(() => {
    jest.resetAllMocks()
    delete process.env.GITHUB_EVENT_NAME
    delete process.env.GITHUB_REPOSITORY
  })

  it('fails when required inputs are missing', async () => {
    core.getInput.mockImplementation((name: string) => {
      if (name === 'opencode_api_key') {
        return ''
      }
      if (name === 'github_token') {
        return 'test-token'
      }
      return ''
    })

    await run()

    expect(core.setFailed).toHaveBeenCalled()
  })

  it('fails when PR number cannot be determined', async () => {
    delete process.env.GITHUB_EVENT_NAME

    core.getInput.mockImplementation((name: string) => {
      if (name === 'opencode_api_key') {
        return 'test-api-key'
      }
      if (name === 'github_token') {
        return 'test-token'
      }
      if (name === 'model') {
        return 'test-model'
      }
      return ''
    })

    await run()

    expect(core.setFailed).toHaveBeenCalled()
  })
})
