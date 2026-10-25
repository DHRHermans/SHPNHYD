# Changelog

## 1.6.0 — Lucht- en olieverzorging

- Filters voor lucht en hydraulische druk-, aanzuig- en retourleidingen, met werkelijk drukverlies, instelbare vervuiling en filterbypass.
- Waterafscheider, luchtdroger, olienevelaar, buffervat en handmatige 2/2-afsluitkranen voor lucht en olie.
- Lucht- en oliekoelers/radiatoren en olieverwarmer, met lokaal temperatuurmodel.
- Perslucht-druktank en hydraulische blaasaccumulator met gasvoordruk, laad-/ontlaaddebiet en zichtbaar olievolume.
- Fysieke componentbeelden, vier overzichtelijke voorbeelden en bijgewerkte handleiding.
- Volledige regressiecontrole, 214 tests in 21 testgroepen.

## 1.5.0 — Pressostaten, schakelaars en tijdrelais

- Lucht- en oliepressostaat met wisselcontact 11–12/14, schakeldruk en hysterese.
- Tuimel-, sleutel-, voet- en trekkoordschakelaar; keuzeschakelaar Hand–0–Auto.
- TP-pulsrelais, knipperrelais, retentief tijdrelais met bedrade reset en teleruptor.
- Fysieke bediening, instelbare tijden in het simulatiescherm en drie nieuwe voorbeelden.
- Omkeerbare luchtmotor en hydromotor met druk-/debietmodel, mechanische as, lastkoppeling en twee voorbeelden.
- Motorlast in Nm typen en expliciet bevestigen, in plaats van een schuifregelaar.
- 202 tests in 19 testgroepen.

## 1.4.0 — Uitgebreid motoratelier

- 230 V-monofasemotor en driefasenmotor met zes klemmen; de getekende ster-/driehoekbruggen bepalen de aansluiting.
- Monofase- en driefasennet met TN-S, TN-C, TN-C-S, TT of IT en functionele N/PE/PEN-aansluitingen; lokale aardelektrode.
- Tweepolige contactor en vertraagd opkomende/afvallende NO- en NC-contacten.
- Instelbare B/C/D-automaat en motorbeveiligingsschakelaar met thermisch/magnetisch onderwijsmodel.
- Motorverwarming, temperatuurcontact met hysterese en PT100-weerstandsmodel.
- Mechanische asverbindingen, constant-koppel-/ventilatorlast en vliegwiel. Pompopbrengst volgt motortoerental en pomplast beïnvloedt de motor.
- Compressor met motoraandrijving, drukregeling en buffervolume; opgebouwde luchtdruk blijft na stoppen opgeslagen.
- Fysieke bediening, motorselectie en instelknoppen in het simulatiescherm; acht nieuwe voorbeelden.
- Totaal 106 componenten, 34 voorbeelden en 190 tests.

## 1.3.0 — Leeratelier zonder aparte rollen

- Automatisch lokaal bewaren en herstellen, met vier vorige versies en JSON-export als overdraagbare reservekopie.
- Zes begeleide opdrachten met voorspelling, stapsgewijze waarnemingscontrole, hints en bewaarde reflectie.
- Onderdeeluitleg met werking, poortbetekenissen en praktijkonderzoek voor de onderdelen uit het schema.
- Meettafel met twee meetpennen voor DC-spanning, ondersteunde U/R-stroommeting, druk, positie en toerental, HOLD en bewaarde meetnotities.
- Stapbediening van de echte 1 ms-modeltick, PLC-scan en GRAFCET-situatie, voorwaardeninspectie en bewaarde momentopnamen.
- Berekende componentdoorstroming zichtbaar in ondersteunde schemaleidingen, zonder fictieve AC- of onbekende leidingstromen.
- Gerichte diagnose en een willekeurige verborgen storingsopdracht met onthullen en herstel van de oorspronkelijke defectinstellingen.
- Simulatiekaarten ordenen door slepen, beeldgrootte kiezen en groeperen; indeling wordt met het document opgeslagen.
- Leeratelier is ook beschikbaar in het extra simulatievenster; geen aparte accounts of leerling-/leerkrachtrollen.

## 1.2.1 — Losse aandrijvingen als hoofdweergave

- Zonder machineopstelling staan cilinders en motoren groot op de hoofdplek links, met fysieke bediening rechts.
- Kolombooropstellingen kunnen via Losse cilinders en motoren tijdelijk als losse aandrijvingen worden bekeken; terugschakelen behoudt de opstelling.
- Het extra simulatievenster neemt de gekozen weergave over.

## 1.2.0 — Groot simulatiescherm en extra venster

- Groot simulatiescherm combineert machinebeeld, fysieke bediening en bewegende aandrijvingen zonder editorpanelen.
- Extra venster voor een tweede monitor, met dezelfde simulatie en eigen Start/Pauze, Stop/reset en tempo.
- Hoofdvenster blijft bruikbaar voor het schema; nieuwe onderdelen en documentwissels worden doorgegeven aan het simulatievenster.
- Veilige vrijgave van momentane knoppen bij focusverlies en sluiten; de simulatieklok wordt vanuit het zichtbare venster bijgewerkt.
- Direct openen van de grote weergave via `screen=focus`.

## 1.1.3 — Fysieke componenten in het machinebeeld

- Eigen fysieke afbeeldingen vervangen de schemasymbolen in het procesbeeld: ronde drukknoppen, paddenstoelnoodstop, ventielblokken, hefbomen, spoelen, sensoren, lampen en modules.
- Het afgebeelde onderdeel zelf is bedienbaar met muis, aanraking en toetsenbord.
- Indrukbeweging, hefboomstand, spoelindicatie en lampstatus volgen de simulatie.
- Instelventielen hebben een draaiknop die via verslepen instelbaar is; de schuif blijft als alternatief beschikbaar.
- Het schema behoudt zijn technische symbolen; afdrukken van Machinebeeld gebruikt de fysieke afbeeldingen.

## 1.1.2 — Handbediening in het procesbeeld en correcte export

- Drukknoppen, handventielen, automatische ventielen, sensoren, spoelen en overige onderdelen worden in Machinebeeld zichtbaar.
- Momentane bediening met muis, aanraking en toetsenbord; veerterugstelling, vergrendeling en 4/3-hefboom links/rechts volgen het echte schema.
- Smooropening en drukinstellingen direct aanpasbaar; live standen en poortdrukken/-spanningen.
- Exportmenu losgemaakt van de schuifbare bovenbalk zodat alle keuzes zichtbaar blijven.
- Onzichtbare leidingklikzones verwijderd uit de export; voorkomt zwarte vlakken in SVG, PNG en afdrukken.

## 1.1.1 — Zelf machineopstellingen bouwen

- Automatische bewegende beelden voor vier cilindertypes en beide elektromotoren, met echte slag, druk en draairichting.
- Zichtbare zuigerstangen en verbindingen naar klembek en boorvoeding in het procesbeeld.
- Lege zelfbouwopstelling zonder schema of besturingsprogramma; uitgewerkt voorbeeld blijft apart beschikbaar.
- Kolomboor, bankschroef en werkstuk plaatsen, verslepen, verwijderen en positioneren.
- Eigen koppelingen voor cilinders, motor, ventielen, start/stop en virtuele procesingangen.
- Oefenhulp standaard uit bij zelfbouw: eigen GRAFCET/Ladder bepaalt de volgorde.
- Onderdelen, posities en koppelingen worden met het schema opgeslagen en ondersteunen undo/redo.

## 1.1.0 — SH TechniekLab: schema’s, besturingen en machinesimulatie

- Nieuwe overkoepelende naam SH TechniekLab; SH-logo en bestaande repository-URL blijven behouden.
- Visuele bankschroef en kolomboormachine met handbediening en automatische GRAFCET-/Laddercyclus, eindstandbewaking en gecontroleerde stop.
- Plaatsbare PLC-/GRAFCET-modules met 8 fysiek bedrade ingangen en 8 uitgangen op 24 V.
- Instelbare ventieluitvoeringen, twee extra elektrische hydrauliekvarianten en interne verbindingen per stand; aansluitingen worden niet stilzwijgend verwijderd.
- SHIL blijft afzonderlijk en is via een link bereikbaar.
- Vernieuwde Ladder-tekenbediening en afdrukken met SH-logo, inclusief PDF-export.
- Repositorycontrole: 90 componenten, 25 voorbeelden, 158 tests en bijgewerkte documentatie.

## Laddergereedschappen en afdrukken met SH-logo

- Symboolbalk, invoegpunten en slepen/neerzetten voor contacten en spoelen in de Ladder-editor.
- Selectiegebonden eigenschappen en doorlopende bedrading tussen rails, contacten en uitgangen.
- Afdrukvoorbeeld voor schakeling, GRAFCET en Ladder via Export of Ctrl/Cmd+P, met SH-logo, titel, datum en bladnummer.
- Logo op de tekening en het onderdelenblad van de PDF-export; drie nieuwe afdruktests (127 tests totaal).

## Meer tekenruimte en losse analysevensters

- Vaste onderste analysebalk verwijderd; het schema krijgt de volledige beschikbare hoogte.
- Weg-stapdiagram, oscilloscoop en onderdelenlijst zijn via Analyse als losse, verplaatsbare vensters beschikbaar.
- Vensters kunnen tegelijk open, zijn te vergroten en van formaat te veranderen en onthouden hun positie en formaat.
- Metingen, meetprobes, export en GRAFCET-/Ladderwerkbladen blijven beschikbaar tijdens gebruik van de vensters.

## GRAFCET- en PLC-Ladderwerkbladen

- Apart groot GRAFCET-tekenvlak en een grafische Ladder-editor met serie/parallelcontacten, uitgangs-, set/resetspoelen en TON/TOF-timers.
- Eén actieve besturing per document, met gedeelde virtuele sensoren en spoelen voor pneumatiek, hydrauliek en elektrische motoren.
- Zes nieuwe besturingsvoorbeelden en zes leskaarten; JSON en undo/redo bewaren de programma's.
- GRAFCET-teruglussen en overgangen buiten de stapgrenzen blijven zichtbaar.
- Veertien nieuwe regressietests; 124 tests totaal.

## SH TechniekLab — Licht atelier en motorbesturing

- Eigen lichte vormgeving met SH-monogram en een lesoverzicht met zeven Nederlandse opdrachten.
- Zes motorcomponenten; voorbeelden voor zelfhouding, omkeersturing en een 24 V-transportband.
- Hoofdkring met functionele fasevolgorde en fasefouten; thermisch relais met vergrendelde uitschakeling en reset.
- Onderbroken spoelen worden niet langer als bekrachtigd gemeld wanneer er toch spanning over hun aansluitingen staat.
- Twaalf regressietests voor de industriële uitbreiding; 109 tests totaal.
- Referentieonderzoek van aangeleverde FluidSIM-archieven, zonder overname van originele programma- of oefenbestanden.

Notable changes to FluidLab. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **End-position cushioning** on the double-acting cylinder, adjustable in length and needle
  setting. The deceleration is not a force term: the cushioning boss throttles the chamber's
  path to its port, and the pressure that builds does the work. Impact velocity drops from
  0.913 to 0.060 m/s for a 2 kg load at 16.5 bar chamber pressure, costing 2.2 % of cycle time.
- **Component-internal nodes in the fluid solver** (`fluidExtras`), mirroring the facility the
  MNA branch already had. A cushion needs the chamber to be a node distinct from the port it
  feeds; there was previously nowhere to put the restriction.
- Two gate tests: that the cushion works through chamber pressure rather than a braking term,
  and that closing the needle too far turns it into an air spring and makes it worse again.

## [1.0.0] — 2026-07-27

First tagged release. The simulator is feature-complete against its own scope; the
boundaries it does *not* cross are listed in [docs/LIMITATIONS.md](docs/LIMITATIONS.md).

### Simulation core

- Pneumatic network solver: ISO 6358 flow (sonic conductance `C`, critical ratio `b`) with a
  laminar crossover near equilibrium, union-find pressure nets, backward-Euler gas state, and
  a damped fixed-point iteration that reports non-convergence rather than hiding it.
- Cylinder mechanics with viscous, Coulomb and static friction; hard end stops without
  overshoot.
- Hydraulic domain sharing the solver: stiffness-driven pressure, orifice equation with a
  laminar branch, cavitation clamped at vapour pressure, air and oil in separate graphs.
- Continuous electronics via modified nodal analysis: companion models for reactive parts,
  Newton–Raphson with SPICE `pnjlim` step limiting on pn junctions, and an electrical timestep
  decoupled from the 1 ms fluid tick.
- Digital logic on the same electrical graph — combinational gates settle within a tick,
  flip-flops clock on the tick boundary.

### Control layer

- GRAFCET to EN 60848: evolution rules R1–R5, simultaneous firing against a frozen snapshot,
  a recursive-descent condition parser (`*`, `+`, `/`, `↑`, `↓`, `t/X2/5s`, parentheses),
  continuous and stored actions, structure checking, and a graphical chart editor with live
  token display.
- Soft PLC: Structured Text subset (assignment, IF/ELSIF/ELSE, boolean expressions with real
  precedence, `VAR`, time literals, TON/TOF/CTU/CTD) and ladder rungs compiling to the same
  runtime.
- Named digital and analogue I/O ports with mock and (stub) WebSocket drivers.

### Editor and instrumentation

- 80 components across pneumatics, electrics, hydraulics, digital logic and electronics, each
  declaring its own plausible faults.
- Four-channel oscilloscope with edge trigger, cursors, freeze and CSV; virtual probes proven
  non-invasive by the gate.
- Displacement-step diagram, bill of materials derived from the drawing, undo/redo, resizable
  panels.
- Export to JSON, SVG, PNG, PDF and CSV — PNG rasterised from the same SVG the exporter
  writes, so the two cannot drift apart.

### Quality

- Correctness gate: 92 behavioural tests in 4 auto-discovered suites, no framework.
- CI on Node 18, 20 and 22, including a check that the zero-dependency claim still holds.

### Licensing

Released under [PolyForm Noncommercial 1.0.0](LICENSE). Noncommercial use — including by
schools, universities, public research bodies and charities — is free. Commercial use requires
a separate written licence.

[1.0.0]: https://github.com/alex-hahn/fluidlab/releases/tag/v1.0.0
