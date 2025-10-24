# Repository Guidelines

## Project Structure & Module Organization
The repository now follows a Vite layout. `index.html` remains at the project root and bootstraps the module graph. Runtime code lives in `src/main.js`, which creates the Three.js scene, manages the idle/yes/no groups, and wires the press-hold buttons. Add any new modules under `src/` and rely on ES module imports (`import { ... } from './foo.js'`). Static assets can be referenced from `public/` (create as needed) for pass-through serving.

## Build, Test, and Development Commands
Install dependencies with `bun install`. During development run `bun run dev` to start Vite’s dev server (default http://localhost:5173 with hot reloading). Use `bun run build` to emit a production bundle in `dist/`, and `bun run preview` to serve that bundle locally. These scripts proxy directly to Vite, so Bun handles package resolution and script execution.

## Coding Style & Naming Conventions
Stick with modern ES features and two-space indentation. Prefer `const` for immutable bindings and `let` only when reassignment is required; avoid `var`. Keep configuration objects (colors, transition timing, seeds) near the top of `src/main.js` so tweaking values is straightforward. Name helpers by intent (`makeNestedGroup`, `pressHold`) and limit inline comments to clarifying non-obvious math or animation behavior.

## Testing Guidelines
No automated suite exists yet. After `bun run dev`, validate manually in desktop and mobile browsers: confirm the idle state renders, YES/NO press-and-hold transitions cross-fade smoothly, and focus loss returns the bit to idle. When introducing new interactions or geometry, document manual test steps and browsers covered in your PR description.

## Commit & Pull Request Guidelines
The Git history favors concise subjects (e.g., `bit4`). Keep commit messages imperative and scoped to one logical change (`swap three CDN for npm module`). For PRs include: a short behavior summary, screenshots or clips for visual updates, linked issues when relevant, and explicit test notes. Flag larger animation or architecture changes so reviewers know where to focus.

## Dependency & Deployment Notes
Three.js comes from the npm package declared in `package.json`; update its version thoughtfully and verify against browser targets before merging. Production output lives in `dist/` after `bun run build`. Deploy by serving the generated static assets and ensure the hosting environment allows module scripts produced by Vite.
