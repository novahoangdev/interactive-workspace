# interactive-workspace

An interactive 3D workspace showcasing my desk setup, profile, projects, and professional journey. Explore the desk, open the CV, or drive the kart around the circuit.

## Tech stack
- React 19 + TypeScript
- Three.js (procedural models, no external 3D assets)
- Tailwind CSS v4
- Vite
- Web Audio API for sound effects and music

## Getting started
### Requirements
- [Bun](https://bun.sh)

### Install
```bash
bun install
```

### Development
```bash
bun run dev      # http://localhost:3000
```

## Commands
| Purpose | Command |
|---|---|
| Dev | `bun run dev` |
| Type check | `bun run lint` |
| Build | `bun run build` |
| Preview build | `bun run preview` |

## Project structure
```text
public/            static images, favicon, web manifest
src/
  components/      React overlays: HUD, CV modal, project modal, controls
  data/cvData.ts   profile and CV content
  three/           Three.js scene: workstation, circuit, kart, prop physics
  utils/           Web Audio sound manager
```

## Content
Profile and CV content lives in `src/data/cvData.ts` and must stay in sync with `PROFILE.md` in the [portfolio repo](https://github.com/novahoangdev/portfolio). The "Download PDF" button links to the reviewed CV PDFs published on novahoangdev.web.app.

## Documentation
- `AGENTS.md` — project agent rules
- `DECISIONS.md` — durable decisions
- `docs/architecture.md` — architecture
- `docs/design-system.md` — UI conventions
