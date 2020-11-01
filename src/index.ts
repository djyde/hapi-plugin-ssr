import * as React from 'react'
import { renderToString } from 'react-dom/server'
import * as webpack from 'webpack'
import * as path from 'path'
import * as WebpackConfig from 'webpack-chain'

import { createElement as hh } from 'react'

type RouteOptions = {
  path: string,
  component: string
}

let compiling = false

const OUTPUT_PATH = '.ssr'

const isDev = process.env.NODE_ENV !== 'production'

const getFileNameFromPath = p => p.replace(/^.*[\\\/]/, '')

const plugins = {

  babel(config: WebpackConfig) {
    // babel and jsx
    config
      .module.rule('babel')
      .test(/\.m?js$/)
      .exclude
      .add(/node_modules/)
      .end()
      .use('babel')
      .loader(require.resolve('babel-loader'))
      .options({
        presets: [
          require.resolve('@babel/preset-env'),
          require.resolve('@babel/preset-react')
        ]
      })
      .end()
  }
}

export default {
  pkg: require('../package.json'),
  register: async function (server, options) {

    const cwd = process.cwd()
    const resolveApp = (...args) => path.resolve(cwd, ...args)

    const routes = options.routes || []

    const clientSideconfig = new WebpackConfig()
    clientSideconfig.mode(isDev ? 'development' : 'production')

    const serverSideConfig = new WebpackConfig()
    serverSideConfig.mode(isDev ? 'development' : 'production')
    serverSideConfig.target('node')
    serverSideConfig.output.libraryTarget('commonjs')
    serverSideConfig.externals([
      'react',
      'react-dom'
    ])


    await server.register(require('@hapi/inert'))
    server.route({
      method: 'GET',
      path: '/static/{param*}',
      handler: {
        directory: {
          path: resolveApp('.one/client')
        }
      }
    })

    routes.forEach((route: RouteOptions) => {

      const fileName = getFileNameFromPath(route.component)

      clientSideconfig
        .entry(fileName)
        .add(route.component)
        .end()

      serverSideConfig
        .entry(fileName)
        .add(route.component)
        .end()

      plugins.babel(clientSideconfig)
      plugins.babel(serverSideConfig)


      server.route({
        method: 'GET',
        path: route.path,
        handler(req, h) {
          delete require.cache[require.resolve(resolveApp(OUTPUT_PATH, 'server', fileName))]
          const reactComponent = require(resolveApp(OUTPUT_PATH, 'server', fileName))
          if (reactComponent) {

            try {
              const element = hh(reactComponent.default)

              const elmentString = renderToString(element)

              const htmlString = `<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
    <body>
      <div id="root">
              ${elmentString}
      </div>

      <script src="/static/${fileName}.js"></script>
    </body>
  </html>
            `
              return htmlString
            } catch (e) {
              console.log(e)
              return `something wrong`
            }
          } else {
            return null
          }
        }
      })
    })

    clientSideconfig.output
      .path(resolveApp(OUTPUT_PATH, 'client'))
    serverSideConfig.output
      .path(resolveApp(OUTPUT_PATH, 'server'))

    const compiler = webpack([
      clientSideconfig.toConfig(),
      serverSideConfig.toConfig()
    ])

    compiler.watch({}, (err, stats) => {
      if (err) {
        console.log(err)
      } else {
        console.log(stats?.toJson())
      }
    })
  }
}
