import React from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

export default function HTML({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        
        {/* Link Manifest for PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#E8A7B5" />
        
        {/* PWA iOS support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="GlowPrice" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        
        <ScrollViewStyleReset />
      </head>
      <body>
        {children}
        
        {/* Register Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                const register = () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('Service Worker registered successfully:', reg.scope))
                    .catch(err => console.log('Service Worker registration failed:', err));
                };
                if (document.readyState === 'complete' || document.readyState === 'interactive') {
                  register();
                } else {
                  window.addEventListener('load', register);
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
