import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KpiCard } from '../components/dashboard/KpiCard';

describe('KpiCard', () => {
  it('renders label and value', () => {
    render(<KpiCard label="Total Assets" value={97} />);
    expect(screen.getByText('Total Assets')).toBeInTheDocument();
    expect(screen.getByText('97')).toBeInTheDocument();
  });

  it('shows skeleton when value is undefined', () => {
    const { container } = render(<KpiCard label="Loading" value={undefined} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders sub text when provided', () => {
    render(<KpiCard label="Fiber" value={79.6} sub="km" />);
    expect(screen.getByText('km')).toBeInTheDocument();
  });

  it('does not render sub text when not provided', () => {
    render(<KpiCard label="Count" value={10} />);
    expect(screen.queryByText('km')).not.toBeInTheDocument();
  });
});
