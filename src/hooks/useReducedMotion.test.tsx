import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion } from '../test/mediaHelpers'
import { useReducedMotion } from './useReducedMotion'

afterEach(() => vi.unstubAllGlobals())

describe('useReducedMotion', () => {
  it('is false when the browser cannot tell', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(renderHook(() => useReducedMotion()).result.current).toBe(false)
  })

  it('reports the current preference', () => {
    mockReducedMotion(true)
    expect(renderHook(() => useReducedMotion()).result.current).toBe(true)
  })

  it('follows a change made while the app is open', () => {
    const device = mockReducedMotion(false)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
    act(() => device.set(true))
    expect(result.current).toBe(true)
  })
})
