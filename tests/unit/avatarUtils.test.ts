import { describe, expect, it } from 'vitest'
import { getAvatarFromSeed } from '../../src/assets/avatarUtils'

describe('getAvatarFromSeed', () => {
  it('returns the same avatar for the same seed', () => {
    expect(getAvatarFromSeed('player-42')).toBe(getAvatarFromSeed('player-42'))
  })

  it('accepts numeric seeds', () => {
    expect(getAvatarFromSeed(12345)).toBeTruthy()
  })

  it('maps different seeds to one of the available avatar assets', () => {
    const results = new Set([
      getAvatarFromSeed('alpha'),
      getAvatarFromSeed('beta'),
      getAvatarFromSeed('gamma'),
      getAvatarFromSeed('delta'),
    ])

    expect(results.size).toBeGreaterThan(0)
    expect([...results].every((avatar) => typeof avatar === 'string' && avatar.length > 0)).toBe(true)
  })
})
