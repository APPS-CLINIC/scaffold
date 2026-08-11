import { act } from '@testing-library/react';
import { vi } from 'vitest';

const observerCallbacks = new Set<ResizeObserverCallback>();
let containerWidth = 0;

class TableTestResizeObserver implements ResizeObserver {
  private readonly callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    observerCallbacks.add(callback);
  }

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {
    observerCallbacks.delete(this.callback);
  }
}

/**
 * jsdom has no layout, so the responsive column engine would otherwise
 * measure 0 and keep every optional field in the accordion. Call before
 * rendering to give the table container a concrete width. The spy is
 * restored automatically (`restoreMocks`), the observer stub is inert
 * between tests.
 */
export function mockTableContainerWidth(width: number): void {
  containerWidth = width;
  observerCallbacks.clear();
  vi.stubGlobal('ResizeObserver', TableTestResizeObserver);
  vi.spyOn(HTMLDivElement.prototype, 'getBoundingClientRect').mockImplementation(
    function getBoundingClientRect(): DOMRect {
      return {
        width: containerWidth,
        height: 0,
        top: 0,
        right: containerWidth,
        bottom: 0,
        left: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect;
    },
  );
}

/** Simulate a container resize and flush the ResizeObserver callbacks. */
export function resizeTableContainer(width: number): void {
  containerWidth = width;
  act(() => {
    for (const callback of observerCallbacks) {
      callback([], undefined as unknown as ResizeObserver);
    }
  });
}
