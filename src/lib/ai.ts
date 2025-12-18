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

  // 1. Direct String Content (Non-standard but possible)
  if (typeof data.content === "string") {
    return {
      polishedContent: data.content,
      usage: data.usage || { input_tokens: 0, output_tokens: 0 },
    };
  }

  // 2. Standard Anthropic Array Format (Robust Check)
  if (Array.isArray(data.content) && data.content.length > 0) {
    const firstBlock = data.content[0];
    
    // Case A: Array of strings ["text"]
    if (typeof firstBlock === "string") {
       return {
         polishedContent: firstBlock,
         usage: data.usage || { input_tokens: 0, output_tokens: 0 },
       };
    } 
    
    // Case B: Array of objects [{ text: "..." }, { content: "..." }]
    if (firstBlock && typeof firstBlock === "object") {
       const textCandidate = firstBlock.text || firstBlock.content || firstBlock.value;
       if (textCandidate && typeof textCandidate === "string") {
          return {
            polishedContent: textCandidate,
            usage: data.usage || { input_tokens: 0, output_tokens: 0 },
          };
       }
    }
  }

  // 3. Fallback: OpenAI Format
  if (data.choices && Array.isArray(data.choices) && data.choices[0]?.message?.content) {
    return {
      polishedContent: data.choices[0].message.content,
      usage: data.usage || { input_tokens: 0, output_tokens: 0 },
    };
  }

  // 4. Fallback: MiniMax Native 'reply'
  if (data.reply) {
      return {
          polishedContent: data.reply,
          usage: data.usage || { input_tokens: 0, output_tokens: 0 },
      };
  }

  // If we get here, the format is unrecognized.
  console.error("Unknown AI Response Format:", JSON.stringify(data, null, 2));
  
  // Construct a more helpful error message
  let detail = "";
  if (data.content) {
      detail = `Content field exists but is ${Array.isArray(data.content) ? "an array" : typeof data.content}: ${JSON.stringify(data.content).slice(0, 100)}`;
  } else {
      detail = `Keys received: [${Object.keys(data).join(", ")}]`;
  }

  throw new Error(`Invalid response format. ${detail}`);
}
