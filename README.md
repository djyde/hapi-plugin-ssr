# hapi-plugin-ssr

[WIP] React Server-side rendering plugin for Hapi.

## Usage

```bash
- pages
  - home.js
- server.js
```

```js
// server.js

const hapi = require('@hapi/hapi')

const server = Hapi.server({
    port: 3000
  })

await server.register({
  plugin: require('hapi-plugin-ssr').default,
  options: {
    routes: [{
      path: '/',
      component: './pages/home'
    }]
  }
})

await server.start()
```

```js
// pages/home.js

import React from 'react'

export default () => {

  const [count, setCount] = React.useState(0)

  return (
    <div>
      {count}
      <button onClick={_ => setCount(count => count+1)}>+</button>
      <button onClick={_ => setCount(count => count-1)}> - </button>

    </div>
  )
}
```

```bash
node server.js # http://localhost:3000
```

# License

MIT License