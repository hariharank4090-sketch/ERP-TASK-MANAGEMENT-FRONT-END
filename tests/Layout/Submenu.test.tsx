import { describe, it, expect, vi } from 'vitest';
import { MenuGroupPage } from '../../src/Layout/Submenu';
import { renderWithProviders } from '../../src/test/test-utils';

describe('MenuGroupPage (Submenu) Component', () => {
  it('renders submenu container without crashing', () => {
    const { container } = renderWithProviders(
      <MenuGroupPage loading={false} loadingOn={vi.fn()} loadingOff={vi.fn()} />
    );
    expect(container).toBeInTheDocument();
  });
});
