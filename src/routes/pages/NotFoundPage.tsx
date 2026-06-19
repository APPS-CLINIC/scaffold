import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section>
      <h1>404</h1>
      <p>This page does not exist.</p>
      <Link to="/items">Go to items</Link>
    </section>
  );
}
