import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'web-components',
  taskQueue: 'async',
  sourceMap: true,

  extras: {
    experimentalImportInjection: true,
  },
};
