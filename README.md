# FiveM Speler Lijst met AI Fake Detectie

Een geavanceerde website die alle spelers toont die verbonden zijn met een geselecteerde FiveM server, inclusief intelligente detectie van nep- of botspelers.
Beschikbaar hier: [https://igorovh.github.io/fivem-player-list/](https://igorovh.github.io/fivem-player-list/)

Deze tool gebruikt de officiële FiveM API endpoint voor nauwkeurige servergegevens:

```
https://servers-frontend.fivem.net/api/servers/single/serverId
```

## AI Fake Speler Detectie
Onze geavanceerde AI detecteert automatisch verdachte spelers gebaseerd op:
- **Hoge ping** (>500ms - mogelijk bots of nepaccounts)
- **Ontbrekende Steam ID** (echte spelers hebben vaak Steam gekoppeld)
- **Verdachte namen** (te kort, alleen cijfers, of woorden als "bot", "fake", "test")
- **Ongeldige ID ranges** (FiveM IDs zijn normaal 0-65535)
- **Zero ping zonder socials** (verdacht gedrag)

Nepspelers krijgen een opvallende rode markering met uitleg.

# Hoe Server ID Verkrijgen?
### Server Browser
Bezoek de [FiveM Server Browser](https://servers.fivem.net/) en klik op de gewenste server.  
Kijk naar de URL en kopieer het laatste deel, dat is de **Server ID**. Voorbeeld:  
`https://servers.fivem.net/servers/detail/vp4rxq` -> **vp4rxq**

### Client
Zoek de server in de FiveM client en klik erop.  
Aan de rechterkant zie je een "join URL", waar het laatste deel de **Server ID** is. Voorbeeld:
`cfx.re/join/vp4rxq` -> **vp4rxq**

![Server ID uitleg](https://github.com/igorovh/fivem-player-list/assets/37638480/cc4427f2-9fb0-4a9a-822b-db3344845b21)

## Gebruik
1. Voer een geldige Server ID in
2. Klik op zoeken of druk Enter
3. Bekijk de spelerslijst met automatische fake detectie
4. Gebruik favorieten om servers op te slaan
5. Controleer statistieken voor server analyse

## Moderne UI
- Donker thema met gradient achtergronden
- Vloeiende animaties en hover effecten
- Responsive design voor alle apparaten
- Moderne Inter lettertype
- Opvallende fake speler markeringen

Deze website is niet verbonden met FiveM of servers.  
Gemaakt door [igorovh](https://github.com/igorovh) met AI verbeteringen.
