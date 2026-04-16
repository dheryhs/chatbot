const WAHA_BASE_URL = process.env.WAHA_BASE_URL || "https://waha-hhsjinfnlm3c.anakit.sumopod.my.id";
const WAHA_API_KEY = process.env.WAHA_API_KEY || "";

async function wahaFetch(endpoint: string, options: RequestInit = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...((WAHA_API_KEY && endpoint.startsWith("/api/sessions")) ? { "X-Api-Key": WAHA_API_KEY } : {}),
    ...(options.headers || {}),
  } as any;

  // For message endpoints that still use 'token' in header
  if (endpoint.startsWith("/api/v1/messages") && headers.token) {
    // Already has token
  } else if (WAHA_API_KEY) {
     headers["X-Api-Key"] = WAHA_API_KEY;
  }

  const response = await fetch(`${WAHA_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    const errorMsg = errorData.message || errorData.error || `WAHA API Error: ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return response.json();
}

export const waha = {
  // Session Management
  listSessions: (all = true) => wahaFetch(`/api/sessions?all=${all}`),
  
  createSession: (name: string, config: any = {}) => {
    // Inject Webhook configuration silently so the developer/user doesn't have to manually specify it
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const webhookUrl = `${appUrl}/api/webhook/waha`;
    
    const mergedConfig = {
      ...config,
      webhooks: [
        {
          url: webhookUrl,
          events: ["message.any"] // Receive all incoming & outgoing messages
        }
      ]
    };

    return wahaFetch(`/api/sessions`, {
      method: "POST",
      body: JSON.stringify({ name, config: mergedConfig }),
    });
  },

  getSession: (name: string) => wahaFetch(`/api/sessions/${name}`),

  startSession: (name: string) => wahaFetch(`/api/sessions/${name}/start`, { method: "POST" }),
  
  stopSession: (name: string) => wahaFetch(`/api/sessions/${name}/stop`, { method: "POST" }),
  
  restartSession: (name: string) => wahaFetch(`/api/sessions/${name}/restart`, { method: "POST" }),
  
  deleteSession: (name: string) => wahaFetch(`/api/sessions/${name}`, { method: "DELETE" }),

  // Auth
  getQR: (sessionName: string) => wahaFetch(`/api/${sessionName}/auth/qr`, {
    headers: { "Accept": "application/json" }
  }),

  requestPairingCode: (sessionName: string, phoneNumber: string) => wahaFetch(`/api/${sessionName}/auth/request-code`, {
    method: "POST",
    body: JSON.stringify({ phoneNumber }),
  }),

  logoutSession: (name: string) => wahaFetch(`/api/sessions/logout`, {
    method: "POST",
    body: JSON.stringify({ name }),
  }),

  getContacts: (sessionName: string) => 
    wahaFetch(`/api/contacts/all?session=${sessionName}&limit=1000&sortBy=id&sortOrder=asc`),

  // Chats
  getChatsOverview: (sessionName: string, limit = 30, offset = 0) =>
    wahaFetch(`/api/${sessionName}/chats/overview?limit=${limit}&offset=${offset}`),

  getChatMessages: (sessionName: string, chatId: string, limit = 30, offset = 0) =>
    wahaFetch(`/api/${sessionName}/chats/${encodeURIComponent(chatId)}/messages?limit=${limit}&offset=${offset}&downloadMedia=false`),

  sendTextToChat: (sessionName: string, chatId: string, text: string) =>
    wahaFetch(`/api/sendText`, {
      method: "POST",
      body: JSON.stringify({ session: sessionName, chatId, text }),
    }),

  sendImageToChat: (sessionName: string, chatId: string, file: string, caption?: string) =>
    wahaFetch(`/api/sendImage`, {
      method: "POST",
      body: JSON.stringify({ 
        session: sessionName, 
        chatId, 
        file, // URL or base64
        caption 
      }),
    }),

  // Typing Effects
  startTyping: (sessionName: string, chatId: string) => 
    wahaFetch(`/api/startTyping`, { method: "POST", body: JSON.stringify({ session: sessionName, chatId }) }),
  
  stopTyping: (sessionName: string, chatId: string) => 
    wahaFetch(`/api/stopTyping`, { method: "POST", body: JSON.stringify({ session: sessionName, chatId }) }),

  // Messages (legacy wrapper logic)
  sendText: (phone: string, body: string, token: string) => 
    wahaFetch(`/api/v1/messages/text`, {
      method: "POST",
      headers: { "token": token },
      body: JSON.stringify({ phone, body }),
    }),
};
