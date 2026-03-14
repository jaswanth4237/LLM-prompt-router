const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");

class OpenAILLMClient {
  constructor(options = {}) {
    const apiKey = (options.apiKey || process.env.OPENAI_API_KEY || "").trim();
    this.isGemini = apiKey.startsWith("AIza");

    if (this.isGemini) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.classifierModel = options.classifierModel || process.env.CLASSIFIER_MODEL || "gemini-2.5-flash";
      this.generatorModel = options.generatorModel || process.env.GENERATOR_MODEL || "gemini-2.5-flash";
    } else {
      this.classifierModel = options.classifierModel || process.env.CLASSIFIER_MODEL || "gpt-4o-mini";
      this.generatorModel = options.generatorModel || process.env.GENERATOR_MODEL || "gpt-4o-mini";
      this.client = new OpenAI({ apiKey });
    }
  }

  async classifyIntent(systemPrompt, userMessage) {
    if (this.isGemini) {
      const model = this.genAI.getGenerativeModel({ model: this.classifierModel });
      const prompt = `${systemPrompt}\n\nUser Message: ${userMessage}`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return text;
    } else {
      const completion = await this.client.chat.completions.create({
        model: this.classifierModel,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ]
      });
      return completion.choices[0]?.message?.content || "";
    }
  }

  async generateResponse(systemPrompt, userMessage) {
    if (this.isGemini) {
      const model = this.genAI.getGenerativeModel({ model: this.generatorModel });
      const result = await model.generateContent(`${systemPrompt}\n\nUser Message: ${userMessage}`);
      return result.response.text();
    } else {
      const completion = await this.client.chat.completions.create({
        model: this.generatorModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ]
      });
      return completion.choices[0]?.message?.content || "";
    }
  }
}

module.exports = {
  OpenAILLMClient
};
