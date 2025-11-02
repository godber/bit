# Claude Code Preferences

## Development Server

**Do not start the dev server automatically.** The user prefers to run `bun run dev` manually for easy access to logs and console output. You can check the server status and read error messages when needed, but do not use `Bash` to start or restart the dev server.

## Working with the Codebase

This project uses:
- **Bun** as the runtime and package manager
- **Vite** for development and build tooling
- **React 19** with **React Three Fiber** for 3D graphics
- **Leva** for debug UI controls

When making changes that affect the running application, the dev server will hot-reload automatically if it's already running.

See also AGENTS.md for additional agent-specific preferences.
