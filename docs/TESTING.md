# The correctness gate

```bash
npm test          # or: node tests/run.js
```

110 tests in 7 suites, no framework. A test framework would cost more than it saves here, and
this keeps `node tests/run.js` the whole story. Suites are discovered rather than listed: a
new area drops in as `tests/gate-*.js` and runs, with no shared registry file for parallel
work to collide on.

| Suite | Covers |
| --- | --- |
| `gate-publication.js` | Complete static artifact, immutable asset paths, transitive modules, release identifier, lesson links and reproducibility |
| `gate-industrial.js` | Motor latching, stop/restart, reversing interlocks, phase faults, coil and contact faults, thermal trip/reset, DC polarity, serialization and domain separation |
| `gate-electrohydraulic.js` | Hydraulic position sensors, full stroke cycle, serialization, mixed pneumatic interlock |
| `gate.js` | Flow, mechanics, nets, sequences, faults, hydraulics, GRAFCET |
| `gate-electronics.js` | MNA, Newton, companion models, sub-tick sampling |
| `gate-plc.js` | Soft PLC, Structured Text, ladder equivalence, I/O ports |
| `gate-pdf.js` | PDF export |

## What the tests assert

They check **behaviour that emerges from the physics**, not that code exists. Each one is
written so that it *can* fail; several fired on their first run and found real bugs.

A test like "a throttle regulates speed" does not inspect a throttle object. It builds a
circuit, sweeps the adjustment range, and asserts that the resulting stroke times are
monotonic and span a useful ratio — 0.25 s to 2.71 s, as it turns out. If the flow model
were replaced by an animation curve tomorrow, that test would still pass only if the
replacement were physically honest.

The same standard applies to the claims in [PHYSICS.md](PHYSICS.md): every number in those
tables is a gate measurement, not a design target.

## Budgeted imperfections

Two are asserted rather than hidden:

- Every net has a tiny leak path to atmosphere (`C_LEAK`) for conditioning. Mass conservation
  drifts by roughly 0.05 % per 2 s, and the gate budgets exactly that — a tighter bound would
  fail, a looser one would stop catching real leaks.
- The backward-Euler discretisation is O(dt/τ) slow: 0.45 % on the RC curve at τ = 1 ms with a
  10 µs step. The gate asserts the bound instead of pretending the error is zero.

## One deliberate deviation from the specification

The specification asks for "assert velocity variance" on meter-in vs. meter-out throttling.
Measured against this model that is the wrong metric — **meter-in produces the *lower*
variance** (0.003 vs. 0.14), because an uncontrolled slam is perfectly uniform while a
controlled motion has structure.

The test instead asserts what actually distinguishes the two: which side determines the
velocity, via back pressure and peak speed. The reasoning is written in the test, next to the
assertion, so the next reader can disagree with it on the evidence.

## Browser validation for the light industrial release

The release was exercised in headless Chromium: direct lesson links, motor-library filtering, start/self-hold, stop, reverse, and no pressure legend on a motor-only drawing. Seven lesson links loaded their circuits without JavaScript errors. Toolbar bounds were checked at 1600, 1366 and 1024 pixel widths. Updated screenshots show the light editor and industrial example. Playwright was installed outside the checkout only for this validation; the application and its Node test suite still have no external dependencies.

The publication artifact was also served under `/SHPNHYD/` and exercised in Chromium. The light CSS loaded, all six motor components appeared, clicking a motor inserted it, and a lesson opened its versioned example link. Every loaded JS/CSS resource used the same release asset directory. No console errors or failed HTTP responses occurred.
