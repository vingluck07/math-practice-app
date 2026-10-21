import { createElement, lazy, type ComponentType } from 'react'

/**
 * A page that is downloaded only when first visited. Once loaded it renders
 * straight away (no loading flash on later visits), and `preload()` lets the app
 * fetch it ahead of time.
 */
export function lazyPage(load: () => Promise<{ default: ComponentType }>) {
  let loaded: ComponentType | null = null
  const remember = (module: { default: ComponentType }) => {
    loaded = module.default
    return module
  }
  const Lazy = lazy(() => load().then(remember))

  function Page() {
    return loaded ? createElement(loaded) : createElement(Lazy)
  }
  Page.preload = () => load().then(remember)
  return Page
}
