import { describe, it, expect, beforeAll, vi } from 'vitest'

describe('main entry', () => {
  beforeAll(() => {
    // main.tsx 会立即调用 createRoot(document.getElementById('root')!)
    const root = document.createElement('div')
    root.id = 'root'
    document.body.appendChild(root)

    // mock matchMedia 因为 App 中的 useTheme hook 会调用它
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('can be imported', async () => {
    const mod = await import('../main')
    expect(mod).toBeDefined()
  })
})
