# Smog Shield AI

[![CI](https://github.com/bhatt89-kb/smog-shield/actions/workflows/ci.yml/badge.svg)](https://github.com/bhatt89-kb/smog-shield/actions/workflows/ci.yml)

**Live demo:** https://smog-shield-theta.vercel.app/

Personalised, AI-generated action plans for families and communities facing severe winter smog.

Enter your city and a few details about your household. The app fetches live air quality for that city, then asks Google Gemini for a tailored plan of six actions covering low-emission daily routines, indoor air quality hacks, and sustainable alternatives. Every action shows its estimated impact and explains how the number arises, so people can see what each choice is worth.

## Problem and approach

Winter smog is a daily health risk, but generic advice ("stay indoors") is hard to act on. Smog Shield AI turns live data into specific steps for a specific household:

| Requirement | How the app answers it |
| --- | --- |
| Tailored to location | Live AQI, PM2.5 and PM10 for the chosen city (OpenWeather), compared with the WHO 24-hour guideline |
| Tailored to lifestyle | Household size, vulnerable members, commute, cooking fuel, heating and purifier shape the plan |
| Low-emission routines, indoor air hacks, sustainable swaps | Six actions, two per category |
| Clear, direct impact | Per-action impact box, an impact chart, and a "by the numbers" ledger |
| Families and communities | English and Hindi output; plain-language steps that suit shared households |

## Features

- **Live air quality** (AQI, PM2.5, PM10) from the OpenWeather Air Pollution API
- **City autocomplete** with popular cities on tap and live matches as you type
- **Personalised plans** from Gemini, validated against a strict schema before display
- **Quantified impact** for every action, with the reasoning shown
- **English and Hindi** plan output
- **Graceful fallback** to built-in offline guidance if the AI or air-quality service is unavailable
- **Result caching** for identical requests (10 minutes) to keep repeat requests fast and save AI quota

## Architecture

```
Browser (Next.js client)
  |  POST /api/generate          GET /api/cities?q=
  v                              v
Route handlers (Node runtime)
  1. rate limit per IP
  2. size cap + Zod input validation
  3. cache lookup (identical inputs)
  4. OpenWeather geocoding + air pollution
  5. Gemini (system prompt, user data passed as data only)
  6. Zod validation of the model output
  7. JSON response, or offline fallback on failure
```

## Tech stack

- [Next.js](https://nextjs.org) (App Router) and React, written in TypeScript
- Tailwind CSS and Motion for styling and animation
- [Zod](https://zod.dev) for input and response validation
- Google Gemini via `@google/generative-ai`
- OpenWeather APIs for geocoding and air pollution
- [Vitest](https://vitest.dev), Testing Library and axe for tests
- GitHub Actions for CI (lint, type check, test, build)

## Getting started

### Prerequisites

- Node.js 20 or later
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)
- An [OpenWeather](https://openweathermap.org/api) API key

### Setup

```bash
git clone https://github.com/bhatt89-kb/smog-shield.git
cd smog-shield
npm install
```

Create a `.env.local` file in the project root (see `.env.example`):

```
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=your_preferred_gemini_model
OPENWEATHER_API_KEY=your_openweather_key
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Run the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Vitest test suite |

## Testing

Run `npm test`. The suite covers:

- **Validation:** input schema, prompt-injection-style city names, AI response parsing
- **API routes:** `/api/generate` (success, validation errors, 404, 429, 502, fallback, caching) and `/api/cities` (validation, mapping, de-duplication, upstream failure, rate limit)
- **Libraries:** AQI client, Gemini client (mocked SDK), rate limiter, cache, statistics ledger, JSON helper
- **Accessibility:** the form and city combobox are checked with axe, plus keyboard and error-announcement behaviour

Server-side logic (`src/lib` and `src/app/api`) is covered at about 90% of statements. Run `npx vitest run --coverage` after installing `@vitest/coverage-v8` to reproduce.

## Accessibility

- Skip link, a real `h1`, semantic landmarks, and labelled form controls
- City field follows the ARIA combobox pattern: arrow keys, Enter, Escape, and announced result counts
- Errors are announced (`role="alert"`); focus moves to the results when they arrive
- Plan text is marked with the correct `lang` (English or Hindi) so screen readers pronounce it properly
- Air quality is never conveyed by colour alone
- Animations stop for users who prefer reduced motion; animated numbers are hidden from screen readers and the final value is read once
- Visible focus indicators and a dark, high-contrast theme

## Security notes

- API keys are read only on the server and never sent to the browser
- Requests are validated with Zod and capped in size; model output is validated before display
- User input reaches the model strictly as labelled data, not as instructions, and the city field is character-restricted
- Both endpoints are rate limited per IP. The limiter and cache are in-memory, so for multi-instance deployments use a shared store such as Redis
- Security headers are set (CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`). The CSP currently allows inline scripts, which Next.js needs without nonces
- Upstream errors are logged on the server and never exposed to the client
- Production dependencies pass `npm audit`

## Performance notes

- Post-submit UI (progress line, stats ledger) is loaded on demand
- The light-rays background loads only on wide screens and is skipped for reduced-motion users
- Air-quality lookups are cached for 10 minutes, and identical plan requests reuse the last result
- The Devanagari font is fetched only when Hindi text is shown

## Project structure

```
src/
  app/
    api/cities/     City autocomplete endpoint
    api/generate/   AQI lookup + AI advice endpoint
  components/       UI components (see note below)
  lib/              AQI client, Gemini client, schemas, rate limiter, cache, stats
  __tests__/        Unit, API and accessibility tests
```

**Note on vendored components:** `BorderGlow`, `CountUp`, `LightRays`, `RotatingText` and `ThoughtLine` are copied from the free [React Bits](https://reactbits.dev) library. Everything else in `src/` is original to this project.

## Known limitations

- The language toggle translates the plan, not the interface labels
- Impact figures are model estimates and are labelled as such; they are not medical advice
- Rate limiting and caching are per server instance

## Disclaimer

Smog Shield AI provides general guidance and indicative estimates only. It is not medical advice. Consult a healthcare professional for health concerns.

## License

Released under the [MIT License](LICENSE).
