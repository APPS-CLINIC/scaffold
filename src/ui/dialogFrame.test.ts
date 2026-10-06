import { describe, expect, it } from 'vitest';
import { DIALOG_CONTENT_CLASS_NAME, resolveVisibility } from './dialogFrame';

describe('resolveVisibility', () => {
  it('takes a plain value as it is', () => {
    expect(resolveVisibility(false, true)).toBe(false);
    expect(resolveVisibility(true, false)).toBe(true);
  });

  it('applies an updater to the current visibility', () => {
    expect(resolveVisibility((visible) => !visible, true)).toBe(false);
    expect(resolveVisibility((visible) => !visible, false)).toBe(true);
  });
});

describe('DIALOG_CONTENT_CLASS_NAME', () => {
  it('drops the library padding and keeps the content at its own size', () => {
    expect(DIALOG_CONTENT_CLASS_NAME.split(' ')).toEqual(
      expect.arrayContaining(['!p-0', '!flex-none', 'flex-col']),
    );
  });
});
