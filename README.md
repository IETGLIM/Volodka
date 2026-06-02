# Volodka RPG

Volodka RPG is a narrative-first 3D browser game built with Next.js, React Three Fiber, and Zustand.
The project combines exploration, dialogue branches, combat systems, and mini-games in a single web experience.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Three.js + React Three Fiber + Drei
- Zustand state management
- Tailwind CSS

## Quick Start

### 1) Install dependencies

```bash
npm install
```

### 2) Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` - start local dev server on port 3000
- `npm run build` - build production bundle
- `npm run start` - run production server
- `npm run lint` - run ESLint checks

## Project Structure

- `src/app` - Next.js app entrypoints and global layout
- `src/components/3d` - 3D scene and rendering components
- `src/components/game` - gameplay UI and orchestration panels
- `src/engine` - combat, audio, quest, and runtime systems
- `src/store` - Zustand store and slices
- `src/data` - static game data, nodes, quests, configs
- `public/models-external` - external GLB assets

## Notes

- The game relies on WebGL-capable browsers for full functionality.
- Large 3D assets are loaded from `public/models-external`.
- Runtime behavior depends heavily on Zustand store orchestration and game engine modules.
