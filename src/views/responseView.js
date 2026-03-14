function getClarificationQuestion() {
  return "I want to route this correctly. Are you asking for help with coding, data analysis, writing feedback, or career advice?";
}

function formatCliResult(result) {
  return [
    "\nUser Message:",
    result.userMessage,
    "\nIntent Detected:",
    JSON.stringify(result.intentData, null, 2),
    "\nResponse:",
    result.finalResponse
  ].join("\n");
}

module.exports = {
  getClarificationQuestion,
  formatCliResult
};
