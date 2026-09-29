// src/services/chatService.ts import { io, Socket } from "socket.io-client"; /* ========================================================= TYPES ========================================================= */ export type UserRole = "customer" | "agent" | "landlord"; export interface Conversation { id: number; property_id?: number; property_title?: string; property_name?: string; customer_id?: number; customer_name?: string; agent_id?: number; agent_name?: string; last_message?: string | null; last_message_at?: string | null; last_message_sender_id?: number | null; unread_count?: number; unread_by_customer?: number; unread_by_agent?: number; status?: string; avatar?: string | null; created_at?: string; updated_at?: string; other_user_name?: string; } export interface Message { id: number | string; conversation_id: number; sender_id: number; text: string; is_read?: boolean; created_at: string; } export class ChatApiError extends Error { status: number; data?: unknown; constructor( message: string, status: number, data?: unknown ) { super(message); this.name = "ChatApiError"; this.status = status; this.data = data; } } /* ========================================================= CONFIG ========================================================= */ // IMPORTANT: // Make sure this matches the port your DWELIO backend uses. const API_BASE = "http://localhost:5001/api"; const SOCKET_URL = "http://localhost:5001"; const isDev = import.meta.env.DEV; /* ========================================================= AUTH ========================================================= */ function getToken(): string | null { const token = localStorage.getItem("token") || sessionStorage.getItem("token"); return token ? token.trim() : null; } /* ========================================================= AUTHENTICATED FETCH ========================================================= */ async function authFetch<T = any>( endpoint: string, options: RequestInit = {} ): Promise<T> { const token = getToken(); if (!token) { throw new ChatApiError( "Your session has expired. Please log in again.", 401 ); } const headers = new Headers(options.headers || {}); headers.set("Content-Type", "application/json"); headers.set("Authorization", `Bearer ${token}`); if (isDev) { console.log( `[Chat API] ${options.method || "GET"} ${API_BASE}${endpoint}` ); } let response: Response; try { response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers, }); } catch (error) { console.error("[Chat API] Network error:", error); throw new ChatApiError( "Unable to connect to the chat server.", 0, error ); } const rawText = await response.text(); let data: any = null; try { data = rawText ? JSON.parse(rawText) : null; } catch { data = rawText; } if (isDev) { console.log( "[Chat API Response]", response.status, data ); } if (!response.ok) { const message = data?.details || data?.error || data?.message || `Request failed with status ${response.status}`; throw new ChatApiError( message, response.status, data ); } return data as T; } /* ========================================================= SOCKET ========================================================= */ let socket: Socket | null = null; export function connectSocket(force = false): Socket { if (socket && !force) { return socket; } if (socket) { socket.removeAllListeners(); socket.disconnect(); socket = null; } const token = getToken(); if (!token) { throw new ChatApiError( "Authentication token is missing.", 401 ); } if (isDev) { console.log("[Chat Socket] Creating connection..."); } socket = io(SOCKET_URL, { auth: { token, }, transports: ["websocket", "polling"], autoConnect: true, reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 1000, reconnectionDelayMax: 5000, timeout: 10000, }); socket.on("connect", () => { if (isDev) { console.log( "[Chat Socket] Connected:", socket?.id ); } }); socket.on("disconnect", (reason) => { if (isDev) { console.log( "[Chat Socket] Disconnected:", reason ); } }); socket.on("connect_error", (error) => { console.error( "[Chat Socket] Connection error:", error.message ); }); return socket; } export function disconnectSocket(): void { if (!socket) return; socket.removeAllListeners(); socket.disconnect(); socket = null; } export function isSocketConnected(): boolean { return Boolean(socket?.connected); } export function getSocket(): Socket { return connectSocket(); } /* ========================================================= CONVERSATION ROOMS ========================================================= */ export function joinConversation( conversationId: string | number ): void { const id = Number(conversationId); if (!Number.isInteger(id) || id <= 0) { console.warn( "[Chat Socket] Invalid conversation:", conversationId ); return; } const s = connectSocket(); const join = () => { if (isDev) { console.log( "[Chat Socket] Joining conversation:", id ); } // IMPORTANT: // This matches the backend convention. s.emit("join_conversation", { conversation_id: id, }); }; if (s.connected) { join(); } else { s.once("connect", join); } } export function leaveConversation( conversationId: string | number ): void { if (!socket) return; const id = Number(conversationId); if (!Number.isInteger(id) || id <= 0) { return; } if (isDev) { console.log( "[Chat Socket] Leaving conversation:", id ); } socket.emit("leave_conversation", { conversation_id: id, }); } /* ========================================================= CONVERSATIONS ========================================================= */ export async function getConversations( role?: UserRole ): Promise<Conversation[]> { const query = role ? `?role=${encodeURIComponent(role)}` : ""; const data = await authFetch( `/chat/conversations${query}` ); if (Array.isArray(data)) { return data; } if (Array.isArray(data?.conversations)) { return data.conversations; } if (Array.isArray(data?.data)) { return data.data; } return []; } /* ========================================================= MESSAGES ========================================================= */ export async function getMessages( conversationId: string | number ): Promise<Message[]> { const id = Number(conversationId); if (!Number.isInteger(id) || id <= 0) { throw new ChatApiError( "Invalid conversation ID.", 400 ); } const data = await authFetch( `/chat/messages/${id}` ); if (Array.isArray(data)) { return data; } if (Array.isArray(data?.messages)) { return data.messages; } if (Array.isArray(data?.data)) { return data.data; } return []; } /* ========================================================= SEND MESSAGE ========================================================= */ export async function sendMessage( conversationId: string | number, text: string ): Promise<Message> { const id = Number(conversationId); const messageText = text.trim(); if (!Number.isInteger(id) || id <= 0) { throw new ChatApiError( "Invalid conversation ID.", 400 ); } if (!messageText) { throw new ChatApiError( "Message cannot be empty.", 400 ); } if (messageText.length > 5000) { throw new ChatApiError( "Message cannot exceed 5000 characters.", 400 ); } const data = await authFetch( "/chat/messages", { method: "POST", body: JSON.stringify({ conversation_id: id, text: messageText, }), } ); if ( data?.data && typeof data.data === "object" ) { return data.data as Message; } if ( data?.message && typeof data.message === "object" ) { return data.message as Message; } if (data?.id && data?.text) { return data as Message; } throw new ChatApiError( "The server returned an invalid message.", 500, data ); } /* ========================================================= MARK READ ========================================================= */ export async function markAsRead( conversationId: string | number ): Promise<void> { const id = Number(conversationId); if (!Number.isInteger(id) || id <= 0) { throw new ChatApiError( "Invalid conversation ID.", 400 ); } await authFetch( `/chat/messages/read/${id}`, { method: "PUT", } ); } /* ========================================================= START CHAT ========================================================= */ export async function startChat( propertyId: string | number ): Promise<Conversation> { const id = Number(propertyId); if (!Number.isInteger(id) || id <= 0) { throw new ChatApiError( "Invalid property ID.", 400 ); } const data = await authFetch( "/chat/start", { method: "POST", body: JSON.stringify({ property_id: id, }), } ); if ( data?.conversation && typeof data.conversation === "object" ) { return data.conversation as Conversation; } if ( data?.data && typeof data.data === "object" && data.data.id ) { return data.data as Conversation; } const conversationId = data?.id || data?.conversationId || data?.conversation_id || data?.data?.id; if (conversationId) { return { id: Number(conversationId), }; } throw new ChatApiError( "Chat was created but no conversation ID was returned.", 500, data ); } /* ========================================================= REAL-TIME EVENTS ========================================================= */ export function onNewMessage( callback: (message: Message) => void ): () => void { const s = connectSocket(); const handler = (message: Message) => { if (!message) return; if (isDev) { console.log( "[Chat Socket] New message:", message ); } callback(message); }; s.on("new_message", handler); return () => { s.off("new_message", handler); }; } /* ========================================================= SOCKET STATUS EVENTS ========================================================= */ export function onSocketConnect( callback: () => void ): () => void { const s = connectSocket(); s.on("connect", callback); return () => { s.off("connect", callback); }; } export function onSocketDisconnect( callback: () => void ): () => void { const s = connectSocket(); s.on("disconnect", callback); return () => { s.off("disconnect", callback); }; } export function onSocketError( callback: (error: Error) => void ): () => void { const s = connectSocket(); s.on("connect_error", callback); return () => { s.off("connect_error", callback); }; }```tsx
// src/services/chatService.ts

import { io, Socket } from "socket.io-client";

/* =========================================================
   TYPES
========================================================= */

export type UserRole = "customer" | "agent" | "landlord";

export interface Conversation {
  id: number;
  property_id?: number;
  property_title?: string;
  property_name?: string;

  customer_id?: number;
  customer_name?: string;

  agent_id?: number;
  agent_name?: string;

  last_message?: string | null;
  last_message_at?: string | null;
  last_message_sender_id?: number | null;

  unread_count?: number;
  unread_by_customer?: number;
  unread_by_agent?: number;

  status?: string;

  avatar?: string | null;

  created_at?: string;
  updated_at?: string;

  other_user_name?: string;
}

export interface Message {
  id: number | string;
  conversation_id: number;
  sender_id: number;
  text: string;
  is_read?: boolean;
  created_at: string;
}

export class ChatApiError extends Error {
  status: number;
  data?: unknown;

  constructor(
    message: string,
    status: number,
    data?: unknown
  ) {
    super(message);
    this.name = "ChatApiError";
    this.status = status;
    this.data = data;
  }
}

/* =========================================================
   CONFIG
========================================================= */

// IMPORTANT:
// Make sure this matches the port your DWELIO backend uses.
const API_BASE = "http://localhost:5001/api";
const SOCKET_URL = "http://localhost:5001";

const isDev = import.meta.env.DEV;

/* =========================================================
   AUTH
========================================================= */

function getToken(): string | null {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  return token ? token.trim() : null;
}

/* =========================================================
   AUTHENTICATED FETCH
========================================================= */

async function authFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  if (!token) {
    throw new ChatApiError(
      "Your session has expired. Please log in again.",
      401
    );
  }

  const headers = new Headers(options.headers || {});

  headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${token}`);

  if (isDev) {
    console.log(
      `[Chat API] ${options.method || "GET"} ${API_BASE}${endpoint}`
    );
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error("[Chat API] Network error:", error);

    throw new ChatApiError(
      "Unable to connect to the chat server.",
      0,
      error
    );
  }

  const rawText = await response.text();

  let data: any = null;

  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = rawText;
  }

  if (isDev) {
    console.log(
      "[Chat API Response]",
      response.status,
      data
    );
  }

  if (!response.ok) {
    const message =
      data?.details ||
      data?.error ||
      data?.message ||
      `Request failed with status ${response.status}`;

    throw new ChatApiError(
      message,
      response.status,
      data
    );
  }

  return data as T;
}

/* =========================================================
   SOCKET
========================================================= */

let socket: Socket | null = null;

export function connectSocket(force = false): Socket {
  if (socket && !force) {
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  const token = getToken();

  if (!token) {
    throw new ChatApiError(
      "Authentication token is missing.",
      401
    );
  }

  if (isDev) {
    console.log("[Chat Socket] Creating connection...");
  }

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },

    transports: ["websocket", "polling"],

    autoConnect: true,

    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,

    timeout: 10000,
  });

  socket.on("connect", () => {
    if (isDev) {
      console.log(
        "[Chat Socket] Connected:",
        socket?.id
      );
    }
  });

  socket.on("disconnect", (reason) => {
    if (isDev) {
      console.log(
        "[Chat Socket] Disconnected:",
        reason
      );
    }
  });

  socket.on("connect_error", (error) => {
    console.error(
      "[Chat Socket] Connection error:",
      error.message
    );
  });

  return socket;
}

export function disconnectSocket(): void {
  if (!socket) return;

  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}

export function isSocketConnected(): boolean {
  return Boolean(socket?.connected);
}

export function getSocket(): Socket {
  return connectSocket();
}

/* =========================================================
   CONVERSATION ROOMS
========================================================= */

export function joinConversation(
  conversationId: string | number
): void {
  const id = Number(conversationId);

  if (!Number.isInteger(id) || id <= 0) {
    console.warn(
      "[Chat Socket] Invalid conversation:",
      conversationId
    );
    return;
  }

  const s = connectSocket();

  const join = () => {
    if (isDev) {
      console.log(
        "[Chat Socket] Joining conversation:",
        id
      );
    }

    // IMPORTANT:
    // This matches the backend convention.
    s.emit("join_conversation", {
      conversation_id: id,
    });
  };

  if (s.connected) {
    join();
  } else {
    s.once("connect", join);
  }
}

export function leaveConversation(
  conversationId: string | number
): void {
  if (!socket) return;

  const id = Number(conversationId);

  if (!Number.isInteger(id) || id <= 0) {
    return;
  }

  if (isDev) {
    console.log(
      "[Chat Socket] Leaving conversation:",
      id
    );
  }

  socket.emit("leave_conversation", {
    conversation_id: id,
  });
}

/* =========================================================
   CONVERSATIONS
========================================================= */

export async function getConversations(
  role?: UserRole
): Promise<Conversation[]> {
  const query = role
    ? `?role=${encodeURIComponent(role)}`
    : "";

  const data = await authFetch(
    `/chat/conversations${query}`
  );

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.conversations)) {
    return data.conversations;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

/* =========================================================
   MESSAGES
========================================================= */

export async function getMessages(
  conversationId: string | number
): Promise<Message[]> {
  const id = Number(conversationId);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ChatApiError(
      "Invalid conversation ID.",
      400
    );
  }

  const data = await authFetch(
    `/chat/messages/${id}`
  );

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.messages)) {
    return data.messages;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

/* =========================================================
   SEND MESSAGE
========================================================= */

export async function sendMessage(
  conversationId: string | number,
  text: string
): Promise<Message> {
  const id = Number(conversationId);
  const messageText = text.trim();

  if (!Number.isInteger(id) || id <= 0) {
    throw new ChatApiError(
      "Invalid conversation ID.",
      400
    );
  }

  if (!messageText) {
    throw new ChatApiError(
      "Message cannot be empty.",
      400
    );
  }

  if (messageText.length > 5000) {
    throw new ChatApiError(
      "Message cannot exceed 5000 characters.",
      400
    );
  }

  const data = await authFetch(
    "/chat/messages",
    {
      method: "POST",
      body: JSON.stringify({
        conversation_id: id,
        text: messageText,
      }),
    }
  );

  if (
    data?.data &&
    typeof data.data === "object"
  ) {
    return data.data as Message;
  }

  if (
    data?.message &&
    typeof data.message === "object"
  ) {
    return data.message as Message;
  }

  if (data?.id && data?.text) {
    return data as Message;
  }

  throw new ChatApiError(
    "The server returned an invalid message.",
    500,
    data
  );
}

/* =========================================================
   MARK READ
========================================================= */

export async function markAsRead(
  conversationId: string | number
): Promise<void> {
  const id = Number(conversationId);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ChatApiError(
      "Invalid conversation ID.",
      400
    );
  }

  await authFetch(
    `/chat/messages/read/${id}`,
    {
      method: "PUT",
    }
  );
}

/* =========================================================
   START CHAT
========================================================= */

export async function startChat(
  propertyId: string | number
): Promise<Conversation> {
  const id = Number(propertyId);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ChatApiError(
      "Invalid property ID.",
      400
    );
  }

  const data = await authFetch(
    "/chat/start",
    {
      method: "POST",
      body: JSON.stringify({
        property_id: id,
      }),
    }
  );

  if (
    data?.conversation &&
    typeof data.conversation === "object"
  ) {
    return data.conversation as Conversation;
  }

  if (
    data?.data &&
    typeof data.data === "object" &&
    data.data.id
  ) {
    return data.data as Conversation;
  }

  const conversationId =
    data?.id ||
    data?.conversationId ||
    data?.conversation_id ||
    data?.data?.id;

  if (conversationId) {
    return {
      id: Number(conversationId),
    };
  }

  throw new ChatApiError(
    "Chat was created but no conversation ID was returned.",
    500,
    data
  );
}

/* =========================================================
   REAL-TIME EVENTS
========================================================= */

export function onNewMessage(
  callback: (message: Message) => void
): () => void {
  const s = connectSocket();

  const handler = (message: Message) => {
    if (!message) return;

    if (isDev) {
      console.log(
        "[Chat Socket] New message:",
        message
      );
    }

    callback(message);
  };

  s.on("new_message", handler);

  return () => {
    s.off("new_message", handler);
  };
}

/* =========================================================
   SOCKET STATUS EVENTS
========================================================= */

export function onSocketConnect(
  callback: () => void
): () => void {
  const s = connectSocket();

  s.on("connect", callback);

  return () => {
    s.off("connect", callback);
  };
}

export function onSocketDisconnect(
  callback: () => void
): () => void {
  const s = connectSocket();

  s.on("disconnect", callback);

  return () => {
    s.off("disconnect", callback);
  };
}

export function onSocketError(
  callback: (error: Error) => void
): () => void {
  const s = connectSocket();

  s.on("connect_error", callback);

  return () => {
    s.off("connect_error", callback);
  };
}