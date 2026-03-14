const assert = require("assert");
const fs = require("fs");
const path = require("path");

const { RouterController } = require("./controllers/routerController");
const { classifyIntent } = require("./services/classificationService");
const { parseClassifierOutput } = require("./models/intentModel");
const { EXPERT_PROMPTS } = require("./config/prompts");

const TEST_MESSAGES = [
  "how do i sort a list of objects in python?",
  "explain this sql query for me",
  "This paragraph sounds awkward, can you help me fix it?",
  "I'm preparing for a job interview, any tips?",
  "what's the average of these numbers: 12, 45, 23, 67, 34",
  "Help me make this better.",
  "I need to write a function that takes a user id and returns their profile, but also i need help with my resume.",
  "hey",
  "Can you write me a poem about clouds?",
  "Rewrite this sentence to be more professional.",
  "I'm not sure what to do with my career.",
  "what is a pivot table",
  "fxi thsi bug pls: for i in range(10) print(i)",
  "How do I structure a cover letter?",
  "My boss says my writing is too verbose."
];

class MockLLMClient {
  async classifyIntent(_systemPrompt, message) {
    const text = String(message).toLowerCase();

    if (text.includes("sort") || text.includes("bug") || text.includes("sql")) {
      return JSON.stringify({ intent: "code", confidence: 0.91 });
    }
    if (text.includes("average") || text.includes("pivot table")) {
      return JSON.stringify({ intent: "data", confidence: 0.89 });
    }
    if (text.includes("paragraph") || text.includes("rewrite") || text.includes("writing") || text.includes("verbose")) {
      return JSON.stringify({ intent: "writing", confidence: 0.9 });
    }
    if (text.includes("interview") || text.includes("career") || text.includes("cover letter") || text.includes("resume")) {
      return JSON.stringify({ intent: "career", confidence: 0.86 });
    }
    if (text.trim() === "help me make this better.") {
      return JSON.stringify({ intent: "writing", confidence: 0.42 });
    }

    return "not-json";
  }

  async generateResponse(systemPrompt, userMessage) {
    return `persona_response::${systemPrompt.slice(0, 12)}::${userMessage.slice(0, 24)}`;
  }
}

async function runTests() {
  const tempLogPath = path.resolve("route_log.test.jsonl");
  if (fs.existsSync(tempLogPath)) {
    fs.unlinkSync(tempLogPath);
  }

  assert.ok(Object.keys(EXPERT_PROMPTS).length >= 4, "Need at least 4 expert prompts");

  const malformed = parseClassifierOutput("this is invalid json");
  assert.deepStrictEqual(malformed, { intent: "unclear", confidence: 0 }, "Malformed JSON must default to unclear");

  const mockLLMClient = new MockLLMClient();
  const controller = new RouterController(mockLLMClient, {
    confidenceThreshold: 0.7,
    logFilePath: tempLogPath
  });

  for (const message of TEST_MESSAGES) {
    const result = await controller.handleMessage(message);
    assert.ok(result.intentData.intent, "Intent should be present");
    assert.ok(typeof result.intentData.confidence === "number", "Confidence should be numeric");
    assert.ok(typeof result.finalResponse === "string", "Final response should be string");
  }

  const lowConfidence = await controller.handleMessage("Help me make this better.");
  assert.strictEqual(lowConfidence.intentData.intent, "unclear", "Low confidence should be downgraded to unclear");
  assert.ok(lowConfidence.finalResponse.includes("coding") || lowConfidence.finalResponse.includes("data"), "Unclear intent should return a clarification question");

  const manualOverride = await controller.handleMessage("@code explain recursion in javascript");
  assert.strictEqual(manualOverride.intentData.intent, "code", "Manual override should force intent");
  assert.strictEqual(manualOverride.intentData.confidence, 1, "Manual override confidence should be 1");

  const invalidFromClassifier = await classifyIntent("hey", mockLLMClient);
  assert.strictEqual(invalidFromClassifier.intent, "unclear", "Invalid classifier payload must fallback to unclear");

  assert.ok(fs.existsSync(tempLogPath), "route_log.test.jsonl should be created");

  const lines = fs
    .readFileSync(tempLogPath, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean);

  assert.ok(lines.length >= TEST_MESSAGES.length, "Log file should contain entries");

  for (const line of lines) {
    const parsed = JSON.parse(line);
    assert.ok(Object.prototype.hasOwnProperty.call(parsed, "intent"), "Log needs intent");
    assert.ok(Object.prototype.hasOwnProperty.call(parsed, "confidence"), "Log needs confidence");
    assert.ok(Object.prototype.hasOwnProperty.call(parsed, "user_message"), "Log needs user_message");
    assert.ok(Object.prototype.hasOwnProperty.call(parsed, "final_response"), "Log needs final_response");
  }

  console.log("All tests passed.");
}

runTests().catch((error) => {
  console.error("Test run failed:", error.message);
  process.exit(1);
});