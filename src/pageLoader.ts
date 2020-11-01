export default function (source: string) {
  return `
    import { hydrate } from 'react-dom'
    import { createElement as h } from 'react'
    ${source}
    const App = __WEBPACK_DEFAULT_EXPORT__

    hydrate(h(App), document.querySelector('#root'))
    `
}