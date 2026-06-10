import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
      },
      {
        title: 'Piano Coach — Learn Piano with Interactive Exercises',
      },
      {
        name: 'description',
        content: 'A playful, interactive piano practice app for beginners. Learn notes, read staff, play chords, and train your ear — connect your MIDI piano or use your keyboard.',
      },
      {
        name: 'theme-color',
        content: '#FAF8F5',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="overscroll-none">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
