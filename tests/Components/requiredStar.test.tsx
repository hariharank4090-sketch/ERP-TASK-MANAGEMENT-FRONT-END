import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RequiredStar from '../../src/Components/requiredStar';

describe('RequiredStar Component', () => {
  it('renders a red asterisk indicator', () => {
    render(<RequiredStar />);
    const star = screen.getByText('*');
    expect(star).toBeInTheDocument();
    expect(star).toHaveStyle({ color: 'rgb(255, 0, 0)' });
  });
});
