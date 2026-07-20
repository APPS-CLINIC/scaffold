import { Outlet } from 'react-router-dom';

/**
 * Full-viewport layout for error routes (403/404/catch-all). Deliberately a
 * sibling of RootLayout in the router, so error pages render with no top
 * bar, menu or footer — just a centered card on a full-width/height canvas.
 */
export function ErrorLayout() {
  return (
    <div className="grid min-h-dvh w-full place-items-center bg-surface-muted">
      <Outlet />
    </div>
  );
}
