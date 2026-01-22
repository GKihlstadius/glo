# Spelläge 3.0 — Quiz Planet Style

## Vision
Spelläge ska kännas som **Quiz Planet** — ett roligt, socialt multiplayer-spel där du och en vän svajpar blint på filmer och ser vem som gillar samma. Snabbt, engagerande, värt att betala för.

---

## DESIGN SYSTEM — KRITISKT!

### Appens Färgpalett (MÅSTE följas)
```typescript
COLORS = {
  bg: '#000000',       // Pure black - huvudbakgrund
  bgCard: '#0A0A0A',   // Near black - kort, modaler
  text: '#FFFFFF',     // Vit - huvudtext
  textMuted: '#666666', // Grå - sekundär text
  accent: '#FFFFFF',   // Vit - accenter
}
```

### Spelläge Accent (lila tema)
```typescript
SPELLAGE_COLORS = {
  primary: '#8B5CF6',    // Lila - Spelläge huvudfärg
  primaryLight: '#A78BFA', // Ljusare lila
  primaryDark: '#7C3AED',  // Mörkare lila
  success: '#22C55E',    // Grön - match/like
  warning: '#EAB308',    // Guld - trophy/celebration
  error: '#EF4444',      // Röd - pass/cancel
}
```

### Quiz Planet Design-principer
1. **Mörkt tema** - Samma som resten av appen (pure black)
2. **Lila accenter** - Spelläge har lila som signatur
3. **Stora, tydliga knappar** - Lätta att trycka på
4. **Animationer** - Smooth, snabba, celebratory
5. **Confetti/Sparkles** - Vid matcher och vinster
6. **Progress indicators** - Tydliga rundor/steg
7. **Avatar/ikoner** - Visa spelarna visuellt

### UI-komponenter ska vara ENHETLIGA med:
- Samma border-radius som MovieCard (16-24px)
- Samma skuggor/elevation
- Samma typografi (system fonts, samma storlekar)
- Samma spacing (8px grid)
- Samma animationstiming (spring config)

### FÖRBJUDET:
- ❌ Vita bakgrunder
- ❌ Ljusa teman
- ❌ Andra accentfärger än lila i Spelläge
- ❌ Inkonsistenta border-radius
- ❌ Olika font-styles

---

## PRIORITY ORDER
1. **Together Mode** (multiplayer) — Release-blocking
2. **Trailer Integration** — Release-blocking  
3. **Algorithm Polish** — High priority
4. **Solo Mode Polish** — Medium priority

---

## TOGETHER MODE (Quiz Planet Style)

### Invite Flow
Som Quiz Planet: Tryck "Together" → Få en unik kod + länk → Dela via:
- **Share sheet** (iMessage, WhatsApp, etc)
- **QR-kod** som vännen scannar
- **Manuell kod-inmatning** som backup

### Waiting Room
- Visa din avatar/namn
- Visa kod prominent: `ABC123`
- Animerad "Waiting for friend..." text
- QR-kod synlig
- Cancel-knapp

### Join Flow
- Deep link: `glo://join/ABC123`
- Alternativt: Manuell kod-inmatning på /join-screen
- Validera kod → Anslut till session → Båda ser "Ready!"

### Synchronized Gameplay
- **Samma 7 filmer** för båda spelare (genereras av host)
- **Blind mode**: Titlar dolda för båda
- **Independenta swipes**: Varje spelare svajpar själv
- **Real-time sync**: Se när motståndaren svajpat (ikon/animation)
- **Round timer**: Valfritt, 15-30 sek per film (som Quiz Planet)

### Match Detection
- Efter varje runda: Jämför swipes
- Om båda gillar samma film → **MATCH!**
- Celebration: Confetti, haptics, sound
- Visa filmens titel + poster (reveal)

### End Game
- Visa alla matcher (0-7)
- Om 1+ match: "You found X movies you both want to watch!"
- Om 0 matcher: "No matches this time. Try again?"
- Stats: "You liked 4, Friend liked 3, Matches: 2"
- Play Again / Exit

### Technical Requirements
- **WebSocket/Realtime**: Supabase Realtime eller Firebase
- **Session state**: Synkad via realtime DB
- **Timeout**: Sessions expire efter 2h inaktivitet
- **Reconnect**: Hantera disconnect/reconnect gracefully

---

## TRAILER SYSTEM

### Krav
Trailers ska fungera som Netflix previews:
- Autoplay efter 900-1400ms delay
- Muted by default
- Stoppa DIREKT vid swipe
- Ingen fullscreen
- Ingen extern app

### Implementation för Spelläge
- Trailers ska fungera i BÅDE Solo och Together mode
- Samma persistent player-arkitektur som huvudfeedet
- Gate-systemet gäller fortfarande (50 lyckade autoplay)

### Web vs Native
- **Web**: YouTube embeds (begränsningar med autoplay)
- **Native**: expo-av med MP4/HLS (fungerar bättre)
- Fallback: Visa bara poster om trailer inte fungerar

---

## ALGORITHM — Feed Engine Polish

### Mål
Feeden ska kännas:
- **Fresh**: Inte samma filmer om och om igen
- **Intelligent**: Lär sig av swipes
- **Diverse**: Mix av genres, eror, popularitet
- **Never empty**: Alltid nya filmer att upptäcka

### Exposure Memory
- **Liked**: Visa aldrig igen i feed
- **Saved**: Visa aldrig igen i feed
- **Passed**: 24h cooldown, sedan gradvis återintroducera
- **Seen**: Spåra senaste 100 visade filmer

### Taste Signals
```
Like = +2 för genre, +1 för director, +0.5 för cast
Save = +3 för genre, +2 för director, +1 för cast  
Pass = -0.3 för genre (svag signal)
Spelläge match = +5 för genre (starkaste signalen)
```

### Bucket Distribution
```
60% Exploit (personalized recommendations)
30% Explore (nya genres/directors)
10% Wildcard (helt random, hidden gems)
```

### Diversity Rules
- Max 2 filmer i rad från samma genre
- Max 3 filmer i rad från samma årtionde
- Minst 1 film per 10 som är <5 år gammal
- Minst 1 film per 10 som är >20 år gammal (classic)

### Spelläge-specifik Algoritm
- 7 filmer ska vara **diverse** (olika genres)
- Undvik obscura filmer (min 1000 ratings)
- Prioritera filmer med bra posters
- Mix av nya releases och classics

---

## USER STORIES

### US-030: Together Mode - Invite Creation
**Som** användare  
**Vill jag** kunna skapa en Together-session och få en delbar kod  
**Så att** jag kan bjuda in en vän

**Acceptance Criteria:**
- [ ] "Together" knapp skapar ny session
- [ ] 6-teckens kod genereras (ABC123)
- [ ] Deep link genereras: glo://join/ABC123
- [ ] QR-kod genereras
- [ ] Share sheet öppnas med länk

### US-031: Together Mode - Waiting Room
**Som** host  
**Vill jag** se en waiting room medan jag väntar på min vän  
**Så att** jag vet att sessionen är aktiv

**Acceptance Criteria:**
- [ ] Visa kod prominent
- [ ] Visa QR-kod
- [ ] Animerad "Waiting..." text
- [ ] Cancel-knapp
- [ ] Auto-navigera när vän ansluter

### US-032: Together Mode - Join via Link
**Som** inbjuden  
**Vill jag** kunna klicka på en länk och joina direkt  
**Så att** det är enkelt att gå med

**Acceptance Criteria:**
- [ ] Deep link glo://join/CODE fungerar
- [ ] Fallback: Web URL med kod
- [ ] Validera kod finns och är aktiv
- [ ] Anslut till session
- [ ] Navigera till gameplay

### US-033: Together Mode - Manual Join
**Som** inbjuden  
**Vill jag** kunna skriva in koden manuellt  
**Så att** jag kan joina även om länken inte fungerar

**Acceptance Criteria:**
- [ ] Join-screen med kod-input (6 tecken)
- [ ] Validering i realtid
- [ ] Felmeddelande om ogiltig kod
- [ ] Anslut vid korrekt kod

### US-034: Together Mode - Synced Gameplay
**Som** spelare i Together mode  
**Vill jag** se samma filmer som min vän  
**Så att** vi kan jämföra våra val

**Acceptance Criteria:**
- [ ] Samma 7 filmer för båda
- [ ] Blind mode för båda
- [ ] Independenta swipes
- [ ] Indikator när motståndare svajpat
- [ ] Runda avancerar när båda svajpat

### US-035: Together Mode - Match Celebration
**Som** spelare  
**Vill jag** se en celebration när vi matchar  
**Så att** det känns belönande

**Acceptance Criteria:**
- [ ] Detektera match (båda liked samma)
- [ ] Confetti animation
- [ ] Haptic feedback
- [ ] Reveal filmtitel
- [ ] Kort paus innan nästa runda

### US-036: Together Mode - End Game Results
**Som** spelare  
**Vill jag** se slutresultatet efter alla rundor  
**Så att** jag vet vilka filmer vi båda gillade

**Acceptance Criteria:**
- [ ] Visa alla matcher
- [ ] Stats: "Du gillade X, Vän gillade Y, Matcher: Z"
- [ ] Trailer för första matchen (om gate passerar)
- [ ] Play Again / Exit knappar

### US-037: Trailer Integration in Spelläge
**Som** spelare  
**Vill jag** se trailers i Spelläge  
**Så att** jag kan bedöma filmer bättre

**Acceptance Criteria:**
- [ ] Samma trailer-arkitektur som huvudfeed
- [ ] Autoplay efter delay
- [ ] Stoppa vid swipe
- [ ] Poster fallback om trailer misslyckas

### US-038: Algorithm - Exposure Memory
**Som** användare  
**Vill jag** inte se samma filmer om och om igen  
**Så att** feedet känns fräscht

**Acceptance Criteria:**
- [ ] Liked/Saved aldrig visas igen
- [ ] Passed får 24h cooldown
- [ ] Spåra senaste 100 visade
- [ ] Persistera mellan sessioner

### US-039: Algorithm - Taste Learning
**Som** användare  
**Vill jag** att appen lär sig mina preferenser  
**Så att** rekommendationerna blir bättre

**Acceptance Criteria:**
- [ ] Like/Save/Pass påverkar taste profile
- [ ] Genre, director, cast viktas
- [ ] Spelläge-matcher ger starkast signal
- [ ] Taste profile persisteras

### US-040: Algorithm - Diversity
**Som** användare  
**Vill jag** se en mix av olika filmer  
**Så att** feedet inte blir monotont

**Acceptance Criteria:**
- [ ] Max 2 samma genre i rad
- [ ] Mix av nya och gamla filmer
- [ ] 10% wildcards (överraskningar)
- [ ] Aldrig samma film 2x inom 24h

---

## TECHNICAL STACK

### Realtime Sync (Together Mode)
**Option 1: Supabase Realtime**
```typescript
// Subscribe to session changes
const channel = supabase
  .channel(`session:${sessionId}`)
  .on('presence', { event: 'sync' }, () => {
    // Handle player presence
  })
  .on('broadcast', { event: 'swipe' }, (payload) => {
    // Handle opponent swipe
  })
  .subscribe()
```

**Option 2: Firebase Realtime Database**
```typescript
// Listen to session
const sessionRef = ref(db, `sessions/${sessionId}`)
onValue(sessionRef, (snapshot) => {
  // Handle session updates
})
```

### Deep Linking
```typescript
// expo-linking
import * as Linking from 'expo-linking';

const url = Linking.createURL('join', {
  queryParams: { code: 'ABC123' }
});
// glo://join?code=ABC123
```

### QR Code
```typescript
// react-native-qrcode-svg
import QRCode from 'react-native-qrcode-svg';

<QRCode value={joinUrl} size={200} />
```

---

## SUCCESS METRICS

| Metric | Target |
|--------|--------|
| Together sessions started | 100+/day |
| Session completion rate | >70% |
| Match rate | 2+ per session avg |
| Return rate (play again) | >40% |
| Trailer autoplay success | >90% (native) |
| Feed freshness | <5% repeats within 24h |

---

## NOTES FOR RALPH

1. **Start with US-030 to US-033** (invite flow) — detta är core
2. **Realtime sync** behöver backend-beslut (Supabase vs Firebase)
3. **Trailers i Spelläge** återanvänd befintlig arkitektur
4. **Algoritm-polish** kan göras parallellt
5. **Testa på native** — web har begränsningar

Lycka till! 🎮
