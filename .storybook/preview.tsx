import type { Preview } from '@storybook/react-vite';
import { StoryProviders } from '../src/stories/StoryProviders';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import '../src/styles/global.css';

const preview: Preview = {
  tags: ['autodocs'],
  initialGlobals: { locale: 'en' },
  globalTypes: {
    locale: {
      description: 'Interface language',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'en', title: 'English' },
          { value: 'pl', title: 'Polski' },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    layout: 'padded',
    controls: { expanded: true, sort: 'requiredFirst' },
    a11y: { test: 'error' },
    options: {
      storySort: { order: ['Guide', 'Tables', 'Table controls', 'Table feedback', 'Table cells'] },
    },
  },
  decorators: [
    (Story, context) => (
      <StoryProviders
        key={`${context.id}:${context.globals.locale}:${context.parameters.route ?? ''}`}
        locale={context.globals.locale === 'pl' ? 'pl' : 'en'}
        route={context.parameters.route}
        facilitiesScenario={context.parameters.facilitiesScenario}
      >
        <Story />
      </StoryProviders>
    ),
  ],
};

export default preview;
