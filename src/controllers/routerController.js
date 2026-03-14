const { classifyIntent } = require("../services/classificationService");
const { routeAndRespond } = require("../services/responseService");
const { appendRouteLog } = require("../models/routeLogModel");
const { normalizeIntent } = require("../models/intentModel");

class RouterController {
  constructor(llmClient, options = {}) {
    this.llmClient = llmClient;
    this.confidenceThreshold =
      Number.isFinite(Number(options.confidenceThreshold))
        ? Number(options.confidenceThreshold)
        : Number(process.env.INTENT_CONFIDENCE_THRESHOLD || 0.7);
    this.logFilePath = options.logFilePath;
  }

  parseManualIntentOverride(message) {
    const manualMatch = String(message || "").match(/^@(code|data|writing|career|unclear)\b\s*/i);

    if (!manualMatch) {
      return null;
    }

    return {
      intent: normalizeIntent(manualMatch[1]),
      confidence: 1,
      cleanedMessage: String(message).replace(manualMatch[0], "").trim()
    };
  }

  applyConfidenceGate(intentData) {
    if (intentData.intent === "unclear") {
      return intentData;
    }

    if (intentData.confidence < this.confidenceThreshold) {
      return { intent: "unclear", confidence: intentData.confidence };
    }

    return intentData;
  }

  async handleMessage(userMessage) {
    const override = this.parseManualIntentOverride(userMessage);

    const message = override?.cleanedMessage || userMessage;
    const detectedIntent = override || (await classifyIntent(message, this.llmClient));
    const intentData = this.applyConfidenceGate(detectedIntent);

    const finalResponse = await routeAndRespond(message, intentData, this.llmClient);

    appendRouteLog(
      {
        intent: intentData.intent,
        confidence: intentData.confidence,
        user_message: message,
        final_response: finalResponse
      },
      this.logFilePath
    );

    return {
      userMessage: message,
      intentData,
      finalResponse
    };
  }
}

module.exports = {
  RouterController
};
