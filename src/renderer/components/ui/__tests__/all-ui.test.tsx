import { render } from '@testing-library/react'
import { Button } from '../button'
import { Input } from '../input'
import { Card, CardContent, CardHeader, CardTitle } from '../card'
import { Label } from '../label'
import { Switch } from '../switch'
import { describe, it, expect } from 'vitest'

describe('UI components', () => {
  it('Button renders', () => {
    const { container } = render(<Button>Click</Button>)
    expect(container.querySelector('button')).toBeTruthy()
  })

  it('Button renders with variant', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>)
    const btn = container.querySelector('button')
    expect(btn).toBeTruthy()
  })

  it('Input renders', () => {
    const { container } = render(<Input placeholder="type here" />)
    expect(container.querySelector('input')).toBeTruthy()
  })

  it('Card renders with header and content', () => {
    const { container } = render(
      <Card>
        <CardHeader><CardTitle>T</CardTitle></CardHeader>
        <CardContent>C</CardContent>
      </Card>
    )
    expect(container.querySelector('h3')).toBeTruthy()
  })

  it('Label renders', () => {
    const { container } = render(<Label>L</Label>)
    expect(container.querySelector('label')).toBeTruthy()
  })

  it('Switch renders', () => {
    const { container } = render(<Switch />)
    expect(container.querySelector('[role="switch"]')).toBeTruthy()
  })
})
