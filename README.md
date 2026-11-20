# Smog Shield AI

Personalised, AI-generated action plans for families facing severe winter smog.

Enter your city and a few details about your household. The app fetches live air quality for that city, then asks Google Gemini for a tailored plan of six actions covering daily routines, indoor air quality, and cleaner alternatives. Each action comes with an estimated impact on your exposure.

<!-- Add a screenshot or GIF here, for example: ![Smog Shield AI](docs/screenshot.png) -->

## Features

- **Live air quality** (AQI, PM2.5, PM10) from the OpenWeather Air Pollution API
- **City autocomplete** using OpenWeather geocoding
- **Personalised plans** from Gemini, tailored to household, commute, cooking, and heating
- **Quantified impact** for every action, with an explanation of how the estimate arises
- **English and Hindi** output
- **Graceful fallback** to built-in offline guidance if the AI service is unavailable
- **Accessible UI** with reduced-motion support and focus management for screen-reader users

## Tech stack

- [Next.js](https://nextjs.org) (App Router) and React, written in TypeScript
- Tailwind CSS, shadcn/ui, Motion, and OGL for the UI and animations
- [Zod](https://zod.dev) for input and response validation
- Google Gemini via `@google/generative-ai`
- OpenWeather APIs for geocoding and air pollution
- [Vitest](https://vitest.dev) for tests

## Getting started

### Prerequisites

- Node.js 20 or later
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)
- An [OpenWeather](https://openweathermap.org/api) API key

### Setup

```bash
git clone https://github.com/bhatt89-kb/smog-shield-ai.git
cd smog-shield-ai
npm install
```

Create a `.env.local` file in the project root (see `.env.example`):

```bash
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

| Command         | Description                  |
| --------------- | ---------------------------- |
| `npm run dev`   | Start the development server |
| `npm run build` | Create a production build    |
| `npm start`     | Run the production build     |
| `npm run lint`  | Run ESLint                   |
| `npm test`      | Run the Vitest test suite    |

## Project structure

```
src/
  app/
    api/cities/     City autocomplete endpoint
    api/generate/   AQI lookup + AI advice endpoint
  components/       UI components
  lib/              AQI client, Gemini client, schemas, rate limiter, stats
  __tests__/        Unit and API tests
```

## Security notes

- API keys are read only on the server and are never sent to the browser.
- Requests are validated with Zod and capped in size.
- Both endpoints are rate limited per IP. The limiter is in-memory, so for multi-instance deployments use a shared store such as Redis.
- User input is passed to the model strictly as data, not as instructions.

## Disclaimer

Smog Shield AI provides general guidance and indicative estimates only. It is not medical advice. Consult a healthcare professional for health concerns.

## License

Released under the [MIT License](LICENSE).
