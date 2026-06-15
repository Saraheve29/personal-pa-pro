import React from 'react'
import ReactDOM from 'react-dom/client'

// Show any error on screen so we can debug on mobile
window.onerror = function(msg, src, line, col, err) {
  document.getElementById('root').innerHTML = `
    <div style="padding:20px;font-family:sans-serif;background:#FDF3E3;min-height:100vh">
      <h2 style="color:#F5A623">🐝 BeeWell Error</h2>
      <p style="color:red;font-size:14px"><strong>${msg}</strong></p>
      <p style="color:#666;font-size:12px">Line: ${line}, Col: ${col}</p>
      <p style="color:#666;font-size:12px">File: ${src}</p>
      <pre style="font-size:11px;color:#333;white-space:pre-wrap">${err ? err.stack : ''}</pre>
    </div>
  `;
  return true;
};

window.onunhandledrejection = function(e) {
  document.getElementById('root').innerHTML = `
    <div style="padding:20px;font-family:sans-serif;background:#FDF3E3;min-height:100vh">
      <h2 style="color:#F5A623">🐝 BeeWell Promise Error</h2>
      <p style="color:red;font-size:14px">${e.reason}</p>
      <pre style="font-size:11px;color:#333;white-space:pre-wrap">${e.reason?.stack || ''}</pre>
    </div>
  `;
};

import('./App.jsx').then(({ default: App }) => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}).catch(err => {
  document.getElementById('root').innerHTML = `
    <div style="padding:20px;font-family:sans-serif;background:#FDF3E3;min-height:100vh">
      <h2 style="color:#F5A623">🐝 BeeWell Load Error</h2>
      <p style="color:red;font-size:14px">${err.message}</p>
      <pre style="font-size:11px;color:#333;white-space:pre-wrap">${err.stack}</pre>
    </div>
  `;
});
