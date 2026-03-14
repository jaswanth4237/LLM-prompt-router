const { CLASSIFIER_SYSTEM_PROMPT } = require("../config/prompts");
const { parseClassifierOutput } = require("../models/intentModel");

async function classifyIntent(message, llmClient) {
  const raw = await llmClient.classifyIntent(CLASSIFIER_SYSTEM_PROMPT, message);
  return parseClassifierOutput(raw);
}

module.exports = {
  classifyIntent
};
