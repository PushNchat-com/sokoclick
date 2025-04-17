import React from 'react';
import { render, screen } from '@testing-library/react';
import Badge from './Badge';

describe('Badge component', () => {
  it('renders with the default variant', () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText('Default Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('renders with the success variant', () => {
    render(<Badge color="success">Success Badge</Badge>);
    const badge = screen.getByText('Success Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('renders with the warning variant', () => {
    render(<Badge color="warning">Warning Badge</Badge>);
    const badge = screen.getByText('Warning Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('renders with the danger variant', () => {
    render(<Badge color="danger">Danger Badge</Badge>);
    const badge = screen.getByText('Danger Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('applies custom class names', () => {
    render(<Badge className="custom-class">Custom Badge</Badge>);
    const badge = screen.getByText('Custom Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('custom-class');
  });

  it('renders with different sizes', () => {
    render(<Badge size="sm">Small Badge</Badge>);
    const smallBadge = screen.getByText('Small Badge');
    expect(smallBadge).toBeInTheDocument();
    expect(smallBadge).toHaveClass('text-xs', 'px-2', 'py-0.5');

    render(<Badge size="lg">Large Badge</Badge>);
    const largeBadge = screen.getByText('Large Badge');
    expect(largeBadge).toBeInTheDocument();
    expect(largeBadge).toHaveClass('text-base', 'px-3', 'py-1');
  });
}); 