import { ErrorPage } from './ErrorPage';

export function ForbiddenPage() {
  return <ErrorPage code={403} messageKey="error.forbidden" />;
}
