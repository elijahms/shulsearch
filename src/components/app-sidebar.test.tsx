import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'

describe('AppSidebar', () => {
  it('renders the brand and primary nav items', () => {
    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>,
    )
    expect(screen.getByText('ShulSearch')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /search/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /contribute/i })).toBeInTheDocument()
  })
})
