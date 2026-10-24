# Scope and limitations

This document exists because a simulator that does not state its modelling limits invites you
to trust results it cannot support. Everything below is a known, deliberate boundary — not a
bug list.

- [Not implemented](#not-implemented)
- [Model limits in what is implemented](#model-limits-in-what-is-implemented)

## Not implemented

Measured against a full FluidSIM-class specification, the following is absent:

**Continuous electronics is a core, not a library.** 13 components. MNA with companion
models, Newton for diodes/transistors/MOSFETs, a decoupled electrical timestep. Missing:
a numerical three-phase AC machine model (the industrial library adds functional phase connectivity only), thyristors and triacs, JFETs, switching regulators, crystals, and
anything integrated beyond the op-amp.

**The soft PLC is a core.** Ladder plus an ST subset (assignment, IF/ELSIF/ELSE, boolean
expressions with real precedence, TON/TOF, CTU/CTD). Missing: FOR/WHILE/CASE, arrays,
structures, user function blocks, the rest of the IEC standard library — a graphical instruction editor beyond contacts/coils and TON/TOF. A graphical Ladder editor now supports series/parallel contacts, normal/set/reset coils and TON/TOF timers; its programs are serialized with the circuit.

**GRAFCET is a core.** Sequences, alternative and parallel branches, continuous and stored
actions, time and edge conditions, structure checking, and a graphical chart editor with live
token display. Missing: macro steps, enclosing steps, forcing orders, partial GRAFCETs.

**I/O ports** are named digital and analogue points over `sim.energized`/`sim.signal`, with a
mock driver. The **WebSocket driver is a stub**: it serialises frames and applies the most
recent one received, but it does not wait. One tick is 1 ms of simulated time at ~190× real
time, while a network round trip is several milliseconds of *wall clock*. The coupling is
therefore "latest value wins", not synchronous. Real EasyPort (serial hardware) and OPC/DDE
are not started.

**Hydraulics is a core, not a full library.** 14 components instead of the ~150 a complete
specification lists. Missing: variable pumps, load sensing, pressure compensators,
accumulators, filters, coolers, flow dividers, cartridge valves, hydraulic motors, swivel
drives.

**Digital logic is a core.** 12 components. Missing: JK and T flip-flops, shift registers,
adders, seven-segment displays, logic-module special functions.

**Not started at all:** multi-sheet projects, i18n, a custom-component editor, sub-circuits, a
minimap, coil↔contact cross-references, proportional and vacuum technology.

## Model limits in what is implemented

**Hose volume is underestimated.** `V_PER_WIRE` models roughly 0.015 cm³ per length unit; a
real 4 mm hose holds about 12 cm³ per metre. Timings on long lines are therefore optimistic.

**Cushioning is modelled on the double-acting cylinder only.** The single-acting and
through-rod cylinders still stop hard. The boss is treated as sealing over the first quarter
of the cushion length; a real one varies with its chamfer.

**No thermal dynamics.** Isothermal at 20 °C, oil at constant viscosity.

**No accumulator** and no hose-dependent compliance; stiffness is lumped into the effective β.

**Wire routing does not avoid components.**

**Every net has a small leak path** (`C_LEAK`) for conditioning, so mass conservation drifts by
~0.05 % per 2 s. The gate budgets this explicitly.

**Charge is not conserved as an invariant.** Backward Euler is O(dt/τ) slow: 0.45 % on the RC
curve at τ = 1 ms with a 10 µs step. A trapezoidal integrator would be second order but rings
at a switching edge — for a teaching instrument the damped response is the more honest one.

**The electrical timestep is fixed, not adaptive.** It comes from what the components declare,
not from local error. A circuit with widely separated time constants therefore computes
everywhere as finely as its fastest point needs: at 100 kHz that is 4000 solves per tick.

**Op-amp without frequency response** — no slew rate, no GBW, no output impedance, and the
output swing limit is a hard corner. A comparator is right; a filter is right only in the pass
band. That hard corner is also where Newton can stall inside a stiff positive-feedback loop —
this is reported, not prevented.

**Transistors without junction capacitances and without the Early effect** (Ebers–Moll, not
Gummel–Poon): DC and switching behaviour are right, cut-off frequencies do not exist. The
MOSFET has no body-diode model.

**Transformer with ideal coupling** — no leakage inductance, no core saturation, no iron
losses, no secondary winding resistance. The magnetising inductance is present and blocks DC;
beyond that it is not a transformer.

## Industrial teaching models

The industrial catalog adds functional three-phase connectivity, contactors, a simplified motor response, an I²t overload contact, and a resistive 24 V DC motor. These are control-circuit teaching models, not continuous AC machine models. See `HANDLEIDING-NL.md` for their precise assumptions. No mains fault current, starting surge, torque/slip calculation, earth fault, certified protective-device sizing, star-delta or variable-frequency drive model is supplied. Motor power terminals do not offer numerical voltage/current probes; estimated AC motor current is identified as such in the inspector. The DC motor probe reports its resistive model current, without back EMF.

## Machine scene and wired controller modules

The drill-press scene follows existing cylinder stroke and motor speed state. Its hole animation represents elapsed dwell only; no cutting force, tool wear, material removal, inertia of a real spindle or safety-rated stop is calculated. Model interlocks prevent unclamping until the model feed is home and spindle speed is below 50 rpm. These limits are teaching choices, not machine-safety verification.

Controller modules have eight 24 V digital inputs and eight simplified sourcing outputs, with configurable program aliases. They require L+/M wiring and do not bypass disconnected signals. Inputs/outputs outside their alias map can still be virtual. No real PLC hardware protocol, galvanic isolation, short-circuit protection, analogue I/O or industrial diagnostics is modelled.

Advanced valve editing changes paths only between the existing valve ports and existing positions. It does not create new port geometry, port counts, custom component families or one-way flow behaviour. Selecting a standard variant clears the custom path layout; incompatible connected pilot ports must be disconnected explicitly first.
