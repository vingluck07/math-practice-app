import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { lazyPage } from './lazyPage'
import { Suspense } from 'react'

describe('lazyPage', () => {
  it('shows the page once it is loaded, and straight away after preload', async () => {
    const Page = lazyPage(async () => ({ default: () => <p>Loaded page</p> }))
    await Page.preload()
    render(
      <Suspense fallback={<p>Loading</p>}>
        <Page />
      </Suspense>,
    )
    expect(screen.getByText('Loaded page')).toBeInTheDocument()
  })

  it('shows the fallback first when not preloaded', async () => {
    const Page = lazyPage(async () => ({ default: () => <p>Loaded page</p> }))
    render(
      <Suspense fallback={<p>Loading</p>}>
        <Page />
      </Suspense>,
    )
    expect(screen.getByText('Loading')).toBeInTheDocument()
    expect(await screen.findByText('Loaded page')).toBeInTheDocument()
  })
})
