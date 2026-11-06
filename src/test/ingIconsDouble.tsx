import type { SVGProps } from 'react';

/** Decorative test glyphs; the private corporate icon package is unavailable locally. */
function Glyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M4 4h16v16H4z" />
    </svg>
  );
}

export function Settings(props: SVGProps<SVGSVGElement>) {
  return <Glyph {...props} />;
}
export function Download(props: SVGProps<SVGSVGElement>) {
  return <Glyph {...props} />;
}
export function Refresh(props: SVGProps<SVGSVGElement>) {
  return <Glyph {...props} />;
}
export function Hide(props: SVGProps<SVGSVGElement>) {
  return <Glyph {...props} />;
}
export function Logout(props: SVGProps<SVGSVGElement>) {
  return <Glyph {...props} />;
}
