# Contributing

SH TechniekLab extends the original FluidLab application. The project keeps a small number of
rules so the models and educational controls remain understandable. Please read them before opening a pull request — most review comments here are
one of these five.

## The five rules

**1. No dependencies.** Not a runtime one, not a dev one, not a test framework. This is
enforced in CI: the build fails on a `node_modules` directory or on any bare import specifier
outside `node:`. If a task seems to need a library, the task is probably wrong for this
codebase.

**2. Physics must emerge, not be scripted.** A behaviour is correct when it falls out of the
solver, not when a special case produces the expected picture. If you find yourself writing
`if (component.type === …)` inside the engine, stop — the fix belongs in the component's
physics, not in the solver.

**3. A new component is one catalog entry.** Symbol, ports, physics, faults, in the relevant
`src/catalog*.js`. If a component needs an engine change or an inspector change, the contract
is leaking and that is the bug to fix first. The interface is documented at the top of
`catalog.js`.

**4. Tests assert behaviour, not structure.** A test that checks a throttle object exists
proves nothing. Build a circuit, run it, and assert the physical consequence — stroke time,
back pressure, convergence count. Write it so it *can* fail; if it passes on the first run
without you having fixed anything, be suspicious of it.

**5. State limits honestly.** [docs/LIMITATIONS.md](docs/LIMITATIONS.md) exists so that nobody
trusts a result the model cannot support. If your change adds a modelling boundary, add the
line. If it removes one, delete the line — a stale limitation undersells the work as badly as
a missing one oversells it.

## Before you open a PR

```bash
npm test        # 90 tests, 4 suites — must be green
```

CI runs the same gate on Node 18, 20 and 22, plus the dependency check. `main` is protected:
it requires a green gate and does not accept force pushes.

There is no linter and no formatter config. Match the surrounding style — the codebase is
consistent enough that "looks like the file it is in" is an unambiguous instruction.

## Commit messages

Explain *why*, not *what* — the diff already says what. The existing history is the reference:
a subject line naming the change, then the reasoning, including what was tried and rejected.
If a commit fixes something the tests did not catch, say why they did not catch it.

## Reporting a modelling error

The most valuable issue for this project is "the simulator says X, real hardware does Y".
Please include the circuit (export it as JSON), the numbers you expected, and the numbers you
got. A modelling error with a reproduction is worth more than a feature request.

## SH TechniekLab 1.1

Run `npm test` (158 checks) and test affected editor flows in a browser. The Pages build uses `node scripts/build-site.js` with an empty output directory outside the checkout. Do not add a framework merely for UI changes; browser validation can use external development tools without adding runtime dependencies.

Machine/controller orchestration belongs in its separate adapter modules; pressure and electrical solvers remain independent of lesson-specific animation. Valve customization must validate known ports and keep rendering consistent with stamping. Physical I/O aliases must not bypass wiring, power or output faults. Preserve legacy JSON documents and update the Dutch manual, limits and tests when changing behavior.
