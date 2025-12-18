export type PolishStyle = "concise" | "academic" | "colloquial" | "formal" | "custom";

const SYSTEM_PROMPTS: Record<PolishStyle, string> = {
  concise: "You are an expert editor. Your goal is to make the text concise, clear, and to the point. Remove unnecessary words and simplify complex sentences without losing meaning. Output ONLY the polished text, no preamble.",
  academic: "You are an academic editor. Rewrite the text to use formal, scholarly language. Use precise terminology and structured sentences appropriate for research papers or academic writing. Output ONLY the polished text, no preamble.",
  colloquial: "You are a casual writer. Rewrite the text to sound natural, conversational, and friendly. Use idioms and contractions where appropriate, as if speaking to a friend. Output ONLY the polished text, no preamble.",
  formal: "You are a professional business editor. Rewrite the text to be formal, polite, and professional. Ensure the tone is suitable for business communications or official documents. Output ONLY the polished text, no preamble.",
  custom: "You are a helpful writing assistant. Your task is to polish the text according to the user's specific instructions. Adhere strictly to their requirements. Output ONLY the polished text, no preamble.",
};

export async function polishNote(
  content: string,
  style: PolishStyle,
  apiKey: string,
  baseUrl: string = "https://api.minimaxi.com/anthropic",
  model: string = "MiniMax-M2",
  customInstruction?: string
) {
  let systemPrompt = SYSTEM_PROMPTS[style];
  let userContent = content;

  if (style === "custom" && customInstruction) {
     userContent = `Instruction: ${customInstruction}\n\nContent to polish:\n${content}`;
  }

  
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
        { role: "user", content: userContent }
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
     // Filter for text blocks, ignoring "thinking" blocks or other types
     const textBlocks = data.content
       .filter((block: any) => {
         // If it's a string, it's text
         if (typeof block === "string") return true;
         // If it's an object, it must have 'text' and NOT be a pure thinking block
         return typeof block === "object" && block.text && !block.thinking;
       })
       .map((block: any) => typeof block === "string" ? block : block.text);

     if (textBlocks.length > 0) {
        return {
          polishedContent: textBlocks.join("").trim(),
          usage: data.usage || { input_tokens: 0, output_tokens: 0 },
        };
     }
     
     // Fallback: If no pure text blocks found, maybe the first block has text mixed with thinking?
     const firstBlock = data.content[0];
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
