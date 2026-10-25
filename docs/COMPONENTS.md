# Component library — 106 components

Each entry is one record in a catalog file: symbol, ports, physics and plausible faults. See
[the component contract](ARCHITECTURE.md#the-component-contract) for how to add one.

## Pneumatics

**Actuators** — double-acting cylinder (with adjustable end-position cushioning: length and
needle setting), single-acting cylinder, cylinder with a through piston rod (bore, rod
diameter, stroke, mass, load, viscous and static/sliding friction)

**Supply** — compressed air source, silencer

**Directional valves** — 3/2 (pushbutton NC/NO, detented hand lever, roller lever), 5/2
impulse, 5/3 with closed centre, 3/2 and 5/2 solenoid-operated

**Check valves** — check, OR (shuttle), AND (two-pressure), quick exhaust

**Flow valves** — one-way flow control valve, switchable meter-in / meter-out

**Pressure valves** — pressure regulator with its own diaphragm chamber

**Valve groups** — time delay valve NC/NO, sequence valve

**Instrumentation** — pressure gauge, pressure switch (pneumatic → electric)

## Electrics

24 V / 0 V rails, pushbutton, relay coil + contacts, relay with pull-in and drop-out delay,
counting relay, solenoid coil, indicator lamp, emergency stop, limit switch, and reed,
inductive, capacitive and optical proximity switches.

Limit switches are assigned to a cylinder and a stroke position in the inspector. Coils and
contacts couple through their designation (K1, Y1 …) rather than through drawn wiring.

## Hydraulics

Hydraulic cylinder, tank, fixed-displacement pump, pressure gauge, 4/3 directional valves
(closed, float and tandem centre; hand lever and solenoid), pressure relief valve, counterbalance
valve, check valve, one-way flow control valve.

## Digital logic

AND/OR/NOT/NAND/NOR/XOR (2 and 3 inputs), RS flip-flop (set-dominant), D flip-flop
(edge-triggered), preset counter, clock generator.

## Electronics

Resistor, capacitor, inductor, potentiometer, 1N4007 diode, LED, Zener diode, NPN and PNP
transistor (Ebers–Moll), n-channel MOSFET (square law), operational amplifier, AC source
(sine / square / triangle up to 200 kHz), transformer.

## Industrial motor control

Functional three-phase supply, contactor coil, three-pole contactor, three-phase motor, I²t overload contact and a simplified 24 V DC drive. These are teaching models with explicit limits, not a numerical AC machine solver.

## Physical controller modules

PLC and GRAFCET modules each provide L+/M power, eight digital inputs and eight sourcing outputs with configurable program aliases. Their electrical wiring determines the input levels and whether loads are energized.

## Configurable directional valves

Supported valve families expose standard actuation/return/centre variants. Optional per-position internal connections use existing ports and affect both the symbol and numerical flow stamping. New port geometry and arbitrary component types are not supplied.

## Worked examples

Loadable from the toolbar:

Direct control · Indirect control with an impulse valve · Speed control (meter-out) ·
Automatic reciprocation · **A+ B+ A− B−** with four limit valves · Time delay ·
Pressure-dependent sequence · Electropneumatic latching · **Hydraulic press with relief
valve** · **Holding a load with a counterbalance valve** · **GRAFCET: A+ B+ A− B−**

The GRAFCET example runs the same sequence as the pneumatic one with **10 components instead
of 11 and without a single limit valve**: the logic lives in the chart, not in the plumbing.

The current example menu contains **25 examples**, including electrohydraulic end switches, mixed pneumatic release, direct/reversing motor control, a DC conveyor, GRAFCET and Ladder in all three domains, physically wired controller modules and the drill-press scene. The scene uses two existing pneumatic cylinders and a functional motor; it is not an additional simulated component type. See the Dutch manual for the 1.1 additions.

## Expanded motor workshop

Sixteen additions in `catalog-drives.js` extend the original motor model:

| Component | Functional behaviour |
| --- | --- |
| `industrial_supply_1p` | Single-phase nameplate source, L/N/PE/PEN identities |
| `industrial_mains` | Three-phase source, selectable TN-S/TN-C/TN-C-S/TT/IT conductor roles |
| `industrial_earth` | Local protective-earth conductor identity |
| `industrial_motor_1p` | 230 V motor with internal functional capacitor, U1/U2/PE and shaft |
| `industrial_motor_6` | U1/V1/W1/U2/V2/W2 motor, externally drawn star/delta bridges |
| `industrial_contactor_1p` | Two power poles linked to a 24 V coil tag |
| `industrial_contact_ton_no`, `industrial_contact_ton_nc` | Pickup-delayed auxiliary contacts |
| `industrial_contact_tof_no`, `industrial_contact_tof_nc` | Dropout-delayed auxiliary contacts |
| `industrial_breaker` | Adjustable B/C/D thermal/magnetic functional circuit breaker |
| `industrial_motor_protector` | Power-pole protection plus trip contact 95–96 |
| `industrial_motor_temperature` | Motor temperature threshold contact with hysteresis |
| `industrial_pt100` | Temperature-dependent resistance, R = 100(1 + 0.00385T) |
| `industrial_load` | Constant torque, fan torque or flywheel inertia |
| `air_compressor` | Motor-driven air source with pressure demand and receiver volume |

Existing three-phase/DC motors gain a separate mechanical shaft. Existing hydraulic pumps gain an optional shaft/motor binding; unbound older pump circuits retain their own-drive behaviour. These ports cannot be connected to fluid, 24 V or mains conductors.
