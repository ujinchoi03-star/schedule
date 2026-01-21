# Schedule Frontend - AI Coding Agent Instructions

## Project Overview
This is a **React 19 + Vite** frontend project with HMR (Hot Module Reload) support. It's a minimal setup template with ESLint configured for React development.

## Architecture & Build System

**Tech Stack:**
- **React 19** (with StrictMode in root) - Entry in [src/main.jsx](../src/main.jsx)
- **Vite 7** - Build tool with React plugin
- **ESLint 9** - Linting with React Hooks and Refresh plugins

**Build Commands:**
- `npm run dev` - Start Vite dev server with HMR (file changes auto-reload)
- `npm run build` - Production build to `dist/` directory
- `npm run lint` - Run ESLint on all JS/JSX files
- `npm run preview` - Preview production build locally

## Key Patterns & Conventions

### Component Structure
- Components are in `src/` directory as `.jsx` files
- Use React hooks (no class components) - see [src/App.jsx](../src/App.jsx) for `useState` example
- Root app entry: [src/App.jsx](../src/App.jsx) → wrapped in StrictMode in [src/main.jsx](../src/main.jsx)

### ESLint Rules (Project-Specific)
- **Unused Variables Rule**: `varsIgnorePattern: '^[A-Z_]'` - ignores capitalized/uppercase names (e.g., `Logo`, `API_KEY`)
- **React Hooks**: Auto-enforced via `reactHooks.configs.flat.recommended`
- **React Refresh**: Required for HMR - avoid breaking Fast Refresh (no export default on local components, use `import.meta.hot` for HMR)

### Styling
- Styles use CSS modules/global CSS in `src/App.css`, `src/index.css`
- Assets imported directly in components (e.g., `import reactLogo from './assets/react.svg'`)

## Critical Developer Workflows

1. **Development**: Run `npm run dev` → open localhost URL → make changes → HMR auto-refreshes
2. **Linting**: `npm run lint` before commits - fixes unused vars, React Hook deps
3. **Production Build**: `npm run build` → outputs optimized build to `dist/`

## Important Notes
- **No TypeScript**: This project uses plain JavaScript/JSX (see `@types` in devDependencies are just for IDE support)
- **React Compiler**: Not enabled (commented in README) - avoid suggesting its use without checking if added
- **dist/ folder**: Ignored by ESLint (see eslint.config.js) and should be in .gitignore

## File Organization
```
src/
  main.jsx          # React root entry point
  App.jsx           # Main application component
  App.css, index.css # Styling
  assets/           # Images and static files
```

When adding features, follow the React hooks patterns and ensure HMR compatibility.
