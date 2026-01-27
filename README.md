# should-i-stay-or-should-i-go

A modern web app to help you decide: should you stay or should you go? This is the frontend for the project, built with React and Tailwind CSS, and connects to a Cloudflare Worker KV backend.

## Tech Stack
- React
- Vite
- Tailwind CSS
- JavaScript (ES6+)

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Install dependencies

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173) by default.

### Build

To build for production:

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

See `src/App.jsx` for the main app component and `vite.config.js` for build configuration.# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
