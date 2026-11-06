import { vi } from 'vitest';

/**
 * jsdom gives every element a null offsetParent. PrimeReact consequently measures an
 * open overlay as hidden and leaves display:none on it. Model the visible layout parent.
 */
export function mockOverlayLayout() {
  vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockReturnValue(document.body);
}
