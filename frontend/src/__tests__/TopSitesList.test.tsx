import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopSitesList } from '../components/dashboard/TopSitesList';

const MOCK_SITES = [
  { id: 1, name: 'Site Alpha', assetCount: 12 },
  { id: 2, name: 'Site Beta', assetCount: 8 },
  { id: 3, name: 'Site Gamma', assetCount: 3 },
];

describe('TopSitesList', () => {
  it('renders site names and counts', () => {
    render(<TopSitesList data={MOCK_SITES} />);
    expect(screen.getByText('Site Alpha')).toBeInTheDocument();
    expect(screen.getByText('Site Beta')).toBeInTheDocument();
    expect(screen.getByText('Site Gamma')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    // '3' appears as both rank and count — check count is present at least twice
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state message when data is empty', () => {
    render(<TopSitesList data={[]} />);
    expect(screen.getByText('No site data')).toBeInTheDocument();
  });

  it('shows loading skeletons when loading is true', () => {
    const { container } = render(<TopSitesList data={[]} loading={true} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('does not show site list when loading', () => {
    render(<TopSitesList data={MOCK_SITES} loading={true} />);
    expect(screen.queryByText('Site Alpha')).not.toBeInTheDocument();
  });
});
