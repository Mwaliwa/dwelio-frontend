// src/pages/chat/ChatRoom.tsx

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter,
  IonInput,
  IonButton,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonText,
  IonIcon,
  IonToast,
  IonActionSheet,
} from "@ionic/react";
import {
  sendOutline,
  chatbubblesOutline,
  alertCircleOutline,
  refreshOutline,
  ellipsisVertical,
} from "ionicons/icons";
import { useParams } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import {
  connectSocket,
  getMessages,
  sendMessage,
  markAsRead,
  onNewMessage,
  Message,
  UserRole,
} from "../../services/chatService";

/* =========================================================
   TYPES
========================================================= */

interface Props {
  role: UserRole;
}

interface OptimisticMessage extends Omit<Message, "id"> {
  id: number | string;
  _optimistic?: boolean;
  _failed?: boolean;
  _tempId?: string;
}

/* =========================================================
   HELPERS
========================================================= */

const formatTime = (date?: string | null): string => {
  if (!date) return "";
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return "";

  return parsed.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDayDivider = (date?: string | null): string => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  ) {
    return "Yesterday";
  }

  return d.toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

const shouldShowDayDivider = (
  current: OptimisticMessage,
  previous?: OptimisticMessage
): boolean => {
  if (!previous) return true;
  if (!current.created_at || !previous.created_at) return false;

  const curr = new Date(current.created_at);
  const prev = new Date(previous.created_at);

  return (
    curr.getDate() !== prev.getDate() ||
    curr.getMonth() !== prev.getMonth() ||
    curr.getFullYear() !== prev.getFullYear()
  );
};

/* =========================================================
   COMPONENT
========================================================= */

const ChatRoom: React.FC<Props> = ({ role }) => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [messages, setMessages] = useState<OptimisticMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedFailedId, setSelectedFailedId] = useState<string | number | null>(null);

  const contentRef = useRef<HTMLIonContentElement | null>(null);
  const mountedRef = useRef(true);
  const inputRef = useRef<HTMLIonInputElement | null>(null);
  const socketRef = useRef<any>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const backUrl = role === "customer" ? "/customer/chat" : "/agent/chat";

  /* -------------------------------------------------------
     SCROLL
  ------------------------------------------------------- */

  const scrollToBottom = useCallback((smooth = true) => {
    // Small delay so the DOM has time to render the new message
    setTimeout(async () => {
      if (!mountedRef.current) return;
      try {
        await contentRef.current?.scrollToBottom(smooth ? 280 : 0);
      } catch {
        // ignore scroll errors
      }
    }, 60);
  }, []);

  /* -------------------------------------------------------
     ADD MESSAGE SAFELY (prevents duplicates)
  ------------------------------------------------------- */

  const addMessageSafely = useCallback((message: Message | OptimisticMessage) => {
    setMessages((prev) => {
      // 1. Exact ID match
      if (prev.some((m) => String(m.id) === String(message.id))) {
        return prev;
      }

      // 2. Match by temporary optimistic id (when server returns the real message)
      if ((message as any)._tempId) {
        const idx = prev.findIndex((m) => m.id === (message as any)._tempId);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...message, _optimistic: false, _failed: false };
          return updated;
        }
      }

      // 3. Content + sender + rough timestamp match (extra safety)
      const alreadyExists = prev.some(
        (m) =>
          m.text === message.text &&
          String(m.sender_id) === String(message.sender_id) &&
          Math.abs(
            new Date(m.created_at || 0).getTime() -
              new Date(message.created_at || 0).getTime()
          ) < 8000
      );

      if (alreadyExists) return prev;

      return [...prev, message];
    });
  }, []);

  /* -------------------------------------------------------
     INITIALIZE CHAT
  ------------------------------------------------------- */

  useEffect(() => {
    mountedRef.current = true;

    if (!id) {
      setLoading(false);
      setError("Invalid conversation ID.");
      return;
    }

    if (!user) {
      setLoading(false);
      setError("You are not logged in.");
      return;
    }

    const initializeChat = async () => {
      try {
        setLoading(true);
        setError("");
        setMessages([]);

        // --- Socket ---
        try {
          const socket = connectSocket();
          socketRef.current = socket;

          if (socket) {
            socket.emit("join_conversation", String(id));

            // Optional: listen for reconnection
            socket.on?.("connect", () => {
              socket.emit("join_conversation", String(id));
            });
          }
        } catch (socketErr) {
          console.warn("Socket connection failed:", socketErr);
        }

        // --- Load messages ---
        const result = await getMessages(String(id));

        if (!mountedRef.current) return;

        const safeMessages = Array.isArray(result) ? result : [];
        setMessages(safeMessages);

        // --- Mark as read ---
        try {
          await markAsRead(String(id));
        } catch (readErr) {
          console.warn("Could not mark messages as read:", readErr);
        }

        // --- Real-time listener ---
        unsubscribeRef.current = onNewMessage((message: Message) => {
          if (!mountedRef.current) return;
          if (String(message.conversation_id) !== String(id)) return;

          addMessageSafely(message);
          scrollToBottom();
        });
      } catch (err: any) {
        console.error("Chat initialization error:", err);
        if (mountedRef.current) {
          setError(err?.message || "Unable to load this conversation.");
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    initializeChat();

    return () => {
      mountedRef.current = false;

      try {
        if (socketRef.current) {
          socketRef.current.emit("leave_conversation", String(id));
        }
      } catch {
        // ignore
      }

      try {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      } catch {
        // ignore
      }

      socketRef.current = null;
      unsubscribeRef.current = null;
    };
  }, [id, user?.id, addMessageSafely, scrollToBottom]);

  /* -------------------------------------------------------
     AUTO-SCROLL
  ------------------------------------------------------- */

  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom(false);
    }
  }, [loading]); // only on first load

  /* -------------------------------------------------------
     SEND MESSAGE
  ------------------------------------------------------- */

  const handleSend = async (retryText?: string, retryTempId?: string | number) => {
    const trimmed = (retryText ?? text).trim();
    if (!trimmed || !id || !user || sending) return;

    setSending(true);
    setError("");

    const temporaryId = retryTempId || `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // If this is a retry, remove the old failed message first
    if (retryTempId) {
      setMessages((prev) => prev.filter((m) => m.id !== retryTempId));
    }

    const optimistic: OptimisticMessage = {
      id: temporaryId,
      conversation_id: Number(id),
      sender_id: Number(user.id),
      text: trimmed,
      created_at: new Date().toISOString(),
      is_read: false,
      _optimistic: true,
      _tempId: String(temporaryId),
    };

    setMessages((prev) => [...prev, optimistic]);
    if (!retryText) setText("");
    scrollToBottom();

    // Keep focus on input
    setTimeout(() => {
      inputRef.current?.setFocus();
    }, 40);

    try {
      const saved = await sendMessage(String(id), trimmed);

      if (!mountedRef.current) return;

      // Replace optimistic message with the real one
      setMessages((prev) =>
        prev.map((m) =>
          m.id === temporaryId
            ? { ...saved, _optimistic: false, _failed: false }
            : m
        )
      );

      scrollToBottom();
    } catch (err: any) {
      console.error("Send message error:", err);

      if (!mountedRef.current) return;

      // Mark as failed
      setMessages((prev) =>
        prev.map((m) =>
          m.id === temporaryId
            ? { ...m, _optimistic: false, _failed: true }
            : m
        )
      );

      if (!retryText) {
        setText(trimmed); // restore text so user can edit
      }

      setToastMessage(err?.message || "Failed to send message. Tap to retry.");
    } finally {
      if (mountedRef.current) setSending(false);
    }
  };

  /* -------------------------------------------------------
     RETRY FAILED MESSAGE
  ------------------------------------------------------- */

  const handleRetry = (message: OptimisticMessage) => {
    if (!message._failed) return;
    handleSend(message.text, message.id);
  };

  /* -------------------------------------------------------
     NOT LOGGED IN
  ------------------------------------------------------- */

  if (!user) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref={backUrl} text="" />
            </IonButtons>
            <IonTitle>Chat</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <div className="center-state">
            <IonIcon icon={alertCircleOutline} className="state-icon danger" />
            <h3>Please log in again</h3>
            <p>Your session has expired.</p>
            <IonButton routerLink="/login" expand="block">
              Go to Login
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <IonPage>
      <IonHeader className="chat-room-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={backUrl} text="" />
          </IonButtons>
          <IonTitle>Chat</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        ref={contentRef}
        className="chat-content"
        scrollEvents
        forceOverscroll={false}
      >
        <div className="messages-container">
          {/* Loading */}
          {loading && (
            <div className="center-state">
              <IonSpinner name="crescent" />
              <p>Loading conversation…</p>
            </div>
          )}

          {/* Error with no messages */}
          {!loading && error && messages.length === 0 && (
            <div className="center-state">
              <IonIcon icon={alertCircleOutline} className="state-icon danger" />
              <IonText color="danger">
                <p>{error}</p>
              </IonText>
              <IonButton
                fill="outline"
                size="small"
                onClick={() => window.location.reload()}
              >
                <IonIcon slot="start" icon={refreshOutline} />
                Retry
              </IonButton>
            </div>
          )}

          {/* Empty conversation */}
          {!loading && !error && messages.length === 0 && (
            <div className="center-state">
              <div className="empty-icon">
                <IonIcon icon={chatbubblesOutline} />
              </div>
              <h3>No messages yet</h3>
              <p>Say hello 👋 and start the conversation.</p>
            </div>
          )}

          {/* Messages */}
          {!loading && messages.length > 0 && (
            <>
              {messages.map((message, index) => {
                const mine = String(message.sender_id) === String(user.id);
                const showDivider = shouldShowDayDivider(
                  message,
                  messages[index - 1]
                );

                return (
                  <React.Fragment key={String(message.id)}>
                    {showDivider && (
                      <div className="day-divider">
                        <span>{formatDayDivider(message.created_at)}</span>
                      </div>
                    )}

                    <div className={`bubble-row ${mine ? "mine" : "theirs"}`}>
                      <div
                        className={`bubble ${
                          mine ? "bubble-mine" : "bubble-theirs"
                        } ${message._optimistic ? "optimistic" : ""} ${
                          message._failed ? "failed" : ""
                        }`}
                        onClick={() => {
                          if (message._failed) {
                            setSelectedFailedId(message.id);
                            setShowActionSheet(true);
                          }
                        }}
                      >
                        <div className="bubble-text">{message.text}</div>

                        <div className="bubble-meta">
                          {formatTime(message.created_at)}
                          {message._optimistic && " · Sending…"}
                          {message._failed && " · Failed · Tap to retry"}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </>
          )}
        </div>
      </IonContent>

      {/* Footer / Composer */}
      <IonFooter className="chat-footer">
        <IonToolbar>
          <div className="composer">
            <IonInput
              ref={inputRef}
              value={text}
              placeholder="Type a message…"
              disabled={sending || loading}
              onIonInput={(e) => setText(e.detail.value ?? "")}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="composer-input"
              enterkeyhint="send"
            />

            <IonButton
              className="send-button"
              onClick={() => handleSend()}
              disabled={!text.trim() || sending || loading}
              fill="clear"
            >
              {sending ? (
                <IonSpinner name="dots" />
              ) : (
                <IonIcon icon={sendOutline} />
              )}
            </IonButton>
          </div>
        </IonToolbar>
      </IonFooter>

      {/* Toast */}
      <IonToast
        isOpen={!!toastMessage}
        message={toastMessage}
        duration={3500}
        position="top"
        color="danger"
        onDidDismiss={() => setToastMessage("")}
      />

      {/* Action sheet for failed messages */}
      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => {
          setShowActionSheet(false);
          setSelectedFailedId(null);
        }}
        header="Message failed"
        buttons={[
          {
            text: "Retry sending",
            handler: () => {
              const msg = messages.find((m) => m.id === selectedFailedId);
              if (msg) handleRetry(msg);
            },
          },
          {
            text: "Delete",
            role: "destructive",
            handler: () => {
              setMessages((prev) =>
                prev.filter((m) => m.id !== selectedFailedId)
              );
            },
          },
          {
            text: "Cancel",
            role: "cancel",
          },
        ]}
      />

      <style>{`
        /* ---------- Header ---------- */
        .chat-room-header {
          box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
        }

        /* ---------- Content ---------- */
        .chat-content {
          --background: #f4f6f9;
        }

        .messages-container {
          padding: 16px 14px 24px;
          min-height: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        /* ---------- Center states ---------- */
        .center-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 24px;
          color: var(--ion-color-medium);
        }

        .center-state h3 {
          margin: 12px 0 6px;
          font-size: 18px;
          font-weight: 700;
          color: var(--ion-text-color);
        }

        .center-state p {
          margin: 0 0 16px;
          font-size: 14px;
          line-height: 1.5;
        }

        .state-icon {
          font-size: 42px;
        }

        .state-icon.danger {
          color: var(--ion-color-danger);
        }

        .empty-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--ion-color-primary);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          box-shadow: 0 6px 20px rgba(var(--ion-color-primary-rgb), 0.25);
        }

        .empty-icon ion-icon {
          font-size: 34px;
        }

        /* ---------- Day divider ---------- */
        .day-divider {
          display: flex;
          justify-content: center;
          margin: 18px 0 12px;
        }

        .day-divider span {
          background: rgba(0, 0, 0, 0.06);
          color: var(--ion-color-medium);
          font-size: 11px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 20px;
        }

        /* ---------- Bubbles ---------- */
        .bubble-row {
          display: flex;
          margin-bottom: 8px;
        }

        .bubble-row.mine {
          justify-content: flex-end;
        }

        .bubble-row.theirs {
          justify-content: flex-start;
        }

        .bubble {
          max-width: 78%;
          padding: 10px 14px 7px;
          border-radius: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          transition: opacity 0.2s ease;
          position: relative;
        }

        .bubble-mine {
          background: var(--ion-color-primary);
          color: #fff;
          border-bottom-right-radius: 5px;
        }

        .bubble-theirs {
          background: #ffffff;
          color: #1a1a1a;
          border-bottom-left-radius: 5px;
        }

        .bubble.optimistic {
          opacity: 0.7;
        }

        .bubble.failed {
          opacity: 0.9;
          outline: 1.5px solid var(--ion-color-danger);
          cursor: pointer;
        }

        .bubble-text {
          font-size: 15px;
          line-height: 1.45;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .bubble-meta {
          font-size: 10px;
          margin-top: 4px;
          text-align: right;
          opacity: 0.75;
        }

        /* ---------- Composer ---------- */
        .chat-footer {
          box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
        }

        .chat-footer ion-toolbar {
          --padding-start: 10px;
          --padding-end: 10px;
          --padding-top: 8px;
          --padding-bottom: 8px;
        }

        .composer {
          display: flex;
          align-items: center;
          gap: 6px;
          width: 100%;
        }

        .composer-input {
          flex: 1;
          --background: var(--ion-color-light);
          --padding-start: 16px;
          --padding-end: 16px;
          --border-radius: 24px;
          --placeholder-opacity: 0.6;
          min-height: 44px;
        }

        .send-button {
          --padding-start: 10px;
          --padding-end: 10px;
          height: 44px;
          width: 44px;
          margin: 0;
        }

        .send-button ion-icon {
          font-size: 22px;
          color: var(--ion-color-primary);
        }

        .send-button[disabled] ion-icon {
          color: var(--ion-color-medium);
        }

        /* ---------- Desktop ---------- */
        @media (min-width: 768px) {
          .messages-container {
            max-width: 720px;
            margin: 0 auto;
          }

          .composer {
            max-width: 720px;
            margin: 0 auto;
          }
        }
      `}</style>
    </IonPage>
  );
};

export default ChatRoom;