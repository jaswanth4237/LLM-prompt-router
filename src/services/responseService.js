const { EXPERT_PROMPTS } = require("../config/prompts");
const { SAFE_DEFAULT_INTENT } = require("../models/intentModel");
const { getClarificationQuestion } = require("../views/responseView");

async function routeAndRespond(message, intentData, llmClient) {
  const intent = intentData?.intent || SAFE_DEFAULT_INTENT;

  if (intent === SAFE_DEFAULT_INTENT) {
    return getClarificationQuestion();
  }

  const systemPrompt = EXPERT_PROMPTS[intent];

  if (!systemPrompt) {
    return getClarificationQuestion();
  }

  return llmClient.generateResponse(systemPrompt, message);
}

module.exports = {
  routeAndRespond
};
