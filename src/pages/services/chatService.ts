const API_URL = "http://localhost:5001";

export interface Conversation {
  id: number;
  property_id: number;
  property_title: string;
  customer_id: number;
  customer_name: string;
  agent_id: number;
  agent_name: string;
  last_message?: string | null;
  last_message_at?: string | null;
  last_message_sender_id?: number | null;
  unread_by_customer?: number;
  unread_by_agent?: number;
  created_at?: string;
  updated_at?: string;
}

export interface StartChatResponse {
  success: boolean;
  message?: string;
  id?: number;
  conversationId?: number;
  conversation?: Conversation;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  text: string;
  is_read: boolean;
  created_at: string;
}

function getToken(): string | null {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken")
  );
}

function getHeaders(): HeadersInit {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
}

async function parseResponse(
  response: Response
): Promise<any> {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: text,
    };
  }
}

/* =========================================================
   START CHAT
========================================================= */

export async function startChat(
  propertyId: number
): Promise<StartChatResponse> {
  if (!propertyId) {
    throw new Error(
      "Property ID is required."
    );
  }

  const token = getToken();

  if (!token) {
    throw new Error(
      "Please log in before starting a chat."
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/chat/start`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          property_id: propertyId,
        }),
      }
    );

    const data =
      await parseResponse(response);

    console.log(
      "START CHAT RESPONSE:",
      data
    );

    if (!response.ok) {
      throw new Error(
        data?.error ||
          data?.message ||
          `Unable to start chat (${response.status}).`
      );
    }

    return data;
  } catch (error: any) {
    console.error(
      "START CHAT ERROR:",
      error
    );

    throw new Error(
      error?.message ||
        "Unable to start chat."
    );
  }
}

/* =========================================================
   GET CONVERSATIONS
========================================================= */

export async function getConversations(): Promise<
  Conversation[]
> {
  const response = await fetch(
    `${API_URL}/api/chat/conversations`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  const data =
    await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.message ||
        "Unable to load conversations."
    );
  }

  return Array.isArray(
    data?.conversations
  )
    ? data.conversations
    : [];
}

/* =========================================================
   GET MESSAGES
========================================================= */

export async function getMessages(
  conversationId: number
): Promise<ChatMessage[]> {
  const response = await fetch(
    `${API_URL}/api/chat/messages/${conversationId}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  const data =
    await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.message ||
        "Unable to load messages."
    );
  }

  return Array.isArray(
    data?.messages
  )
    ? data.messages
    : [];
}

/* =========================================================
   SEND MESSAGE
========================================================= */

export async function sendMessage(
  conversationId: number,
  text: string
): Promise<ChatMessage> {
  const cleanText = text.trim();

  if (!conversationId) {
    throw new Error(
      "Conversation ID is required."
    );
  }

  if (!cleanText) {
    throw new Error(
      "Message cannot be empty."
    );
  }

  const response = await fetch(
    `${API_URL}/api/chat/messages`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        conversation_id:
          conversationId,
        text: cleanText,
      }),
    }
  );

  const data =
    await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.message ||
        "Unable to send message."
    );
  }

  return data?.data;
}

/* =========================================================
   MARK AS READ
========================================================= */

export async function markMessagesAsRead(
  conversationId: number
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/chat/messages/read/${conversationId}`,
    {
      method: "PUT",
      headers: getHeaders(),
    }
  );

  const data =
    await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.message ||
        "Unable to mark messages as read."
    );
  }
}