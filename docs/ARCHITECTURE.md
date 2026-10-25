# Architecture

One idea runs through the whole codebase: **a controller is not a circuit.** A ladder
diagram, a GRAFCET chart and a PLC program are three notations for a specification *above*
the circuit. They read its sensors and command its actuators through one narrow channel —
`sim.signal(tag)` in, `sim.energized` out — and nothing below them knows which one is
talking.

The original headless soft PLC used this interface without changing the engine. The graphical controller workspaces now schedule the selected controller inside the simulation tick, through the same signal channel.

- [Module map](#module-map)
- [The component contract](#the-component-contract)
- [Solver branches](#solver-branches)
- [Controllers above the circuit](#controllers-above-the-circuit)
- [Probes and the oscilloscope](#probes-and-the-oscilloscope)
- [Derived, never stored](#derived-never-stored)

## Module map

| File | Contents |
| --- | --- |
| `src/engine.js` | ISO 6358 + hydraulic orifices, nets, stamping, fixed-point iteration, headless API |
| `src/symbols.js` | ISO 1219 primitives, valve renderer with a sliding spool |
| `src/catalog.js` | Pneumatics/electrics — symbol, ports, physics and faults per component |
| `src/catalog-hydraulic.js` | Hydraulic components, same contract |
| `src/catalog-electronics.js` | Electronic components, same contract plus the MNA hook |
| `src/catalog-industrial.js` | Functional three-phase connectivity, motor control components, overload and simplified DC drive |
| `src/examples-industrial.js` | Direct and reversing starter teaching circuits |
| `src/catalog-digital.js` | Gates, flip-flops, counters, clock generator |
| `src/circuit.js` | Document model, serialisation, worked examples |
| `src/grafcet.js` | EN 60848 evolution rules, condition parser, structure check |
| `src/grafcet-view.js` | Graphical chart editor — rendering, hit testing, live token display |
| `src/plc.js` | Soft PLC: ST parser, ladder, TON/TOF/CTU/CTD |
| `src/io.js` | I/O ports, mock and WebSocket drivers |
| `src/history.js` | Undo/redo |
| `src/diagram.js` | Displacement-step diagram, CSV |
| `src/scope.js` | Oscilloscope, virtual probes |
| `src/partslist.js` | Bill of materials derived from the drawing |
| `src/export.js` | JSON / SVG / PNG / PDF / CSV output |
| `src/panels.js` | Resizable panels |
| `src/main.js` | Canvas, direct manipulation, inspector, run loop |
| `tests/gate.js` | Correctness gate — fluids, mechanics, sequences |
| `tests/gate-plc.js` | Gate for the soft PLC and I/O |
| `tests/gate-electronics.js` | Gate for continuous electronics |
| `tests/gate-pdf.js` | Gate for PDF export |

## The component contract

A new component needs **one entry in a catalog file** — symbol, ports, physics, faults.
No change to the engine, no change to the inspector, no change to the UI. The interface is
documented at the top of `catalog.js`.

Two consequences fall out of that:

**Faults are declared, not built.** Each component declares the defects it can plausibly
have (`stuck`, `clogged`, `leak`, `off`, `seized`, `coil_open`, `contact_welded`, `drift` …)
and the inspector renders whatever the component offers. A new fault type needs no UI work.
Armed faults are marked on the sheet and are undoable.

**Labels couple, not wires.** Coils and contacts couple through their designation (K1, Y1 …)
rather than through drawn wiring — the way FluidSIM does it, and the way a real schematic is
read. Limit switches are assigned to a cylinder and a stroke position in the inspector.

## Solver branches

Two electrical solvers share one network graph:

    resistive DC ladder  ──┐
                           ├── same network graph, same stampElectric components
    MNA + Newton         ──┘

The MNA branch is enabled per sheet, and only when a continuous component is present. Without
one, the resistive solver runs unchanged — including the digital settle loop and the one-tick
relay delay that latching depends on. A relay contact can therefore switch an RC circuit
without either branch knowing the other exists.

The fluid side is separate again: air and oil live in distinct network graphs, which is why
the editor can refuse an air-to-oil connection without a special case.

**Component-internal nodes** are shared machinery rather than an electrical trick. A component
declares how many unknowns it needs beyond the nets — `extras` on the MNA side, `fluidExtras`
on the pneumatic one — and claims them with `st.extra()` during stamping. An ideal voltage
source uses one for its branch current; a cylinder with end-position cushioning uses two, one
per chamber, because a cushion needs the chamber to be a node distinct from the port it feeds.
They are claimed unconditionally so that changing a parameter mid-run cannot shift anyone
else's index.

See [PHYSICS.md](PHYSICS.md) for what each solver actually computes.

## Controllers above the circuit

**GRAFCET** (EN 60848) is deliberately **not** made of components. A chart is a
specification over the circuit with its own evolution rules, which have nothing to do with
nets and conductances. Forced into the electrical graph it would need wires the standard
does not define.

Rules R1–R5 are implemented: initial steps active at start; a transition is *enabled* when
all upstream steps are active and *fireable* when its condition is additionally true; firing
deactivates all predecessors and activates all successors; **all fireable transitions fire
simultaneously** against a frozen state snapshot — otherwise the second transition would
already see the first one's result; a step both activated and deactivated in the same
evolution stays active.

Transition conditions are a real boolean language with a recursive-descent parser (precedence
and parentheses do not work with regular expressions):

    S1              plant signal by designation
    X2              step activity
    /S1  !S1        negation
    S1 * S2         AND        S1 + S2   OR
    ↑S1  ↓S1        rising / falling edge
    t/X2/5s         X2 has been active for 5 s
    ( )             grouping

Charts are drawn in a **graphical editor** — place and move steps, link transitions, edit
actions in a side panel — with live token display during simulation. Structure checking
reports a missing initial step, unreachable steps, dead ends, duplicate step names and syntax
errors, and stays silent on a correct chart.

**Structured Text** (`src/plc.js`) is a subset, and says so: assignment, IF/ELSIF/ELSE,
`AND OR XOR NOT` with real precedence, comparisons, arithmetic, a `VAR` block, time literals
`T#500ms`, and the function blocks TON, TOF, CTU, CTD in IEC call syntax
`T1(IN := x, PT := T#1s); done := T1.Q;`. Recursive descent again, for the same reason:
`a OR b AND NOT c` has exactly one correct reading, and a pattern match does not find it.

Ladder rungs compile into the same closures, so there is one runtime for both languages —
and the gate checks that latching behaves identically in ladder and ST, scan for scan.

A scan is `scan → program → flush`, before `sim.step()`. Inputs are therefore one tick old.
That is not sloppiness; it is the input scan of a real PLC, and the same delay that breaks
the algebraic loop in the ladder.

**I/O ports** (`src/io.js`) are named digital and analogue points bound to the circuit.
Directions are stated from the logic's point of view: `in` is read, `out` is written — an
external process sees the mirror image. That is why one card serves both roles: the
simulation controlling an external process, or being driven by one. `set()` on an input
throws, exactly as real hardware would refuse it; a program must not forge its own sensors.

## Probes and the oscilloscope

**Probes are deliberately not components.** They have no stamp, no port and no place in the
network graph — which is the only way to *guarantee* the requirement that measurement must
not affect the circuit, rather than merely intending it. The gate proves it over 3000 ticks
with 8 probes attached: identical to the last bit.

Sampling happens in the tick loop (1000/s), not the frame loop. At 60 fps every 17th tick
would be captured, which is precisely the aliasing the design forbids.

## Derived, never stored

The bill of materials is computed from the drawing and never persisted. A parts list that can
disagree with the schematic is worse than no parts list. It groups by type *and
configuration* — a 25 mm and a 50 mm cylinder are two line items, eight identical valves are
one line reading "8×" — sorts designations naturally (1A1 before 1A10 before 2A1), and flags
armed faults.

Export follows the same rule. PNG is produced by rasterising the same SVG that the SVG export
writes, so the two outputs cannot drift apart. The exported SVG stands alone: inline styles,
a viewBox around the content, a title block with the date, and none of the editor's furniture
(port dots, selection frames, grid).

## Industrial power topology

The `motor` port kind is a functional domain, separate from the numerical electric, pneumatic and hydraulic networks. `motorNetwork` joins drawn wires and closed three-pole contactor paths, then propagates phase identities from functional supplies. The motor accepts exactly three different phases from the same supply; their permutation determines direction. Multiple phase identities at a motor terminal report a phase conflict, not an AC fault-current calculation. Mechanical interlock checks the live coil command directly, independent of catalog iteration order.

Industrial contactor coils use the existing 24 V solver and ordinary auxiliary contacts. An open-coil fault now inhibits pickup even if an external parallel load leaves a voltage across the open terminals. Motor speed is a first-order teaching response. Thermal protection integrates a didactic excess-I² budget and opens a real NC contact in the control circuit until cooled and manually reset. The separate DC drive is a resistive load with a voltage-dependent speed response.

The light interface remains independent of the exported engineering symbols. `lessen.html` links to allowlisted entries of `EXAMPLES` through the `example` query parameter; unknown names fall back to the existing electrohydraulic start example.

## Graphical controller workspaces

`Circuit.controller` selects manual, GRAFCET or Ladder control. A legacy circuit with a chart and no explicit mode uses GRAFCET. `Circuit.ladder` stores ordered rungs with parallel branches of series contacts, output names and coil kinds (normal, set, reset, TON, TOF). Both fields participate in JSON snapshots and undo/redo.

`LadderRuntime` compiles the serializable network into the existing `PLC` combinators. Inputs are sampled once per scan, and rungs run sequentially; later rungs see earlier writes. Timers use simulation time. Only the selected controller publishes software outputs after the numerical electric solve and before discrete actuator updates. `controllerSignal` exposes closed/healthy levels for NC buttons, emergency stops and overload contacts. `applyControllerOutputs` also updates virtual coil indicators while respecting open-coil faults.

`ladder-view.js` builds the graphical network editor and updates live highlights without recreating focused controls. `main.js` promotes GRAFCET and Ladder into full-height central workspaces. `grafcet-view.js` includes external return paths, transition labels and action blocks in its view bounds. Legacy diagrams and the process drawing remain in the same document.

## Floating analysis windows

`tool-windows.js` reparents the existing chart/list elements and their controls into non-modal dialog sections, preserving event handlers and recorder/probe state. Redraws use window visibility rather than the selected controller workspace; recording remains in the simulation tick. Window bounds are clamped to the viewport and their normal position/size are stored separately from the side-panel preferences. No drawing height is reserved for analysis. The original panel container is used only for the full-height GRAFCET and Ladder editors.

## Process scene, configurable valves and wired controllers

`Circuit.scene` stores tag-based links from the drill-press scene to two existing cylinders and a motor. `machine.js` publishes virtual process feedback before the selected controller scan, applies explicit teaching interlocks after it, and updates visual dwell progress after mechanics. Manual commands, GRAFCET and Ladder therefore operate the same plant. `machine-view.js` changes SVG transforms using actual model positions and speed; it does not play a canned motion timeline.

Per-instance `valveLayout.boxes` overrides the paths used by both the valve renderer and pneumatic/hydraulic stamping. Import validates known ports, position count and duplicate paths. Standard variant replacement preserves common parameters and refuses to discard wires attached to removed pilot ports.

`controller-io.js` supplies the two physical controller definitions and builds alias maps after the electric solve. `controllerSignal` prioritizes mapped input voltages. `applyControllerOutputs` routes mapped output requests to module drivers instead of writing actuator tags directly. The following electric solve determines whether an actually wired coil is energized. Missing power and disconnected wires cannot be bypassed by a shared tag. Ambiguous aliases fail closed. Normal virtual program variables retain their previous behavior.

## Functional mains and mechanical drives

`power-network.js` resolves conductor identities through drawn wires, closed contactors and protection poles; it carries RMS nameplate metadata without extending the DC numerical solver to AC. `motor-mechanics.js` resolves separate shaft graphs or optional motor-tag bindings, derives load and inertia contributions, and updates first-order speed/current/thermal teaching models. `catalog-drives.js` provides the additional workshop components. A shaft graph with multiple motors is reported as ambiguous rather than silently selecting a drive.
