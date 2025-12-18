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
  baseUrl: string,
  model: string
) {
  const systemPrompt = SYSTEM_PROMPTS[style];
  
  // Ensure baseUrl doesn't end with slash if we append /v1...
  // The provided URL is https://api.minimaxi.com/anthropic
  // Usually the endpoint is .../v1/messages
  const endpoint = `${baseUrl.replace(/\/$/, "")}/v1/messages`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: model,
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

  const data = await response.json() as {
    content: { text: string }[];
    usage: { input_tokens: number; output_tokens: number };
  };

  if (!data.content || !data.content[0] || !data.content[0].text) {
    throw new Error("Invalid response format from AI API");
  }

  return {
    polishedContent: data.content[0].text,
    usage: data.usage,
  };
}
