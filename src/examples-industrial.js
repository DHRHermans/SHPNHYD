// Original teaching circuits: 24 V control wiring plus functional three-phase power.
export function buildMotorExample(Circuit, reversing = false) {
  const c = new Circuit();
  const add = (type, tag, x, y) => {
    const i = c.add(type, x, y);
    if (i.params.tag) i.params.tag.value = tag;
    return i;
  };
  const wire = (a, ap, b, bp) => c.connect({ inst: a.id, port: ap }, { inst: b.id, port: bp });
  const supply = add('industrial_supply', 'Q1', 100, 50);
  const forward = add('industrial_contactor', 'KM1', 100, 200);
  const motor = add('industrial_motor', 'M1', 100, 400);
  const reverse = reversing ? add('industrial_contactor', 'KM2', 300, 200) : null;
  if (reverse) {
    forward.params.interlock.value = 'KM2';
    reverse.params.interlock.value = 'KM1';
  }
  for (let p = 1; p <= 3; p++) {
    wire(supply, `L${p}`, forward, `L${p}`);
    wire(forward, `T${p}`, motor, ['U', 'V', 'W'][p - 1]);
    if (reverse) {
      wire(supply, `L${p}`, reverse, `L${p}`);
      wire(reverse, `T${p}`, motor, ['W', 'V', 'U'][p - 1]);
    }
  }
  const power = add('rail_24v', '', 610, 50);
  const estop = add('estop', 'S0', 610, 110);
  const stop = add('btn_nc', 'S2', 610, 190);
  const thermal = add('industrial_overload', 'F1', 600, 270);
  wire(power, 'a', estop, 'a');
  wire(estop, 'b', stop, 'a');
  wire(stop, 'b', thermal, 'a');
  for (let n = 0; n < (reversing ? 2 : 1); n++) {
    const x = 580 + n * 260;
    const coilTag = `KM${n + 1}`;
    const start = add('btn_no', n ? 'S3' : 'S1', x, 390);
    const hold = add('contact_no', coilTag, x + 90, 390);
    const coil = add('industrial_coil', coilTag, x, 590);
    const ground = add('rail_0v', '', x + 10, 700);
    const lamp = add('lamp', `H${n + 1}`, x + 100, 590);
    wire(thermal, 'b', start, 'a');
    wire(thermal, 'b', hold, 'a');
    wire(start, 'b', hold, 'b');
    if (reversing) {
      const interlock = add('contact_nc', n ? 'KM1' : 'KM2', x, 490);
      wire(start, 'b', interlock, 'a');
      wire(interlock, 'b', coil, 'a');
    } else wire(start, 'b', coil, 'a');
    wire(coil, 'b', ground, 'a');
    wire(coil, 'a', lamp, 'a');
    wire(lamp, 'b', ground, 'a');
  }
  return c;
}
