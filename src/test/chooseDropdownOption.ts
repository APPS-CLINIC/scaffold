import { act, screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

/** Open the labelled dropdown with its keyboard input, then pick a rendered option. */
export async function chooseDropdownOption(
  user: UserEvent,
  input: HTMLElement,
  optionName: string,
) {
  act(() => input.focus());
  await user.keyboard('{ArrowDown}');
  // PrimeReact measures overlays with layout APIs unavailable in jsdom; its rendered
  // option panel can retain display:none there. Browser stories verify visibility.
  await user.click(await screen.findByRole('option', { name: optionName, hidden: true }));
}
