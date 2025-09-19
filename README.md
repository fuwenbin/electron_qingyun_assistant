# Vue3 Electron App

A Vue 3 + Electron application built with Vite.

## Features

- Vue 3 with Composition API
- TypeScript support
- Vue Router for navigation
- Pinia for state management
- Electron for desktop application

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run electron:dev
```

### Compile and Minify for Production

```sh
npm run electron:build
```

### Preview Production Build

```sh
npm run electron:preview
```

## Project Structure

- `src/` - Vue application source code
- `electron/` - Electron main process and preload scripts
- `public/` - Static assets
- `dist/` - Built Vue application
- `dist_electron/` - Built Electron application 