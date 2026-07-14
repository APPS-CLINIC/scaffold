import { ErrorPage } from './ErrorPage';

export function NotFoundPage() {
  return <ErrorPage code={404} messageKey="error.notFound" />;
}
