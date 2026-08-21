# FamilyFlow

**Samen sterk. Stap voor stap.**
Een slimme gezinscoach voor structuur, verbinding en zelfstandigheid.

FamilyFlow is een ondersteunende gezinscoach en geen medisch diagnostisch of behandelplatform.

---

## Snel starten

```bash
npm install
cp .env.example .env.local     # optioneel: zonder keys werkt alles ook
npm run dev
```

Open http://localhost:3000

De app start met een gevuld demogezin (Familie Dompig: Angelo, Kimberly, Kian 13, Khloe 9),
inclusief twaalf dagen historie. Je hoeft niets in te vullen om te kunnen demonstreren.

> Alleen `npm install` heeft internet nodig (en de eerste build voor het Inter-font).
> Daarna draait de app volledig lokaal, ook zonder AI-key.

## Demo-route (de flow uit de opdracht)

1. `/` — welkomscherm → **Bekijk het demogezin**
2. `/ouder` — "Goedemorgen, Angelo", bericht van Flow, ouder-check-in, gezinsoverzicht,
   FamilyFlow Insight en "wat kun jij vandaag doen?"
3. Wissel rechtsboven van gebruiker naar **Kian** → `/kind`
4. Vink een afspraak af → toast met punten en positieve feedback
5. `/kind/vandaag` — hele dag per categorie, dagritme bovenaan
6. `/kind/doelen` — punten, doelen en beloningen (tijd samen, zelf kiezen)
7. `/ouder/inzichten` — weekoverzicht zonder percentages, met inzicht van Flow
8. `/pilot` — pilotaanmelding en feedbackformulier

## Environment variables

| Variabele | Nodig | Toelichting |
|---|---|---|
| `AI_PROVIDER` | nee | `claude`, `openai` of `none` (standaard). Bepaalt welke provider de coach gebruikt. |
| `ANTHROPIC_API_KEY` | alleen bij `claude` | Server-side, komt nooit in de browser. |
| `ANTHROPIC_MODEL` | nee | Standaard `claude-sonnet-4-5`. |
| `OPENAI_API_KEY` | alleen bij `openai` | Server-side. |
| `OPENAI_MODEL` | nee | Standaard `gpt-4o-mini`. |
| `NEXT_PUBLIC_SUPABASE_URL` | nee | Leeg = localStorage-opslag. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | nee | Idem. |

Zonder AI-key valt Flow terug op de regelgebaseerde coach in `src/lib/ai/fallback.ts`.
Die is deterministisch, offline en gebruikt dezelfde toon en veiligheidsregels — de app
voelt daardoor compleet, ook in een demo zonder internet.

## Architectuur

```
src/
  app/
    page.tsx                  welkom / router naar het juiste dashboard
    onboarding/               7 stappen: rol, gezin, kinderen, intake, focus, profiel
    ouder/                    home · gezin · afspraken · inzichten · profiel
    kind/                     home · vandaag · samen · doelen · profiel
    coach/                    placeholder-dashboard voor begeleiders
    pilot/                    aanmelding + feedback
    api/coach/route.ts        AI-endpoint (POST) + providerstatus (GET)
    api/coach/profile/route.ts  coachprofiel na de intake
  components/                 CoachMessageCard, CheckIn, TaskCard, DayRhythm, ...
  components/ui/              Button, Card, Avatar, Progress, Badge, Modal, Toast, Skeleton
  lib/
    types.ts                  domeinmodel
    utils.ts                  datum-, punt- en voortgangsberekeningen
    demo-data.ts              demogezin + startset afspraken
    db/                       Repository-interface, localStorage- en Supabase-adapter
    store/                    React-context met write-through persistence
    ai/                       provider · claude · openai · prompts · safety · memory · context · fallback
    coach/                    rules engine (wanneer) + useCoach hook (wat)
supabase/schema.sql           JSONB-opslag voor 0.1 + genormaliseerd doelmodel + RLS
```

### Belangrijkste keuzes

**AI is provider-agnostisch.** `AIProvider` is de enige interface die de coachlogica kent;
`ClaudeProvider` en `OpenAIProvider` implementeren hem. Een derde provider is één bestand.

**Wanneer ≠ wat.** `lib/coach/rules.ts` bepaalt óf er een coachmoment mag komen (quiet hours,
maximaal 3 per dag, minimaal 90 minuten ertussen, geen herhaling bij uitblijvende reactie,
escalatie naar de ouder pas na drie keer op rij). Pas daarna bepaalt de AI-laag wát er gezegd wordt.

**Punten worden afgeleid, niet opgeslagen.** `pointsFor()` rekent ze uit over completions,
activiteiten, gehaalde doelen en ingeleverde beloningen. Geen teller die uit de pas kan lopen.

**Het model ziet de database niet.** `buildCoachContext()` maakt een klein contextobject,
`sanitizeContext()` op de server laat alleen gewhitelist velden door. Geen id's, geen
achternamen, geen e-mail, geen vrije intaketekst.

**Safety staat centraal.** `lib/ai/safety.ts` bevat de regels, de geblokkeerde patronen
(diagnose, medicatie, schaamte, dreiging), de escalatietekst en de disclaimer. Elk AI-antwoord
gaat er verplicht doorheen; wordt het geblokkeerd, dan verschijnt stil het regelbericht.

**Persistence is een poort.** De UI kent alleen `Repository`. 0.1 gebruikt localStorage
(of `family_state` in Supabase). 0.2 kan naar genormaliseerde tabellen zonder UI-wijzigingen.

## Wat al volledig werkt

- Onboarding met rolkeuze, gezin, kinderen, intake (chips/sliders) en gegenereerd coachprofiel
- Ouderdashboard: check-in, gezinsoverzicht, insight, dagelijkse ouder-actie, gedeelde activiteit
- Kinddashboard: check-in, dagritme, top-3 acties, punten, voortgang naar de volgende beloning
- Afspraken aanmaken, pauzeren en verwijderen, met tip bij negatief geformuleerde afspraken
- Afvinken met punten, positieve feedback en herberekende voortgang
- Doelen, beloningen (vooral tijd, activiteiten en autonomie) en inleveren van punten
- Gezinsactiviteiten met deelnemers
- Weekoverzicht, zeven-dagen-ritme, per kind, en signalering van wat aandacht vraagt
- Rules engine met quiet hours, dagmaximum en anti-herhaling; instelbaar bij Profiel
- AI-coach via Claude of OpenAI, met volledige regelgebaseerde fallback
- Privacy: export, opnieuw instellen, alles verwijderen; AI en interesses uit te zetten
- Pilotpagina met aanmelding, feedback en 1–10 score
- Coachdashboard (placeholder, datamodel al voorbereid op meerdere gezinnen)
- Responsive: bottom-navigatie op mobiel, zijnavigatie vanaf `md`, `prefers-reduced-motion` respect

## Logisch voor release 0.2

1. **Echte auth en multi-device** — Supabase Auth, ouder nodigt kind uit met een code,
   omschakelen naar de genormaliseerde tabellen achter dezelfde `Repository`.
2. **Push- en tijdgestuurde momenten** — nu wordt een coachmoment bij openen bepaald;
   0.2 heeft een scheduler (cron/edge function) plus web push, met dezelfde rules engine.
3. **Coach ↔ gezin koppeling** met expliciete toestemming, beperkte inzage en audit logging.
4. **Afspraken bijstellen op basis van patronen** — Flow stelt voor een afspraak te verkleinen
   of te verplaatsen wanneer hij structureel niet lukt, in plaats van alleen te signaleren.
5. **Ouder-kind onderhandeling** — een afspraak samen aanpassen in plaats van eenzijdig instellen.
6. **Beloningen goedkeuren** door de ouder, met een korte geschiedenis.
7. **Tests**: unit tests op `utils`, `rules` en `safety`; een e2e-flow over onboarding → afvinken.

## Scripts

```bash
npm run dev        # ontwikkelserver
npm run build      # productiebuild
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
```
