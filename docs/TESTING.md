# The correctness gate

```bash
npm test          # or: node tests/run.js
```

166 tests in 15 suites, no framework. A test framework would cost more than it saves here, and
this keeps `node tests/run.js` the whole story. Suites are discovered rather than listed: a
new area drops in as `tests/gate-*.js` and runs, with no shared registry file for parallel
work to collide on.

| Suite | Covers |
| --- | --- |
| `gate-controller-editor.js` | Saved controller programs, automatic cycles in all three domains, exclusive mode selection, timed outputs, broken coils, undo/redo, draft imports and visible GRAFCET return paths |
| `gate-import.js` | Finite import coordinates/parameters and escaped recorder labels |
| `gate-manual-controls.js` | Actual pneumatic motion with momentary control, electrical NO/NC inputs, latching controls, three-position hydraulic actuation and automatic-only valves |
| `gate-actuators.js` | Automatic actuator recognition and read-only display of actual stroke, pressure and motor direction |
| `gate-machine.js` | Manual and automatic drill cycles, clamping interlocks, controlled stop, jammed clamp, custom scene serialization, own tags and disabling teaching interlocks |
| `gate-valves.js` | Safe variant replacement, custom pneumatic/hydraulic port paths and layout validation |
| `gate-controller-io.js` | Powered wired controller operation, disconnected inputs/outputs, supply loss and conflicting aliases |
| `gate-print.js` | Branded pages, title escaping, wide/parallel Ladder print geometry and PDF logos on drawing and parts pages |
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

## Controller workspace browser checks

Chromium checks exercised dedicated full-height tabs, adding/deleting Ladder networks and parallel branches, selecting a TON timer, live motor control from Ladder, placing GRAFCET steps and drawing a transition. All thirteen lesson links opened their circuits and selected the requested controller workspace. The same editor checks were repeated against the versioned Pages publication artifact.

## Floating analysis windows

Chromium validation checked that the drawing uses the full available height with no bottom analysis dock, including browsers retaining the old 620 px diagram preference. All three non-modal windows opened together without changing the drawing bounds. Dragging, resizing, maximize/restore, saved geometry, automatic oscilloscope opening on a probe, live oscilloscope and displacement traces, and closing with Escape without stopping the simulation were exercised. GRAFCET and Ladder workspaces remained usable with a measurement window open. Viewport resizing kept window controls on screen. The versioned Pages artifact was checked as well.

## Ladder palette and branded printing

Chromium checks exercised palette click placement, drag/drop insertion, selection, Delete, timer editing and connected wire geometry. Print previews for circuit, GRAFCET and Ladder contained the SH logo and no editor controls; Ctrl+P opened the branded preview. A real A4 landscape PDF was generated from the print document to verify layout and extractable labels/logo text. Multi-network Ladder pagination was checked separately. These checks were repeated against the versioned Pages artifact.

## Final 1.1 review

The combined suite contains 166 executed tests. Browser checks cover manual and automatic machine operation, physical controller pins and program bindings, valve variant selection and interactive internal port editing, the palette and branded printing. All sixteen lesson links and referenced local images/modules were checked. Inspector text values are escaped so imported tag names cannot inject markup into property fields.

CI checks Node.js 18, 20, 22 and 24; the Pages build uses Node.js 22. The final local run used Node.js 24.

The process controls were checked in Chromium for pointer and keyboard holds, release on blur and workspace changes, latching buttons, spring-centred hydraulic levers and live throttle adjustment. Export choices were verified with actual pointer hit testing at 1600, 1024 and 700 px. A real one-page A4 PDF and standalone SVG were inspected after removing wire hit targets; the SH logo and clean open wire paths are retained.

Physical process illustrations replace all schematic rendering in process cards. Browser checks verify round NO/NC buttons and emergency stop, valve blocks, working direct knob dragging, momentary and latching actuation, hydraulic lever return and the absence of schematic symbol classes in the process cards.

The simulation dashboard was checked in Chromium for full-width layout and simultaneously visible machine, controls and actuators. The second window was exercised with shared pneumatic actuation, keyboard release, synchronized tempo and reset, main-editor navigation, document replacement, window closing and continuation in the main page.
