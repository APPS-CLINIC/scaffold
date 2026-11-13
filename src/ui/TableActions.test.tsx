import { createRef, useState } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { renderWithProviders } from '@/test/renderWithProviders';
import { TableActions } from './TableActions';

beforeEach(async () => {
  await i18n.changeLanguage('en');
});
function ControlledActions() {
  const [keys, setKeys] = useState<readonly string[]>(['root']);
  return (
    <>
      <TableActions
        expandableKeys={['root', 'hidden-branch']}
        expandedKeys={keys}
        onExpandedKeysChange={setKeys}
      />
      <output aria-label="Expanded keys">{keys.join(',')}</output>
    </>
  );
}

describe('TableActions', () => {
  it('allows a lazy owner to report that expanded known keys are not yet the complete hierarchy', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <TableActions
        expandableKeys={['root']}
        expandedKeys={['root']}
        allExpanded={false}
        onExpandedKeysChange={onChange}
      />,
    );
    const toggle = screen.getByRole('switch', { name: 'Expand all' });
    expect(toggle).not.toBeChecked();
    await user.click(toggle);
    expect(onChange).toHaveBeenCalledWith(['root']);
  });
  it('expands exactly the owner-supplied branches and then collapses all', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ControlledActions />);
    const toggle = screen.getByRole('switch', { name: 'Expand all' });
    expect(toggle).not.toBeChecked();
    await user.click(toggle);
    expect(toggle).toBeChecked();
    expect(screen.getByRole('status', { name: 'Expanded keys' })).toHaveTextContent(
      'root,hidden-branch',
    );
    await user.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(screen.getByRole('status', { name: 'Expanded keys' })).toBeEmptyDOMElement();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('disables expansion for no branches and exposes optional actions with custom export text', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    const onOpenSettings = vi.fn();
    renderWithProviders(
      <TableActions
        expandableKeys={[]}
        expandedKeys={[]}
        onExpandedKeysChange={vi.fn()}
        onExport={onExport}
        exportLabel="Download example JSON"
        onOpenSettings={onOpenSettings}
      />,
    );
    expect(screen.getByRole('switch')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Download example JSON' }));
    await user.click(screen.getByRole('button', { name: 'List settings' }));
    expect(onExport).toHaveBeenCalledOnce();
    expect(onOpenSettings).toHaveBeenCalledOnce();
  });

  it('forwards its ref and HTML attributes and merges caller classes last', () => {
    const ref = createRef<HTMLDivElement>();
    renderWithProviders(
      <TableActions
        ref={ref}
        aria-label="List actions"
        className="gap-1 justify-start"
        expandableKeys={[]}
        expandedKeys={[]}
        onExpandedKeysChange={vi.fn()}
      />,
    );
    expect(ref.current).toHaveAttribute('aria-label', 'List actions');
    expect(ref.current).toHaveClass('gap-1', 'justify-start');
    expect(ref.current).not.toHaveClass('gap-4', 'justify-end');
  });
});
