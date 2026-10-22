import { describe, it, expect, vi } from 'vitest';
import MainMenuList from '../../src/Layout/mainMenu';
import { renderWithProviders } from '../../src/test/test-utils';

describe('MainMenuList Component', () => {
  it('renders menu container without errors', () => {
    const { container } = renderWithProviders(
      <MainMenuList loading={false} loadingOn={vi.fn()} loadingOff={vi.fn()} />
    );
    expect(container).toBeInTheDocument();
  });
});
