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
