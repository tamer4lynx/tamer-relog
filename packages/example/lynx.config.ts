import { defineConfig } from '@lynx-js/rspeedy'

import { pluginQRCode } from '@lynx-js/qrcode-rsbuild-plugin'
import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin'
import { pluginTypeCheck } from '@rsbuild/plugin-type-check'
import { pluginTamer } from 'tamer-plugin'
import { tamerRouterPlugin } from 'tamer-router/plugin'

export default defineConfig({
  plugins: [
    pluginTamer(),
    tamerRouterPlugin({
      root: './src/pages',
      output: 'node_modules/.tamer-router/_generated_routes.tsx',
      layoutFilename: '_layout.tsx',
    }),
    pluginQRCode({
      schema(url) {
        return `${url}?fullscreen=true`
      },
    }),
    pluginReactLynx(),
    pluginTypeCheck(),
  ],
})
