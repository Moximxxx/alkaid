import { render } from '@testing-library/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs'
import { Avatar, AvatarImage, AvatarFallback } from '../avatar'
import { describe, it } from 'vitest'

describe('Remaining UI', () => {
  it('Dialog renders', () => {
    render(<Dialog open={true}><DialogContent><DialogHeader><DialogTitle>Test</DialogTitle></DialogHeader></DialogContent></Dialog>)
  })
  it('Tabs renders', () => {
    render(<Tabs value="a" onValueChange={() => {}}><TabsList><TabsTrigger value="a">A</TabsTrigger></TabsList><TabsContent value="a">Content</TabsContent></Tabs>)
  })
  it('Avatar renders', () => {
    render(<Avatar><AvatarImage src="test.jpg" /><AvatarFallback>AB</AvatarFallback></Avatar>)
  })
})
