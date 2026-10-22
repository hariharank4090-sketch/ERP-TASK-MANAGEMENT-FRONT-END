import { useContext } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContextDataProvider, MyContext } from '../../../src/Components/context/contextProvider';

function ConsumerComponent() {
  const context = useContext(MyContext);
  if (!context) return <div>No context</div>;

  return (
    <div>
      <span data-testid="rights">
        Add: {context.contextObj.Add_Rights}, Edit: {context.contextObj.Edit_Rights}, Delete: {context.contextObj.Delete_Rights}
      </span>
      <button
        onClick={() =>
          context.setContextObj({ Add_Rights: 0, Edit_Rights: 0, Delete_Rights: 0 })
        }
      >
        Update Rights
      </button>
    </div>
  );
}

describe('ContextProvider Component', () => {
  it('provides default rights to consumers', () => {
    render(
      <ContextDataProvider>
        <ConsumerComponent />
      </ContextDataProvider>
    );

    expect(screen.getByTestId('rights')).toHaveTextContent('Add: 1, Edit: 1, Delete: 1');
  });

  it('updates rights through setContextObj', async () => {
    const user = userEvent.setup();
    render(
      <ContextDataProvider>
        <ConsumerComponent />
      </ContextDataProvider>
    );

    await user.click(screen.getByText('Update Rights'));
    expect(screen.getByTestId('rights')).toHaveTextContent('Add: 0, Edit: 0, Delete: 0');
  });
});
