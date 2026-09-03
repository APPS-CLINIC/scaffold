import { useParams } from 'react-router-dom';

/** Reads the `:id` param below `/customers/:id`; throws if used outside that route. */
export function useCustomerId(): string {
  const { id } = useParams<{ id: string }>();

  if (!id) throw new Error('useCustomerId must be used below the /customers/:id route.');

  return id;
}
