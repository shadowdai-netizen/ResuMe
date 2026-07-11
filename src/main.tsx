import React from 'react'
import ReactDOM from 'react-dom/client'
import Prism from 'prismjs'
import './index.css'

const globalScope = globalThis as typeof globalThis & {
  Prism?: typeof Prism
}

globalScope.Prism = Prism

import('./App').then(({ default: App }) => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})
