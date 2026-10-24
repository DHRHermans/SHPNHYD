# Referentieonderzoek en eigen uitwerking

De gebruiker leverde `Hydraulic-20260930T141214Z-1-001.zip` en `Pneumatic-20260930T141211Z-1-001.zip` aan. Deze bestanden zijn onderzocht als functionele referentie; ze zijn geen broncode van SH TechniekLab.

## Wat is bekeken?

- Hydrauliekarchief: 827 ZIP-vermeldingen, waaronder 733 `.ct`-bestanden, Windows-programma's en bibliotheken, `doc/Fl_sim_h.pdf` en een CHM-helpbestand. Oefenmappen bevatten onder meer TP501/502, TP601/602, GRAFCET en digitale techniek.
- Pneumatiekarchief: 994 ZIP-vermeldingen, waaronder Windows-programma's, component- en oefencircuits, `doc/fl_sim_p.pdf` en CHM-help. Oefenmappen bevatten onder meer TP101/102, TP111, TP201/202, GRAFCET en digitale techniek.
- De hydrauliekhandleiding beschrijft onder andere het koppelen van relais en contacten via aanduidingen (gedrukte pagina 111) en een 24 V-DC-motor voor didactische transportbanden (gedrukte pagina 272).
- De mappenstructuur onderscheidt componenten, stroompaden, actuatoren, sensoren, relais en oefenschakelingen. Er werd geen herbruikbare broncodelicentie aangetroffen in de bestandsnamen van de archieven.

## Wat is hiermee gemaakt?

Het eigen lesoverzicht `lessen.html` biedt zestien zelfstandig geschreven opdrachten: directe pneumatische bediening, afvoersmoring, elektrohydraulische eindstandbewaking, gemengde vrijgave, zelfhoudende motorbesturing, vergrendelde omkeersturing en een 24 V-transportband. De beschikbare eigen schakelingen zijn hiervoor gebruikt en uitgebreid. Zes aanvullende opdrachten behandelen GRAFCET en PLC Ladder voor pneumatiek, hydrauliek en elektrische motoren.

De transportbandoefening sluit aan bij het onderwerp DC-aandrijving in de referentiehandleiding. De nieuwe driefasenbesturing is een eigen uitbreiding; deze wordt niet gepresenteerd als een geïmporteerd FluidSIM-model. Broncode, symbolen en opdrachten zijn in deze repository geschreven. Simulatiegrenzen staan in de Nederlandse handleiding en in de interface.

## Wat is niet overgenomen?

Geen EXE-, DLL-, CHM-, PDF-, BMP-, WAV-, bibliotheek- of `.ct`-bestanden uit de twee archieven zijn aan de repository toegevoegd. Er is geen automatische import van FluidSIM-circuits geïmplementeerd. De oorspronkelijke licentie en auteursvermelding van de FluidLab-basis blijven behouden.

De PLCioSim-website was vanuit de ontwikkelomgeving niet toegankelijk. De nieuwe symboolbalk, invoegpunten en drag/drop-bediening zijn zelfstandig uitgewerkt op basis van de gebruikerswens. Een gevonden gelijknamige GitHub-repository is niet als officiële bron bevestigd en er is geen code uit overgenomen.

Machinebeeld en de fysiek bedrade controllerblokken zijn eigen uitbreidingen. SHIL is als afzonderlijke repository onderzocht; de toepassingen zijn via een link verbonden, niet samengevoegd.
