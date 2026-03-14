const { SUPPORTED_INTENTS } = require("../config/prompts");

const SAFE_DEFAULT_INTENT = "unclear";

function normalizeIntent(intent) {
  if (typeof intent !== "string") {
    return SAFE_DEFAULT_INTENT;
  }

  const normalized = intent.trim().toLowerCase();
  return SUPPORTED_INTENTS.includes(normalized) ? normalized : SAFE_DEFAULT_INTENT;
}

function normalizeConfidence(confidence) {
  const numeric = Number(confidence);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  if (numeric < 0) {
    return 0;
  }

  if (numeric > 1) {
    return 1;
  }

  return numeric;
}

function parseClassifierOutput(rawText) {
  try {
    const firstJsonObject = String(rawText || "").match(/\{[\s\S]*\}/);
    if (!firstJsonObject) {
      return { intent: SAFE_DEFAULT_INTENT, confidence: 0 };
    }

    const parsed = JSON.parse(firstJsonObject[0]);

    return {
      intent: normalizeIntent(parsed.intent),
      confidence: normalizeConfidence(parsed.confidence)
    };
  } catch (_error) {
    return { intent: SAFE_DEFAULT_INTENT, confidence: 0 };
  }
}

module.exports = {
  SAFE_DEFAULT_INTENT,
  normalizeIntent,
  normalizeConfidence,
  parseClassifierOutput
};
