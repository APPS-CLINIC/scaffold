import type { Meta, StoryObj } from '@storybook/react-vite';

function Guide() {
  return (
    <article className="max-w-3xl space-y-5 leading-relaxed">
      <h1 className="text-3xl font-bold">Tables and list controls</h1>
      <p>
        This catalogue renders the application’s existing components. Each story owns its store,
        in-memory URL, cache and translations. Change the language from the toolbar; browser
        preferences are not persisted.
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          <strong>GenericDataTable:</strong> controlled paging, sort, responsive details, loading,
          empty/error states and a composed toolbar.
        </li>
        <li>
          <strong>TreeDataTable:</strong> shared configured fields with independent hierarchy
          expansion.
        </li>
        <li>
          <strong>Facilities:</strong> flat DTO pages with hasChildren, asynchronous children,
          retry, cancellation, deep search and large sibling pages. All and Lending both start lazy.
        </li>
        <li>
          <strong>Table controls:</strong> search, filters, date windows, actions, responsive
          toolbar and column settings.
        </li>
        <li>
          <strong>Feedback and cells:</strong> skeletons, spinner, interactive information and the
          common cell renderers.
        </li>
      </ul>
      <p>
        Facilities scenarios use the same RTK Query owner and asynchronous transport as the
        development route. They are simulations of a proposed data contract. Large catalogues
        demonstrate bounded pages and are not production performance measurements.
      </p>
      <p>
        Use Canvas for interaction, Docs for the component contract and Controls for supported
        arguments. Stories with a play function also exercise their behavior through the browser
        test runner.
      </p>
      <p>
        The catalogue imports the real IWA packages. An environment without those dependencies
        cannot validate their appearance or build the complete catalogue. Unit tests use the
        repository’s test-only doubles and do not establish visual correctness.
      </p>
    </article>
  );
}
const meta = {
  title: 'Guide/Start here',
  component: Guide,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof Guide>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {};
