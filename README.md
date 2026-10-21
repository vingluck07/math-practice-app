# Math Practice App

Browser-based arithmetic flashcards for children ages 7–12, built with React, TypeScript and Vite.

## Getting started

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

## Scripts

| Script               | Purpose                             |
| -------------------- | ----------------------------------- |
| `npm run dev`        | Start the development server        |
| `npm run build`      | Type-check and build for production |
| `npm run lint`       | Run ESLint                          |
| `npm run format`     | Format code with Prettier           |
| `npm run test`       | Run tests once with Vitest          |
| `npm run test:watch` | Run tests in watch mode             |
| `npm run verify`     | Lint, format check, tests and build |

## Privacy

The app collects no personal information, has no accounts, tracking or ads, and makes no network requests after it loads. Settings and practice history are saved only in the browser's local storage on the student's device. Clearing browser data removes them.

## Deploying (Netlify)

`netlify.toml` already contains the build command (`npm run build`), the publish folder (`dist`), the redirect that lets React Router handle every address, and security headers.

1. Push the project to GitHub.
2. In Netlify choose **Add new site → Import an existing project**, pick the GitHub repository, and accept the detected settings.
3. After the first deploy, open the site address and check each page (`/`, `/practice/setup`, `/statistics`, `/settings`), refresh on each one, and look at the browser console for errors.

Other hosts need the same "send every address to `index.html`" rule.
