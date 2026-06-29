import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from '../components/Sidebar';

const queryClient = new QueryClient();

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Sidebar', () => {
  it('renders all nav links', () => {
    render(<Sidebar />, { wrapper: Wrapper });
    expect(screen.getByText('Map')).toBeDefined();
    expect(screen.getByText('Dashboard')).toBeDefined();
    expect(screen.getByText('Assets')).toBeDefined();
    expect(screen.getByText('Asset Types')).toBeDefined();
    expect(screen.getByText('Incidents')).toBeDefined();
  });
});
