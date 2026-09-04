# Last Metro development guidance

- Read `docs/PROGRESS.md` and `docs/ROADMAP.md` before starting a milestone. The two root game-design documents remain the scope baseline.
- Keep the existing `src/game`, `src/world`, `src/audio`, `src/ui`, `src/styles`, `tests`, and `docs` boundaries. Update `docs/ARCHITECTURE.md` for structural decisions.
- The current release is a playable POC. Do not describe it as production ready or imply the later threat/puzzle systems already exist.
- Puzzle progression belongs in pure state transitions. Invalid inputs must preserve required items; loading must reject corrupt or impossible saves and restore a reachable checkpoint.
- Menus and focus loss must suspend simulation, clear held input, release pointer lock, and preserve active story subtitles. Every mandatory clue must have a readable DOM view.
- Run `npm run check` for runtime changes. Use the focused Playwright cases for affected input, collision, progression, or persistence behavior. Record the precise environment and limitations in `docs/QA.md`.
- Keep the test bridge behind `import.meta.env.DEV` and explicit `?test`; never ship direct progression or teleport controls.
- Pin dependencies and commit `package-lock.json`. Keep generated output, browser traces, secrets, and `node_modules` out of Git. Keep the original brief files intact.
- Maintain small conventional commits and update `docs/PROGRESS.md` at each completed milestone, with validation and next work. Keep the working tree clean when handing off a completed milestone.
- Record external assets, licences, subtitles, and triggers in `docs/ASSETS.md` before use. No runtime external AI service is required by this project.
- Add later features against the roadmap acceptance gates. Verify Safari and real-hardware performance before claiming production browser support.
