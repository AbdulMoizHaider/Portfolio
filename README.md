# Abdul Moiz Haider — Interactive Product Portfolio

## Included versions

- `index.html` — editable source using `styles.css`, `script.js`, the assets folder, and the included CV.
- `portfolio-standalone.html` — one-file version with the profile photo, certificate images, JavaScript, styling, and CV embedded.

## Restored profile photo

The hero profile photo is included at `assets/profile-photo.jpg`, is loaded eagerly, and remains visible even when JavaScript is delayed or unavailable. The same image is embedded directly inside the standalone HTML.

## AI Scribe transcription

The recorder no longer publishes changing interim guesses. It records the consultation, checks that clear speech was actually detected, and only shows a final transcript after the user stops.

Transcription order:

1. The included `/api/transcribe` server route uses `gpt-4o-transcribe` with English language guidance and portfolio-specific proper nouns.
2. When the server is unavailable, supported Chromium browsers use the on-device Web Speech dictation model with final results only, contextual phrase biasing, confidence filtering, and duplicate suppression.
3. If neither reliable route is available, the recording is preserved for playback but the interface does not invent a transcript.

The transcript becomes editable after a successful result.

## Run with the stable transcription server

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` and add a server-side OpenAI API key.
3. Run `npm install`.
4. Run `npm start`.
5. Open `http://localhost:8000`.

Never place an API key in `script.js` or any browser-visible file.

For the browser-only fallback, serve the folder through HTTPS or localhost and use an up-to-date Chromium browser. The first use may ask to install the English on-device dictation language pack.

## CV

`Abdul-Moiz-Haider-CV.pdf` is the latest supplied CV and is connected to both CV download buttons. It is embedded inside the standalone version as well.

## Aurora Rush luxury vehicle and collision update

The navigation game remains fully inside the portfolio modal. The old pickup and basic traffic lineup has been replaced by three original luxury concepts: the Aurelia Sovereign flagship sedan, Velaris Royal luxury SUV, and Vantoro V12 supercar. Every traffic vehicle is now drawn as a premium sedan, grand tourer, luxury SUV, or supercar, with model badges, distinctive LED signatures, refined body proportions, and luxury color palettes.

The editable version includes dedicated SVG previews in `assets/vehicles/`, and the same artwork is embedded directly in `portfolio-standalone.html` so the one-file edition remains self-contained.

Collisions use screen-space vehicle hitboxes rather than a narrow lane-only check. A real impact causes:

- immediate speed and nitro loss;
- camera shake, hit-stop, sparks, debris, and a visible impact message;
- a sideways spin for the struck traffic vehicle;
- score loss and persistent vehicle damage;
- a vehicle-health meter and run termination at 0% health;
- an impact sound when game audio is enabled.

No game page or external gaming website is opened.
