# Handleiding SH TechniekLab

## Een schakeling tekenen

Klik **Nieuw** voor een leeg werkvlak. Kies in de bibliotheek **Alles**, **Pneumatica**, **Hydraulica** of **Elektrisch**. De filters veranderen alleen wat de bibliotheek toont: ze maken geen afzonderlijk werkvlak. Je kunt dus alle vakgebieden in één tekening gebruiken.

Sleep een component naar het werkvlak, of klik op een component in de bibliotheek. Klik op de geplaatste component om de eigenschappen te wijzigen. Met **R** draai je de selectie; met **Delete** verwijder je die.

Sleep van het ene aansluitpunt naar het andere om een leiding of draad te tekenen. Aansluitpunten hebben een type: lucht, olie of elektrisch. Verschillende typen kun je niet rechtstreeks verbinden.

## Elektrisch bediende hydraulica

Zoek bij **Hydraulica → Richtingsventielen** het elektrisch bediende 4/3-ventiel. De spoelen zijn herkenbaar aan de vierkantjes met schuine lijn. In het eigenschappenpaneel staan **Spoel links** en **Spoel rechts**, standaard Y1 en Y2.

Plaats een elektrische **Ventielspoel** vanuit de elektrische bibliotheek. Geef de spoel dezelfde aanduiding als de gewenste ventielzijde. Sluit de spoel via een drukknop, relaiscontact of sensor aan tussen +24 V en 0 V.

De koppeling is: elektrisch circuit → ventielspoel Y1/Y2 → hydraulisch ventiel → oliedruk op cilinderpoort A/B → beweging.

Bij twee gelijktijdige spoelsignalen gaat dit 4/3-model naar de middenstand. Gebruik in oefeningen bij voorkeur een elektrische vergrendeling als beide richtingen bediend kunnen worden.

## Eindschakelaar of naderingssensor aan een cilinder koppelen

1. Plaats een pneumatische of hydraulische cilinder.
2. Plaats een elektrische eindschakelaar, reedcontact of naderingssensor.
3. Selecteer die sensor.
4. Kies rechts onder **Cilinder** de gewenste cilinder. De lijst vermeldt de aanduiding en het soort cilinder.
5. Stel **Positie** in: 0 = volledig ingeschoven, 1 = volledig uitgeschoven, 0,5 = halverwege.
6. Het **Schakelvenster** bepaalt de marge rond de ingestelde positie.
7. Sluit de elektrische sensor aan in het stuurcircuit.

De sensoren zijn didactisch gemodelleerd als positieafhankelijke contacten. De keuze in de software betekent niet dat elk fysiek sensortype zonder aanpassing op elke echte cilinder kan worden gemonteerd.

Een draad loopt naar de sensor, niet naar de hydraulische poort op de cilinder. De koppeling met de beweging maak je via het keuzemenu.

## Simuleren en meten

**Start** of de spatiebalk start en pauzeert de simulatie. **Stop** of Escape zet de simulatie terug. Houd drukknoppen tijdens de simulatie ingedrukt om ze te bedienen. Klik op vergrendelende knoppen om ze om te schakelen.

Het **Weg-stapdiagram** toont de cilinderbewegingen en spoelsignalen. Met **Meetprobe** kun je op aansluitpunten meten. Via **Analyse → Oscilloscoop** open je de gekozen meetwaarden in een los venster. Luchtdruk en oliedruk hebben verschillende schalen.

## Bewaren

Kies **Export → Schakelschema (JSON)** om een bewerkbare tekening te bewaren. Gebruik **Import** om die terug te openen. Afbeeldingen en PDF-bestanden zijn bedoeld om af te drukken of in een cursus op te nemen. Alleen JSON bewaart de bewerkbare schakeling.

Een gewijzigde tekening wordt niet automatisch als bestand opgeslagen. Exporteer voor je het tabblad sluit. De browser onthoudt wel bepaalde paneel- en bibliotheekinstellingen.

## Voorbeelden en beperkingen

Het menu **Voorbeeld laden** bevat pneumatische, hydraulische, elektropneumatische en elektrohydraulische voorbeelden. De oorspronkelijke berekeningsmodellen en modelgrenzen van FluidLab blijven behouden. Rechtstreekse import van de aangeleverde FluidSIM `.ct`-bestanden is niet inbegrepen.

## Gemengde oefening: pneumatische vrijgave voor elektrohydraulica

Kies **Voorbeeld laden → Gemengd: pneumatische vrijgave voor elektrohydraulica**.
Je kunt ook `examples/gemengd-pneumatische-vrijgave.json` importeren.

1. Klik **Start**. Houd elektrische drukknop **S1** ingedrukt: de hydraulische cilinder blijft ingeschoven zolang **P1** niet uitgeschoven is.
2. Laat S1 los. Klik de vergrendelende pneumatische handhefboom **P-S1** aan en wacht totdat de enkelwerkende cilinder **P1** volledig uitgeschoven is.
3. Sensor **B2** sluit. Houd nu **S1** ingedrukt: spoel **Y1** bedient het hydraulische ventiel en de hydraulische cilinder schuift uit.
4. Schakel P-S1 met een tweede klik uit: P1 veert terug, B2 opent en het hydraulische ventiel centreert, ook als S1 nog ingedrukt is.
5. Laat S1 los en houd **S2** ingedrukt om de hydraulische cilinder weer in te schuiven. Hiervoor is B2 niet nodig.

Lucht, olie en elektrische stroom hebben eigen leidingen op hetzelfde werkvlak.
B2 koppelt de pneumatische positie aan de elektrische hydrauliekbesturing; de vloeistofcircuits zijn niet onderling verbonden.
Dit is een didactische vrijgave, geen gevalideerde veiligheidsbesturing voor echte machines.

## Het lichte techniekatelier en de lessen

De interface gebruikt het eigen **Licht atelier**-thema: witte panelen, een warm tekenblad en blauwgroene bediening. De rode kleur van bekrachtigde elektrische stuurdraden blijft een simulatiesignaal.
Klik onder de bibliotheek op **Ontdek de lessen en oefeningen** voor zestien Nederlandstalige opdrachten. Elke opdracht opent direct de passende schakeling. De knop **Motoren** filtert de componentbibliotheek, zonder het gezamenlijke werkvlak te veranderen.

## Industriële motorschakelingen

De bibliotheek **Motoren → Motorschakelingen** bevat:

- Driefasenvoeding Q1, met instelbare fase-uitval.
- Contactorspoel KM1 op 24 V DC: aansluitingen `a`/`b`, getekend als A1/A2.
- Drie hoofdcontacten: L1/L2/L3 naar T1/T2/T3. De aanduiding moet gelijk zijn aan de contactorspoel.
- Een driefasenmotor M1 met U/V/W, modeltoerental en instelbare belasting.
- Thermisch relais F1 met NC-contact 95–96 (`a`/`b`) en resetbediening. Koppel het via **Bewaakte motor** aan M1.
- Een 24 V-gelijkstroommotor M2 voor een eenvoudige transportbandoefening.

### Direct starten

Laad **Motor: direct starten met zelfhouding en thermische beveiliging**. Klik Start en druk S1 kort in. Spoel KM1 trekt aan; het parallelle KM1-maakcontact houdt de spoel bekrachtigd na loslaten. De hoofdcontacten sluiten en M1 draait rechtsom. S2 onderbreekt de zelfhouding. Na loslaten van S2 is een nieuwe startpuls nodig.

S0 is een vergrendelende noodstop: klik om uit te schakelen en opnieuw om te ontgrendelen. Ontgrendelen start de motor niet vanzelf wanneer de startknop losgelaten is. Een ingedrukte startknop blijft een startcommando; een bewaakte herstartblokkering is niet geïmplementeerd.

### Omkeersturing

Laad **Motor: omkeersturing met elektrische en mechanische vergrendeling**. S1 start rechtsom via KM1; S3 start linksom via KM2. Stop eerst met S2 voor een richtingswissel. De KM2-verbreker in de KM1-stuurkring en de KM1-verbreker in de KM2-stuurkring blokkeren de andere richting. De hoofdcontacten hebben daarnaast een instelbare mechanische vergrendeling. Twee verwisselde fasen bepalen de omgekeerde richting.

### Thermische uitschakeling en storingen

Selecteer M1 en stel **Belasting / nominale stroom** in op 2. F1 verzamelt dan thermische belasting en opent zijn NC-contact. De zelfhouding valt weg. F1 blijft uitgeschakeld na afkoeling. Verlaag de belasting, wacht circa vijf simulatieseconden en klik op F1 om te resetten. Start daarna opnieuw met S1 of S3.

Op Q1 kun je één fase laten uitvallen. M1 meldt **Fase-uitval** en krijgt geen aandrijving. Een verbinding tussen verschillende fasen wordt bij de motor als **Faseconflict** getoond. De simulator berekent hierbij geen kortsluitstroom. Via **Storingssimulatie** kun je een contactorspoel onderbreken, hoofdcontacten vastlassen of een voeding uitschakelen.

### Betekenis van de hoofdkring

De paarse gestreepte draden zijn functionele driefasenverbindingen, gescheiden van lucht, olie en de numeriek berekende 24 V-stuurkring. Zonder drie verschillende fasen uit dezelfde bron krijgt de motor geen aandrijving. Het aangegeven toerental volgt een vereenvoudigde eerste-ordebenadering. De stroomschatting is nominale stroom × belasting; er is geen berekende aanloopstroom, slip, koppelcurve of AC-vermogen. Fase-uitval is geen berekening van een nog draaiende motor op twee fasen. Het thermisch relais gebruikt een didactische I²t-benadering, geen gecertificeerde uitschakelklasse.

De DC-motor is een weerstand van 24 Ω met een spanningsafhankelijk modeltoerental en uitloop. Tegen-EMK, koppel, inductie en regeneratief remmen worden niet berekend. De probe meet hier de stroom door die modelweerstand.

Ster-driehoek, frequentieregelaars, echte motorwikkelingen, PE-aarding en automatische beveiligingsselectie zijn nog niet geïmplementeerd. Gebruik de modellen om stuurkringen te leren begrijpen, niet om echte motorbeveiliging te dimensioneren.

## De nieuwste websiteversie herkennen

Open de website `https://dhrhermans.github.io/SHPNHYD/`, niet de GitHub-bestandsweergave of de oorspronkelijke FluidLab-site. Onder de componentbibliotheek staat **Licht atelier · v…** met de versie van de gepubliceerde bestanden. Bij lokaal ontwikkelen staat daar **Ontwikkelversie · Licht atelier**. Gebruik **Motoren** om de zes motorcomponenten te tonen; klik op een component om die in het midden van het werkvlak te plaatsen.

Voor updates moet **Settings → Pages → Source** op **GitHub Actions** staan en moet de nieuwste uitvoering **GitHub Pages** afgerond zijn. De groene **CI**-workflow controleert alleen tests. De publicatie gebruikt per versie eigen CSS- en JavaScript-paden; eenmalig hard vernieuwen kan nodig zijn wanneer een oud HTML-document nog in de browsercache staat.

## Werkbladen voor GRAFCET en PLC Ladder

Boven het tekenveld staan drie werkbladen: **Schakeling**, **GRAFCET tekenen** en **PLC Ladder**. Ze horen bij hetzelfde document: je verliest geen componenten of programma's bij het wisselen. De twee besturingseditors gebruiken de volledige hoogte van het centrale werkvlak. Via **Schakeling** kun je tijdens de simulatie de drukknoppen bedienen en daarna terugkeren om de uitvoering te volgen.

Rechts in de werkbladbalk kies je de **actieve besturing**: **Handmatig / elektrisch**, **GRAFCET** of **PLC Ladder**. Alleen de gekozen besturing schrijft softwarecommando's. De andere programma's blijven bewaard. Wisselen van besturing stopt en reset de simulatie. De gewone elektrische en vloeistofberekeningen blijven actief; een softwarecommando vervangt de bekrachtiging voor de beschreven uitgangsaanduiding. Dit is een virtuele I/O-koppeling, geen fysieke PLC-bedrading.

### GRAFCET tekenen

1. Open **GRAFCET tekenen** en klik **Schema maken**. Dit maakt een beginstap en kiest GRAFCET als besturing.
2. Klik **+ Stap** en daarna op het tekenvlak om een stap te plaatsen. Sleep een stap om die te verplaatsen.
3. Sleep vanaf het ronde aansluitpunt onder een stap naar een andere stap om een overgang te maken.
4. Selecteer de overgang en vul een voorwaarde in, bijvoorbeeld `S1 * B0`, `B1`, `/S2` of `t/X1/2s`.
5. Selecteer een stap, klik **+ Actie** en geef de gewenste spoel op: bijvoorbeeld `Y1`, `Y2` of `KM1`. De keuzelijst stelt aanduidingen uit de schakeling voor.
6. Kies een continue actie (actief zolang de stap actief is) of een opgeslagen toewijzing. Begin bij voorkeur met continue acties.
7. Start de simulatie. Actieve stappen en overgangen worden gemarkeerd. Teruglussen worden naast de stappen getekend en blijven met hun overgang in beeld.

### PLC Ladder tekenen

1. Open **PLC Ladder** en klik **+ Netwerk**.
2. Vul de contactaanduiding in, bijvoorbeeld `S1` of `B0`, en kies maak- of verbreekcontact.
3. **+ Contact** voegt een contact in serie toe (EN). **+ Parallelle tak** maakt een alternatieve tak (OF). Alle takken van een netwerk sturen dezelfde uitgang.
4. Vul rechts de uitgang in, bijvoorbeeld `Y1`, `Y2`, `KM1` of een interne merker `M_run`.
5. Kies een normale uitgang, **Set**, **Reset**, **Inschakelvertraging** (TON) of **Uitschakelvertraging** (TOF). Bij een timer geef je de vertraging in seconden op. Gebruik een merker als timeruitgang wanneer een volgend netwerk die timerwaarde moet lezen.
6. Verplaats netwerken met de pijlen omhoog/omlaag. De PLC voert ze van boven naar beneden uit; een later netwerk ziet waarden die eerder in dezelfde scan geschreven zijn. Bij meerdere schrijvers naar dezelfde uitgang is de laatste uitgevoerde toewijzing bepalend.
7. Selecteer **PLC Ladder** als actieve besturing en klik **Start**. Groene contacten en takken tonen de toestand bij evaluatie; de groene uitgang toont het PLC-commando. De live signalen tonen actuele niveaus.

Het bewerken van Ladder of GRAFCET-logica stopt en reset de simulatie, zodat geen verouderd programma blijft uitvoeren. Een lege of ongeldige tak verhindert starten totdat de fout is hersteld. Een gewone uitgang schrijft elke scan waar/onwaar. Set schrijft alleen bij een geleidende tak een 1; Reset schrijft dan een 0. Stop/reset van de simulator wist merkers en timers.

**NC-signalen:** S2 (NC-stop), S0 (noodstop) en F1 (thermisch NC-contact) leveren 1 zolang hun contact gesloten/gezond is. Gebruik daarvoor in Ladder doorgaans een maakcontact. Een verbreekcontact in het programma keert het niveau om. In GRAFCET betekent `/S2` dus dat het stopcontact geopend is.

### Dezelfde besturing voor lucht, olie en motoren

De koppeling gebeurt via aanduidingen, niet via het type vloeistof. Een elektrische eindschakelaar B0/B1 kan een pneumatische of hydraulische cilinder bewaken. Een uitgang Y1/Y2 bedient het overeenkomstig benoemde ventiel; KM1 bedient de contactor. Een virtueel aangestuurde contactorspoel blijft uitgeschakeld bij de fout **Spoel onderbroken**. Mechanische vergrendeling en hoofdkringmodellen blijven gelden.

Het voorbeeldmenu bevat voor zowel **GRAFCET** als **PLC Ladder**:

- Een pneumatische cilinder die na een startpuls automatisch uit- en teruggaat.
- Een hydraulische cilinder met Y1/Y2 en B0/B1 voor een automatische uit-/inschuifcyclus.
- Een elektrische motor met start, stop, noodstop en thermisch relais.

Exporteer als **Schakelschema (JSON)** om de tekening, GRAFCET, Ladder en besturingskeuze samen op te slaan. Ook undo/redo bewaart het ladderprogramma. De Ladder-editor ondersteunt contacten, parallelle takken, spoelen, set/reset en TON/TOF. Hij omvat nog geen grafische tellers, analoge instructies, subprogramma's of communicatie met een echte PLC.

## Meer tekenruimte met losse analysevensters

Het schema gebruikt nu alle ruimte onder de werkbladbalk. Er staat geen vast analysepaneel meer onderaan.

Open boven het werkvlak **Analyse** en kies **Weg-stapdiagram**, **Oscilloscoop** of **Onderdelenlijst**. Elk hulpmiddel opent als een los venster binnen de toepassing. Je kunt meerdere vensters tegelijk gebruiken en ondertussen de schakeling blijven bedienen.

- Sleep de titelbalk om een venster te verplaatsen.
- Sleep de hoek rechtsonder om het formaat aan te passen.
- Klik op **□** of dubbelklik op de titelbalk om te vergroten; klik opnieuw om het vorige formaat te herstellen.
- Klik op **×** om te sluiten. Escape sluit het venster wanneer de toetsenbordfocus erin staat, zonder de simulatie te stoppen.
- Positie en formaat worden lokaal per browser onthouden. Bij opnieuw openen van de toepassing beginnen de vensters gesloten, zodat het tekenvlak vrij blijft.

Een meetprobe plaatsen opent de oscilloscoop automatisch. Metingen blijven tijdens de simulatie opgenomen worden wanneer hun venster gesloten is; opnieuw openen toont de beschikbare opname. CSV-export, cursors, triggerinstellingen en vastzetten blijven beschikbaar in de oscilloscoop. Ook het weg-stapdiagram en de onderdelenlijst houden hun exportknoppen.

**GRAFCET tekenen** en **PLC Ladder** blijven aparte grote werkbladen. De analysevensters zijn ook boven die werkbladen beschikbaar en veranderen de actieve besturing niet.

## Ladder tekenen met de symboolbalk

De Ladder-editor heeft een eigen gereedschapsbalk met **Selecteren**, **Maakcontact**, **Verbreekcontact**, **Uitgang**, **Set**, **Reset**, **TON** en **TOF**.

- Kies een contacttype en klik op een rond **+**-invoegpunt tussen de symbolen. Je kunt het contact ook van de balk naar dat punt slepen.
- Klik met het geselecteerde contactgereedschap op een bestaand contact om het type te wijzigen, met behoud van zijn aanduiding.
- Sleep een uitgangs- of timergereedschap naar de uitgang rechts om het spoeltype te veranderen.
- Met **Selecteren** klik je op een symbool. De aanduiding en type-instellingen verschijnen bij de selectie; een timer toont ook de tijdinstelling.
- Delete verwijdert een geselecteerd contact of wist de uitgang. In een tekstveld blijft Delete gewone tekstbewerking. De knop **Verwijderen** boven een netwerk verwijdert het hele netwerk.
- **+ Parallelle tak** maakt een alternatief pad. De getekende bedrading verbindt de contacten met de voedingsrails en de gezamenlijke uitgang. Brede netwerken kun je horizontaal verschuiven.

Dit is een eigen uitwerking van de tekenbediening binnen SH TechniekLab; er is geen PLCioSim-code ingebouwd. De simulator en de koppeling naar lucht, olie en motoren blijven dezelfde.

## Schema's afdrukken met het SH-logo

Open het gewenste werkblad (**Schakeling**, **GRAFCET tekenen**, **PLC Ladder** of **Machinebeeld**) en kies **Export → Afdrukken (met SH-logo)**. Je kunt ook **Ctrl+P** of **Cmd+P** gebruiken.

Het afdrukvoorbeeld bevat alleen het schema, met het **SH-logo**, de schematitel, datum en paginanummer. Knoppen, bibliotheek en eigenschappenpanelen worden niet afgedrukt. Klik **Afdrukken / PDF bewaren** om de printer te kiezen of het bestand via de browser als PDF te bewaren. Het standaardformaat is A4 liggend; printerinstellingen kunnen dit aanpassen.

Een schakelschema, GRAFCET en machinebeeld krijgen elk één passend geschaald blad. Bij Ladder krijgt ieder netwerk een eigen blad, zodat parallelle takken en lange netwerken volledig worden meegenomen, ongeacht de scrollpositie in de editor. Zeer grote netwerken worden verkleind; controleer de leesbaarheid in het afdrukvoorbeeld. Het SH-logo staat ook op iedere pagina van de bestaande **Export → Tekening (PDF)**, inclusief het onderdelenblad.

## Ventielen aanpassen

Selecteer een richtingsventiel en kies rechts **Ventieluitvoering**. Beschikbare families zijn pneumatische 3/2- en 5/2-ventielen en hydraulische 4/3-ventielen. Je kunt binnen de aangeboden varianten de bediening, terugstelling/geheugen en middenstand kiezen. Een hydraulisch 4/3-ventiel biedt gesloten, zweef- en tandemmiddenstand met handhefboom of elektrische spoelen.

Aanduiding, bestaande spoelnamen en gemeenschappelijke instellingen blijven behouden. Als aangesloten pilotpoorten bij een variant zouden vervallen, weigert de editor de wijziging totdat je die leidingen zelf loskoppelt. Er worden geen leidingen stilzwijgend verwijderd. Een variantwissel herstelt de standaard interne verbindingen en reset de simulatie.

Onder **Extra: interne verbindingen tekenen** kies je een stand en klik je twee bestaande poorten aan. Dit voegt een verbinding toe; dezelfde twee poorten opnieuw aanklikken verwijdert die verbinding. Niet verbonden poorten zijn afgesloten. De tekening én de lucht-/oliestroming gebruiken de aangepaste verbindingen. Bewaren als JSON en undo/redo behouden deze instellingen. Vrij nieuwe poorten, aantallen standen of complete componenttypen maken is nog niet inbegrepen.

## Simulatie op één scherm of een tweede monitor

Open het tabblad **Machinebeeld**. De bovenste simulatiebalk bevat twee weergaven:

- **Groot simulatiescherm** gebruikt het hele werkvlak zonder bibliotheek of eigenschappenpaneel. Machine en aandrijvingen staan links, de fysieke bediening en ventielen rechts. **Terug naar werkblad** herstelt de editor.
- **Extra venster** opent een apart browservenster. Verplaats dit naar je tweede monitor en maximaliseer het, of kies daar **Volledig scherm**. Het hoofdvenster blijft beschikbaar voor je schema. **Terug naar hoofdvenster** sluit het extra venster.

Elke weergave bevat **Start/Pauze**, **Stop / reset**, tempo en simulatietijd. Alle vensters gebruiken hetzelfde schema en dezelfde simulatie. Een knop bedienen in het extra venster heeft dus onmiddellijk effect op het schema. Onderdelen toevoegen of een ander schema laden werkt ook door in het extra venster.

Momentane knoppen worden vrijgegeven bij focusverlies of sluiten. Het sluiten van het extra venster wist je schema niet. Bij veel componenten kun je het bedieningspaneel apart verschuiven; op smallere schermen staan de panelen onder elkaar.

Als de browser het extra venster blokkeert, verschijnt een melding. Sta pop-ups voor deze website toe of gebruik **Groot simulatiescherm**. Je kunt de grote weergave ook rechtstreeks openen met `?workspace=machine&screen=focus` achter de website-URL.

## Drukknoppen en ventielen bedienen in Machinebeeld

Onder **Bediening en ventielen uit mijn schema** verschijnen automatisch de drukknoppen, noodstop, handventielen, elektrische/pneumatische stuurventielen, sensoren, spoelen en lampen uit je schema. Onder **Voedingen en overige schemaonderdelen** vind je de overige componenten. Je ziet fysieke afbeeldingen: ronde drukknoppen, een rode paddenstoelnoodstop, metalen ventielblokken met hefboom, drukknop of spoelen, sensoren en lampen. Druk rechtstreeks op de afbeelding om het onderdeel te bedienen. Standen, indicatielampjes en meetwaarden volgen dezelfde simulatie als het schema.

- **Indrukken (vasthouden)** bedient een momentane knop zolang je de muis/vinger of Spatie/Enter ingedrukt houdt. Loslaten, annuleren, focusverlies en een ander tabblad openen geven de knop vrij.
- Vergrendelende knoppen en ventielen blijven in hun gekozen toestand staan. Druk opnieuw om vrij te geven. Bij de noodstop heet dit **Noodstop ontgrendelen**.
- Een hydraulisch 4/3-handventiel heeft **Links vasthouden** en **Rechts vasthouden**. Loslaten laat de hefboom terugveren naar de middenstand.
- Bij een instelventiel kun je de afgebeelde draaiknop naar rechts/omhoog slepen om de instelling te verhogen, of naar links/omlaag om te verlagen. Met de schuiven wijzig je eveneens smooropeningen en drukinstellingen. Dit verandert dezelfde componentinstelling als het eigenschappenpaneel en wordt met je schema opgeslagen; ongedaan maken is beschikbaar.
- Automatisch bediende ventielen krijgen geen rechtstreekse handbediening. Ze schakelen via hun echte spoel- of stuursignalen. Eindstandsensoren blijven door hun gekoppelde cilinder bediend.

Handbediening start de simulatie als die nog niet loopt. Het geeft een fysieke input aan het model en omzeilt geen bedrading, defecten of programmavoorwaarden. Afdrukken neemt de fysieke afbeeldingen mee. In het schemablad blijven de technische symbolen behouden.

## Alle cilinders en motoren zichtbaar simuleren

Open **Machinebeeld** nadat je onderdelen in **Schakeling** hebt geplaatst. Onder **Aandrijvingen uit mijn schema** verschijnen automatisch:

- Pneumatische enkelwerkende en dubbelwerkende cilinders, ook met doorlopende zuigerstang.
- Hydraulische cilinders.
- Driefasenmotoren en 24 V-gelijkstroommotoren.

Je hoeft hiervoor geen booropdracht te laden of een machineopstelling aan te maken. Start de simulatie met de bovenste Start-knop en bedien je schema, GRAFCET of Ladder. Elk beeld leest dezelfde berekende toestand: zuiger en stang bewegen mee met de cilinderslag, druk wordt per poort weergegeven en de motoras draait volgens het modeltoerental en de draairichting. Zonder voeding of juiste aansluitingen ontstaat geen beweging.

Bij een samengestelde booropstelling worden de gekoppelde cilinders ook in het procesbeeld getekend. De klemcilinder is met zijn zuigerstang aan de bewegende klembek verbonden; de boorcilinder toont de stang en verbinding naar de boorvoeding. De tags staan erbij. De afbeeldingen volgen dezelfde slag als de losse cilinderbeelden. Dit toont de koppeling, maar berekent geen nieuwe mechanische overbrenging of snijkrachten.

Via **Afdrukken (met SH-logo)** worden ook de losse aandrijvingen opgenomen.

## Machinebeeld: zelf een opstelling bouwen

1. Kies bij de voorbeelden **Machinebeeld: zelf een opstelling bouwen** en open het tabblad **Machinebeeld**. Je krijgt een leeg schema, een leeg procesbeeld en geen ingevulde GRAFCET of Ladder. Heb je al een eigen schema zonder machinebeeld? Klik daar op **Zelf een machineopstelling maken**; je schema blijft behouden.
2. Plaats **Kolomboor**, **Bankschroef** en **Werkstuk** met de knoppen in de opbouwmodus. Sleep elk onderdeel in het beeld. Selecteer een onderdeel om X/Y in te stellen of het te verwijderen. Elk van deze drie onderdelen kan eenmaal in deze opstelling staan.
3. Teken in **Schakeling** zelf de cilinders, ventielen, motor, voeding en schakelaars met hun verbindingen. Voor pneumatiek en hydrauliek gebruik je dezelfde koppelingen: klemcilinder, boorcilinder en een driefasen- of DC-motor. De ingeschoven boorcilinder is de bovenste boorstand.
4. Ga terug naar **Machinebeeld → Opstelling bewerken**. Kies of typ de tags van jouw klemcilinder, boorcilinder en spindelmotor. Stel daarnaast de spoeltags van beide ventielen en de tag van de motorcontactor in. Voor handbediening gebruikt het beeld deze uitgangstags. Voor een fysieke PLC-uitgang bedraad je Q naar de betreffende spoel; de poortnaam Q0 is niet de tag van de spoel.
5. Koppel desgewenst je start- en stopknop en benoem de virtuele signalen voor werkstuk aanwezig en spindel stil. De startknop wordt kort ingedrukt door **Start automatische cyclus**; de stopknop moet een NC-contact zijn. Een lege koppeling bedient niets. Eindstandsensoren voor de cilinders plaats en koppel je zelf in het schema.
6. Teken je eigen GRAFCET of Ladder en kies de bijbehorende oefenstand. **Oefenhulp** staat bij zelfbouw standaard uit: jouw eigen besturing bepaalt alle voorwaarden en vergrendelingen. Met oefenhulp aan worden de voorwaarden uit het lesvoorbeeld ook bewaakt door het procesbeeld.
7. Kies **Klaar met opbouwen** om te bedienen. Via **Export → Schakelschema (JSON)** bewaar je schema, machineonderdelen, posities, koppelingen en programma samen. Open dat bestand later opnieuw. De opbouw ondersteunt ongedaan maken/opnieuw.

De onderdelen zijn voorgetekende bouwstenen die je zelf samenstelt. Posities veranderen het beeld, maar vormen geen mechanische botsings- of uitlijningsberekening. Er wordt geen automatische boorcyclus gegenereerd. **Nieuwe lege opstelling** wist alleen het procesbeeld en zijn koppelingen; je schema en programma blijven behouden.

## Machinebeeld: van handmatig naar automatisch boren

Voor het uitgewerkte lesvoorbeeld kies je **Machinebeeld → Open uitgewerkt lesvoorbeeld**, of laad je het voorbeeld **Machinebeeld: bankschroef en kolomboormachine**. Het procesbeeld is gekoppeld aan `A_KLEM`, `A_BOOR` en `M_BOOR` uit het schema. Eindschakelaars bewaken de cilinderstanden. Het boorbeeld wordt niet los van de simulatie afgespeeld.

### Handmatig oefenen

1. Klik **Klem sluiten** en wacht tot **Klem dicht** 1 aangeeft.
2. Klik **Spindel starten** en wacht op het toerental.
3. Klik **Boor omlaag**. Onderaan wordt de visuele boortijd opgebouwd.
4. Klik **Boor omhoog** en wacht op de bovenste eindstand.
5. Stop de spindel en wacht op stilstand.
6. Laat de klem los en verwijder of vervang het werkstuk.

De procesknoppen starten de simulatie wanneer dat nodig is. Didactische vergrendelingen blokkeren neergaande voeding zonder geklemd werkstuk en draaiende spindel. De klem blijft dicht zolang de boor niet boven is of de spindel nog draait. Meldingen tonen waarom een commando wordt geblokkeerd.

### Automatisch uitvoeren

Kies in het procesbeeld **Automatisch · GRAFCET** of **Automatisch · PLC Ladder**. Wisselen van besturingsstand reset de simulatie naar de beginsituatie. Klik **Start automatische cyclus**. De volgorde is: klemmen → spindel starten → boor neer → twee seconden boren → boor omhoog → spindel uit → wachten op stilstand → klem los.

Met **Stop cyclus** wordt de neergaande beweging onderbroken, de boor teruggetrokken en daarna pas vrijgegeven. **Stop vrijgeven** heft dit stopcommando op, maar start geen nieuwe cyclus. De algemene Stop-knop in de bovenbalk reset de gehele simulatie; gebruik voor de procesoefening de lokale stopknop.

In het schema staan de gebruikte cilinders, ventielen, motor en schakelaars. GRAFCET en Ladder zijn bewerkbaar en worden samen met het machinebeeld opgeslagen. `B_WERKSTUK` en `B_SPINDEL_STIL` zijn virtuele procesingangen. De boring is een tijdsindicatie, geen berekening van materiaalafname of snijkrachten. Dit is een vereenvoudigd onderwijsmodel, geen gecertificeerde machinebesturing.

## PLC- en GRAFCET-componenten fysiek bedraden

Onder **Elektrisch → Besturingsmodules** vind je een PLC-module en een GRAFCET-module met elk **8 ingangen, 8 uitgangen en 24 V-voedingspoorten**.

1. Verbind **L+** met +24 V en **M** met 0 V.
2. Sluit een drukknop of sensor aan tussen +24 V en een ingang `I0–I7`.
3. Verbind een uitgang `Q0–Q7` met een spoel of lamp en de andere kant van die belasting met M.
4. Selecteer de module en stel per poort de **programmanaam** in. Bijvoorbeeld `I0 → S1`, `I1 → B0`, `I2 → B1` en `Q0 → Y1`. Je kunt ook rechtstreeks I0/Q0 als programmanamen gebruiken.
5. Kies de overeenkomende actieve besturing en teken de voorwaarden/acties in GRAFCET of Ladder.

Gebruik **PLC: fysiek bedrade module met cilinder** of het GRAFCET-voorbeeld om de volledige aansluiting te bekijken. Een ingangsnaam die aan een modulepoort gekoppeld is, wordt uit de gemeten spanning gelezen. Een gekoppelde uitgang wordt naar de fysieke poort gestuurd: die bekrachtigt de spoel pas via de echte draad. Een losgekoppelde ingang of uitgang, ontbrekende L+/M of voedingsstoring wordt niet virtueel overbrugd.

Gebruik unieke programmanamen per poort en geen naam tegelijk voor in- en uitgang. Conflicten worden gemeld en de betrokken I/O wordt afgeschakeld. De module toont voeding en kanaalniveaus. De uitgangen zijn vereenvoudigde sourcing-uitgangen op 24 V DC, geen 400 V-motorvoeding. Gebruik bij motoren een contactorspoel tussen module-uitgang en M. Andere lucht- en olieactuatoren worden via hun elektrische ventielspoel bediend.

De virtuele koppeling blijft beschikbaar voor programma-aanduidingen die niet aan een fysieke modulepoort gekoppeld zijn, bijvoorbeeld interne merkers. De fysieke uitgang kan een scantick later doorwerken dan het logische commando.
