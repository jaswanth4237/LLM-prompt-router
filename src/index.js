require("dotenv").config();

const { OpenAILLMClient } = require("./services/llmClient");
const { RouterController } = require("./controllers/routerController");
const { formatCliResult } = require("./views/responseView");

async function main() {
  const message = process.argv.slice(2).join(" ").trim();

  if (!message) {
    console.log("Usage: node index.js \"<your message>\"");
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY in environment.");
    process.exit(1);
  }

  const llmClient = new OpenAILLMClient();
  const controller = new RouterController(llmClient);
  const result = await controller.handleMessage(message);

  console.log(formatCliResult(result));
}

main().catch((error) => {
  console.error("Fatal error:", error.message);
  process.exit(1);
});