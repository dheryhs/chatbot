import "dotenv/config";
import { PrismaClient } from '@prisma/client'
import { generateAIResponse } from '../lib/ai'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst();
  const agent = await prisma.agent.findFirst();
  
  if (!user || !user.aiApiKey) {
    console.log("No API Key");
    return;
  }
  
  console.log("Testing with key:", user.aiApiKey.substring(0, 5) + "...");
  console.log("Testing with Provider:", user.aiProvider);
  
  try {
    const response = await generateAIResponse(
      agent, 
      "halo tes chatbot gemini", 
      { aiApiKey: user.aiApiKey, aiProvider: "gemini" }
    );
    console.log("Response:", response);
  } catch (error) {
    console.log("CATCH ERR:", error);
  }
}

main();
