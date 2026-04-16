import { GoogleGenerativeAI } from "@google/generative-ai";

interface ProviderConfig {
  aiApiKey: string;
  aiProvider: string;
}

interface AgentData {
  systemPrompt?: string;
  knowledgeText?: string;
  knowledgeQA?: Array<{ q: string; a: string }>;
}

export async function generateAIResponse(
  agent: AgentData,
  userMessage: string,
  config: ProviderConfig,
  chatHistory: any[] = [] // Optional placeholder for context if needed later
): Promise<string | null> {
  if (!config.aiApiKey) {
    console.error("AI Generation Error: Missing API Key");
    return null;
  }

  // Fallback to Gemini if provider is not explicitly mapped or is empty
  const provider = config.aiProvider || "gemini";

  if (provider === "gemini") {
    try {
      const genAI = new GoogleGenerativeAI(config.aiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // 1. Susun instruksi dasar (Behaviour)
      let systemPrompt = `[System Instructions]\n${agent.systemPrompt || "Kamu adalah asisten interaktif yang informatif."}\n\n`;

      // 2. Suntikkan Knowledge Base
      if (agent.knowledgeText && agent.knowledgeText.trim().length > 0) {
        systemPrompt += `[Knowledge Base Perusahaan]\nGunakan referensi info berikut untuk menjawab pertanyaan. Jangan gunakan asumsi di luar info ini untuk urusan internal perusahaan/produk:\n${agent.knowledgeText.trim()}\n\n`;
      }

      // 3. Suntikkan Q&A
      if (Array.isArray(agent.knowledgeQA) && agent.knowledgeQA.length > 0) {
        systemPrompt += `[FAQ / Jawaban yang Diharapkan]\n`;
        agent.knowledgeQA.forEach((qa) => {
          if (qa.q && qa.a) {
             systemPrompt += `Q: ${qa.q}\nA: ${qa.a}\n\n`;
          }
        });
      }

      // Execute AI Inference
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature: 0.7, // Kreativitas tapi masih patuh pada data
          maxOutputTokens: 500, // Hindari response terlalu panjang
        },
      });

      return result.response.text();
    } catch (error) {
      console.error("Gemini AI Error:", error);
      return null;
    }
  } else if (provider === "openai") {
    try {
      let systemContent = `[System Instructions]\n${agent.systemPrompt || "Kamu adalah asisten interaktif yang informatif."}\n\n`;

      if (agent.knowledgeText && agent.knowledgeText.trim().length > 0) {
        systemContent += `[Knowledge Base Perusahaan]\nGunakan referensi info berikut untuk menjawab pertanyaan. Jangan gunakan asumsi di luar info ini untuk urusan internal perusahaan/produk:\n${agent.knowledgeText.trim()}\n\n`;
      }

      if (Array.isArray(agent.knowledgeQA) && agent.knowledgeQA.length > 0) {
        systemContent += `[FAQ / Jawaban yang Diharapkan]\n`;
        agent.knowledgeQA.forEach((qa) => {
          if (qa.q && qa.a) {
             systemContent += `Q: ${qa.q}\nA: ${qa.a}\n\n`;
          }
        });
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.aiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // Use gpt-4o-mini as a fast/cheap fallback
          messages: [
            { role: "system", content: systemContent },
            { role: "user", content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(()=>({}));
        console.error("OpenAI Error:", errData);
        return null;
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (error) {
      console.error("OpenAI Execution Error:", error);
      return null;
    }
  } else {
    console.log(`Provider ${provider} is not yet implemented. Using fallback logic if available.`);
    return null;
  }
}
