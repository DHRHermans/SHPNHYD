# Handleiding SH PN · HYD

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

Het **Weg-stapdiagram** toont de cilinderbewegingen en spoelsignalen. Met **Meetprobe** kun je op aansluitpunten meten. Het tabblad **Oscilloscoop** toont de gekozen meetwaarden. Luchtdruk en oliedruk hebben verschillende schalen.

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
Klik onder de bibliotheek op **Ontdek de lessen en oefeningen** voor zeven Nederlandstalige opdrachten. Elke opdracht opent direct de passende schakeling. De knop **Motoren** filtert de componentbibliotheek, zonder het gezamenlijke werkvlak te veranderen.

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
