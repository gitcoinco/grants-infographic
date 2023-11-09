import type { WebpackConfigContext } from "next/dist/server/config-shared";
import Webpack from "webpack";


/**
 * Next.js did not define any types for its Webpack configs.
 *
 * @see https://github.com/vercel/next.js/blob/canary/packages/next/compiled/webpack/webpack.d.ts
 * @see https://github.com/vercel/next.js/blob/60c8e5c29e4da99ac1aa458b1ba3bdf829111115/packages/next/server/config-shared.ts#L67
 */
export interface WebpackContext extends WebpackConfigContext {
  webpack: typeof Webpack
}

/**
 * Handles the Webpack configuration.
 *
* @param config - The Webpack configuration options.
 * @param context - The Webpack context
 *
 * @returns A Webpack configuration object.
 */
export function webpackConfigurationHandler(
  config: Webpack.Configuration,
  context: WebpackContext
): Webpack.Configuration {
  /**
   * Add support for the `node:` scheme available since Node.js 16.
   *
   * @see https://github.com/vercel/next.js/issues/28774
   */
  config.plugins = config.plugins ?? []
  config.plugins.push(
    new context.webpack.NormalModuleReplacementPlugin(/^node:/, (resource: { request: string }) => {
      resource.request = resource.request.replace(/^node:/, '')
    })
  )

  return config
}