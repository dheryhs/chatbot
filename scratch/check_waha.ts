import "dotenv/config";

const WAHA_BASE_URL = process.env.WAHA_BASE_URL || "https://waha-hhsjinfnlm3c.anakit.sumopod.my.id";
const WAHA_API_KEY = process.env.WAHA_API_KEY || "";

async function wahaFetch(endpoint: string, options: RequestInit = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...((WAHA_API_KEY && endpoint.startsWith("/api/sessions")) ? { "X-Api-Key": WAHA_API_KEY } : {}),
    ...(options.headers || {}),
  } as any;

  const response = await fetch(`${WAHA_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function main() {
  try {
    const sessions = await wahaFetch("/api/sessions?all=true");
    console.log("Sessions:", JSON.stringify(sessions, null, 2));
  } catch (err) {
    console.error(err);
  }
}

main();
