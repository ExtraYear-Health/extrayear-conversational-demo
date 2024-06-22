import { NextUIProvider } from '@nextui-org/react';
import type { Preview } from '@storybook/react';
import React from 'react';

import './style.css';

const decorators: Preview['decorators'] = [
  (Story, { globals: { locale } }) => {
    return (
      <NextUIProvider locale={locale}>
        <div>
          <Story />
        </div>
      </NextUIProvider>
    );
  },
];

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators,
};

export default preview;
