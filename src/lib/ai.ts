export type PolishStyle = "concise" | "academic" | "colloquial" | "formal";

const SYSTEM_PROMPTS: Record<PolishStyle, string> = {
  concise: "You are an expert editor. Your goal is to make the text concise, clear, and to the point. Remove unnecessary words and simplify complex sentences without losing meaning. Output ONLY the polished text, no preamble.",
  academic: "You are an academic editor. Rewrite the text to use formal, scholarly language. Use precise terminology and structured sentences appropriate for research papers or academic writing. Output ONLY the polished text, no preamble.",
  colloquial: "You are a casual writer. Rewrite the text to sound natural, conversational, and friendly. Use idioms and contractions where appropriate, as if speaking to a friend. Output ONLY the polished text, no preamble.",
  formal: "You are a professional business editor. Rewrite the text to be formal, polite, and professional. Ensure the tone is suitable for business communications or official documents. Output ONLY the polished text, no preamble.",
};

export async function polishNote(
  content: string,
  style: PolishStyle,
  apiKey: string,
  baseUrl: string = "https://api.minimaxi.com/anthropic",
  model: string = "MiniMax-M2"
) {
  const systemPrompt = SYSTEM_PROMPTS[style];
  
  // Clean API Key (remove comments and whitespace)
  const cleanApiKey = apiKey.split("#")[0].trim();
  
  // Ensure baseUrl exists and is formatted correctly
  const safeBaseUrl = (baseUrl || "https://api.minimaxi.com/anthropic").replace(/\/$/, "");
  const endpoint = `${safeBaseUrl}/v1/messages`;
  const safeModel = model || "MiniMax-M2";

  console.log(`[AI] Sending request to ${endpoint} with model ${safeModel}`);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${cleanApiKey}`,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: safeModel,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        { role: "user", content: content }
      ]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI API Error Details:", errorText);
    throw new Error(`AI API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as any;

  // 1. Check for standard Anthropic format (and handle string/object content)
  if (data.content && Array.isArray(data.content) && data.content.length > 0) {
    const firstBlock = data.content[0];
    if (typeof firstBlock === "string") {
       return {
         polishedContent: firstBlock,
         usage: data.usage || { input_tokens: 0, output_tokens: 0 },
       };
    } else if (firstBlock && typeof firstBlock === "object" && "text" in firstBlock) {
       return {
         polishedContent: firstBlock.text,
         usage: data.usage || { input_tokens: 0, output_tokens: 0 },
       };
    }
  }

  // 2. Fallback: Check for OpenAI format (choices[0].message.content)
  // Some "compatible" proxies might mix this up
  if (data.choices && Array.isArray(data.choices) && data.choices[0]?.message?.content) {
    return {
      polishedContent: data.choices[0].message.content,
      usage: data.usage || { input_tokens: 0, output_tokens: 0 },
    };
  }

  // 3. Fallback: Check for MiniMax native format (reply)
  if (data.reply) {
      return {
          polishedContent: data.reply,
          usage: data.usage || { input_tokens: 0, output_tokens: 0 },
      };
  }

  // If we get here, the format is unrecognized.
  console.error("Unknown AI Response Format:", JSON.stringify(data, null, 2));
  const receivedKeys = Object.keys(data).join(", ");
  throw new Error(`Invalid response format from AI API. Received keys: [${receivedKeys}]. Check server logs for full payload.`);
}
