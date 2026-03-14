# LLM Prompt Router (MVC)

Intent-based LLM router in Node.js that classifies user requests and routes them to specialized personas (`code`, `data`, `writing`, `career`).

## Features

- Two-step routing pipeline:
  - Classifier call: detect intent + confidence as JSON
  - Generator call: respond with intent-specific expert prompt
- MVC architecture for maintainability and testability
- Safe fallback for malformed classifier output
- `unclear` intent returns a clarifying question instead of guessing
- JSONL observability log in `route_log.jsonl`
- Confidence threshold gate (default `0.7`)
- Manual intent override via `@intent` prefix
- Deterministic test suite with mock LLM
- Docker support

## Architecture (MVC)

```text
.
|-- src/
|   |-- config/
|   |   |-- prompts.js              # Persona prompts + classifier prompt + labels
|   |-- controllers/
|   |   |-- routerController.js     # Orchestration flow (classify -> route -> log)
|   |-- models/
|   |   |-- intentModel.js          # Intent/confidence normalization + parser
|   |   |-- routeLogModel.js        # JSONL append model
|   |-- services/
|   |   |-- llmClient.js            # OpenAI client wrapper
|   |   |-- classificationService.js# Classifier call logic
|   |   |-- responseService.js      # Response generation logic
|   |-- views/
|   |   |-- responseView.js         # Clarification and CLI output formatting
|   |-- index.js                    # CLI entrypoint
|   |-- test.js                     # Verification tests
|-- Dockerfile
|-- route_log.jsonl
```

## Request Flow

1. `RouterController.handleMessage(userMessage)` receives input.
2. Optional manual override is parsed (`@code`, `@data`, `@writing`, `@career`, `@unclear`).
3. Classifier service calls LLM and parses JSON output.
4. Confidence gate converts low-confidence intents to `unclear`.
5. Response service routes to matching expert prompt.
6. If `unclear`, system asks a clarifying question.
7. Final response and routing metadata are appended to `route_log.jsonl`.

## Requirements

- Node.js 20+
- Google Gemini API key (or OpenAI key for dual-compatibility)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env`:

```env
OPENAI_API_KEY=your_gemini_key_here
CLASSIFIER_MODEL=gemini-2.5-flash
GENERATOR_MODEL=gemini-2.5-flash
INTENT_CONFIDENCE_THRESHOLD=0.7
```

## Usage

Run with a user message:

```bash
node src/index.js "how do i sort a list of objects in python?"
```

Or with npm script:

```bash
npm start -- "what is a pivot table"
```

### Manual Override

```bash
node src/index.js "@code fix this syntax error: for i in range(10) print(i)"
```

## Logging

Each request appends one JSON object per line to `route_log.jsonl`.

Minimum fields:

- `intent`
- `confidence`
- `user_message`
- `final_response`

## Test

Run verification suite:

```bash
npm test
```

The suite validates:

- At least four distinct expert prompts exist
- Classifier output parsing and malformed JSON fallback
- `route_and_respond` behavior via controller flow
- `unclear` path returns clarifying question
- Log file generation and required log keys
- Confidence-threshold downgrade behavior
- Manual override behavior

## Docker

Build image:

```bash
docker build -t llm-prompt-router .
```

Run container:

```bash
docker run --rm -e OPENAI_API_KEY=your_key_here llm-prompt-router
```

To pass a custom message at runtime:

```bash
docker run --rm -e OPENAI_API_KEY=your_key_here llm-prompt-router node src/index.js "I'm preparing for a job interview, any tips?"
```

## Notes

- If classifier output is malformed or non-JSON, the system safely defaults to:

```json
{ "intent": "unclear", "confidence": 0 }
```

- The implementation is fully organized around MVC modules in `src/config/`, `src/controllers/`, `src/models/`, `src/services/`, and `src/views/`.
