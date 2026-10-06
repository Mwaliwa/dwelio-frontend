// src/pages/chat/ChatList.tsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonBadge,
  IonSpinner,
  IonText,
  IonButtons,
  IonBackButton,
  IonSearchbar,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  IonButton,
  IonChip,
  IonToast,
} from "@ionic/react";
import {
  chatbubblesOutline,
  personOutline,
  refreshOutline,
  searchOutline,
  timeOutline,
  businessOutline,
  chevronForwardOutline,
  alertCircleOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  getConversations,
  Conversation,
  UserRole,
} from "../../services/chatService";

/* =========================================================
   PROPS
========================================================= */

interface Props {
  role?: UserRole;
  basePath?: string;
}

/* =========================================================
   HELPERS
========================================================= */

const formatMessageTime = (dateString?: string | null): string => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
  });
};

/* =========================================================
   COMPONENT
========================================================= */

const ChatList: React.FC<Props> = ({ role: propRole, basePath: propBasePath }) => {
  const { user, logout } = useAuth();
  const history = useHistory();

  // Safe defaults
  const role: UserRole = propRole || (user?.role as UserRole) || "customer";
  const basePath = propBasePath || (role === "customer" ? "/customer/chat" : "/agent/chat");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  /* -------------------------------------------------------
     LOAD
  ------------------------------------------------------- */

  const loadConversations = useCallback(
    async (isRefresh = false) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        if (!isRefresh) setError(null);

        const data = await getConversations(role);
        setConversations(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("Failed to load conversations:", err);

        // Handle expired / invalid token
        if (err?.status === 401 || err?.status === 403) {
          logout?.();
          history.replace("/login");
          return;
        }

        const message = err?.message || "Failed to load conversations";
        setError(message);
        if (isRefresh) setToastMessage(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, role, history, logout]
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  /* -------------------------------------------------------
     REFRESH
  ------------------------------------------------------- */

  const handleRefresh = async (event: CustomEvent) => {
    setRefreshing(true);
    await loadConversations(true);
    event.detail.complete();
  };

  /* -------------------------------------------------------
     DERIVED
  ------------------------------------------------------- */

  const getUnreadCount = (conv: Conversation): number => {
    // Support both old and new backend shapes
    if (typeof (conv as any).unread_count === "number") {
      return (conv as any).unread_count;
    }
    return role === "customer"
      ? Number(conv.unread_by_customer ?? 0)
      : Number(conv.unread_by_agent ?? 0);
  };

  const getOtherPersonName = (conv: Conversation): string => {
    return role === "customer"
      ? conv.agent_name || "Property Agent"
      : conv.customer_name || "Customer";
  };

  const getPropertyName = (conv: Conversation): string => {
    return (
      (conv as any).property_name ||
      conv.property_title ||
      "Property"
    );
  };

  const filteredConversations = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((conv) => {
      const name = getOtherPersonName(conv).toLowerCase();
      const property = getPropertyName(conv).toLowerCase();
      const lastMsg = (conv.last_message || "").toLowerCase();

      return (
        name.includes(query) ||
        property.includes(query) ||
        lastMsg.includes(query)
      );
    });
  }, [conversations, searchText, role]);

  const totalUnread = useMemo(
    () =>
      conversations.reduce(
        (sum, conv) => sum + getUnreadCount(conv),
        0
      ),
    [conversations, role]
  );

  const defaultBackHref =
    role === "customer" ? "/customer" : "/agent/dashboard";

  /* -------------------------------------------------------
     NAVIGATION
  ------------------------------------------------------- */

  const openChat = (conv: Conversation) => {
    if (!conv?.id) return;
    history.push(`${basePath}/${conv.id}`);
  };

  /* -------------------------------------------------------
     NOT LOGGED IN
  ------------------------------------------------------- */

  if (!user) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Messages</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="loading-state">
            <IonIcon
              icon={alertCircleOutline}
              style={{ fontSize: 42, color: "var(--ion-color-danger)" }}
            />
            <h3>Please log in</h3>
            <p>You need to be logged in to view your messages.</p>
            <IonButton routerLink="/login" expand="block">
              Go to Login
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  /* -------------------------------------------------------
     LOADING
  ------------------------------------------------------- */

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref={defaultBackHref} />
            </IonButtons>
            <IonTitle>Messages</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="loading-state">
            <IonSpinner name="crescent" />
            <p>Loading conversations…</p>
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
      <IonHeader className="chat-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={defaultBackHref} />
          </IonButtons>

          <IonTitle>
            <div className="title-row">
              <span>Messages</span>
              {totalUnread > 0 && (
                <IonBadge color="danger" className="title-badge">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </IonBadge>
              )}
            </div>
          </IonTitle>

          <IonButtons slot="end">
            <IonButton
              onClick={() => loadConversations()}
              disabled={refreshing}
              aria-label="Refresh conversations"
            >
              <IonIcon slot="icon-only" icon={refreshOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>

        <div className="header-summary">
          <div className="summary-left">
            <IonIcon icon={chatbubblesOutline} />
            <span>
              {conversations.length}{" "}
              {conversations.length === 1 ? "conversation" : "conversations"}
            </span>
          </div>

          {totalUnread > 0 && (
            <IonChip color="danger" className="unread-chip">
              <IonIcon icon={chatbubblesOutline} />
              <IonLabel>{totalUnread} unread</IonLabel>
            </IonChip>
          )}
        </div>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="search-wrap">
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value ?? "")}
            placeholder="Search by name, property or message"
            animated
            debounce={250}
          />
        </div>

        {/* Error (when no data) */}
        {error && conversations.length === 0 && (
          <div className="error-card">
            <IonIcon icon={alertCircleOutline} />
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
            <IonButton
              size="small"
              fill="outline"
              onClick={() => loadConversations()}
            >
              Try again
            </IonButton>
          </div>
        )}

        {/* Empty state */}
        {!error && conversations.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <IonIcon icon={chatbubblesOutline} />
            </div>
            <h2>No conversations yet</h2>
            <p>
              {role === "customer"
                ? "Your chats with property agents will appear here."
                : "Conversations with customers will appear here."}
            </p>
          </div>
        )}

        {/* No search results */}
        {!error &&
          conversations.length > 0 &&
          filteredConversations.length === 0 && (
            <div className="empty-state compact">
              <div className="empty-icon muted">
                <IonIcon icon={searchOutline} />
              </div>
              <h2>No matches</h2>
              <p>No conversations match “{searchText}”.</p>
              <IonButton fill="clear" onClick={() => setSearchText("")}>
                Clear search
              </IonButton>
            </div>
          )}

        {/* Conversation list */}
        {filteredConversations.length > 0 && (
          <IonList lines="none" className="conversation-list">
            {filteredConversations.map((conv) => {
              const unread = getUnreadCount(conv);
              const otherName = getOtherPersonName(conv);
              const propertyName = getPropertyName(conv);
              const message = conv.last_message || "Start a conversation…";

              return (
                <IonItem
                  key={conv.id}
                  button
                  detail={false}
                  onClick={() => openChat(conv)}
                  className={`conversation-item ${
                    unread > 0 ? "is-unread" : ""
                  }`}
                >
                  <IonAvatar slot="start">
                    {(conv as any).avatar ? (
                      <img src={(conv as any).avatar} alt={otherName} />
                    ) : (
                      <div className="avatar-fallback">
                        <IonIcon icon={personOutline} />
                      </div>
                    )}
                  </IonAvatar>

                  <IonLabel>
                    <div className="item-top">
                      <h2 className="person-name">{otherName}</h2>
                      <span className="time">
                        <IonIcon icon={timeOutline} />
                        {formatMessageTime(conv.last_message_at)}
                      </span>
                    </div>

                    <div className="property-row">
                      <IonIcon icon={businessOutline} />
                      <span>{propertyName}</span>
                    </div>

                    <p className={`preview ${unread > 0 ? "bold" : ""}`}>
                      {message}
                    </p>
                  </IonLabel>

                  <div slot="end" className="item-end">
                    {unread > 0 && (
                      <IonBadge color="primary" className="unread-badge">
                        {unread > 99 ? "99+" : unread}
                      </IonBadge>
                    )}
                    <IonIcon
                      className="chevron"
                      icon={chevronForwardOutline}
                    />
                  </div>
                </IonItem>
              );
            })}
          </IonList>
        )}

        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage}
          duration={3200}
          position="bottom"
          color="danger"
          onDidDismiss={() => setToastMessage("")}
        />
      </IonContent>

      <style>{`
  :root {
    --malohub-deep: #0b211b;
    --malohub-dark: #10382b;
    --malohub-green: #167a52;
    --malohub-emerald: #20a06b;
    --malohub-light: #e8f5ee;
    --malohub-gold: #d8ad5a;
    --malohub-gold-light: #f1d99c;
    --malohub-text: #16352b;
    --malohub-muted: #70857d;
    --malohub-white: #ffffff;
    --malohub-border: rgba(22, 122, 82, 0.14);
  }

  /* =========================
     MAIN CHAT BACKGROUND
     ========================= */

  ion-content {
    --background:
      radial-gradient(
        circle at 10% 10%,
        rgba(32, 160, 107, 0.14),
        transparent 30%
      ),
      radial-gradient(
        circle at 90% 20%,
        rgba(216, 173, 90, 0.13),
        transparent 28%
      ),
      linear-gradient(
        135deg,
        #eef8f2 0%,
        #f7faf7 45%,
        #e7f3ed 100%
      );

    --color: var(--malohub-text);
  }

  /* =========================
     PAGE CONTAINER
     ========================= */

  .chat-page {
    min-height: 100%;
    background:
      radial-gradient(
        circle at top left,
        rgba(32, 160, 107, 0.16),
        transparent 32%
      ),
      radial-gradient(
        circle at bottom right,
        rgba(216, 173, 90, 0.12),
        transparent 30%
      );
  }

  /* =========================
     HEADER
     ========================= */

  .chat-header {
    position: relative;
    overflow: hidden;
    background:
      linear-gradient(
        135deg,
        #0b211b 0%,
        #10382b 48%,
        #167a52 100%
      );
    color: white;
    border: none;
    box-shadow:
      0 10px 35px rgba(11, 33, 27, 0.22);
  }

  .chat-header::before {
    content: "";
    position: absolute;
    width: 220px;
    height: 220px;
    top: -120px;
    right: -70px;
    border-radius: 50%;
    background: rgba(216, 173, 90, 0.18);
    pointer-events: none;
  }

  .chat-header::after {
    content: "";
    position: absolute;
    width: 150px;
    height: 150px;
    bottom: -100px;
    left: 20%;
    border-radius: 50%;
    background: rgba(32, 160, 107, 0.2);
    pointer-events: none;
  }

  .title-row {
    position: relative;
    z-index: 2;
  }

  .title-row h1,
  .title-row h2,
  .title-row h3,
  .title {
    color: #ffffff;
  }

  .title-badge {
    background: linear-gradient(
      135deg,
      var(--malohub-gold),
      var(--malohub-gold-light)
    );
    color: #18352b;
    border: none;
    box-shadow:
      0 6px 18px rgba(216, 173, 90, 0.25);
  }

  .header-summary {
    position: relative;
    z-index: 2;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.13);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 18px;
  }

  .summary-left {
    color: rgba(255, 255, 255, 0.9);
  }

  .unread-chip {
    background: linear-gradient(
      135deg,
      var(--malohub-gold),
      #c9953d
    );
    color: #17352a;
    border: none;
    box-shadow:
      0 4px 12px rgba(216, 173, 90, 0.25);
  }

  /* =========================
     SEARCH
     ========================= */

  .search-wrap {
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(22, 122, 82, 0.12);
    border-radius: 18px;
    box-shadow:
      0 8px 28px rgba(22, 75, 54, 0.08);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
  }

  .search-wrap:focus-within {
    border-color: rgba(32, 160, 107, 0.45);
    box-shadow:
      0 0 0 4px rgba(32, 160, 107, 0.08),
      0 10px 30px rgba(22, 75, 54, 0.1);
  }

  .search-wrap ion-searchbar {
    --background: transparent;
    --box-shadow: none;
    --color: var(--malohub-text);
    --placeholder-color: #82968e;
    --icon-color: var(--malohub-green);
  }

  /* =========================
     CONVERSATION LIST
     ========================= */

  .conversation-list {
    background: transparent;
  }

  .conversation-item {
    position: relative;
    overflow: hidden;
    background:
      linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.88),
        rgba(239, 248, 243, 0.88)
      );
    border: 1px solid var(--malohub-border);
    border-radius: 20px;
    margin-bottom: 12px;
    box-shadow:
      0 6px 20px rgba(18, 67, 48, 0.07);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease,
      border-color 0.2s ease;
  }

  .conversation-item::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(
      180deg,
      var(--malohub-emerald),
      var(--malohub-gold)
    );
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .conversation-item:hover {
    transform: translateY(-3px);
    border-color: rgba(32, 160, 107, 0.25);
    box-shadow:
      0 14px 30px rgba(18, 67, 48, 0.12);
  }

  .conversation-item:hover::before {
    opacity: 1;
  }

  /* =========================
     UNREAD CONVERSATION
     ========================= */

  .conversation-item.is-unread {
    background:
      linear-gradient(
        135deg,
        rgba(225, 246, 235, 0.98),
        rgba(246, 250, 247, 0.98)
      );
    border-color: rgba(32, 160, 107, 0.22);
    box-shadow:
      0 8px 25px rgba(22, 122, 82, 0.1);
  }

  .conversation-item.is-unread::before {
    opacity: 1;
  }

  /* =========================
     AVATAR
     ========================= */

  .avatar-fallback {
    background:
      linear-gradient(
        135deg,
        var(--malohub-dark),
        var(--malohub-emerald)
      );
    color: white;
    border: 3px solid rgba(255, 255, 255, 0.9);
    box-shadow:
      0 5px 16px rgba(16, 56, 43, 0.2);
  }

  .avatar-fallback::after {
    content: "";
    position: absolute;
    width: 9px;
    height: 9px;
    right: 1px;
    bottom: 2px;
    border-radius: 50%;
    background: #45c98a;
    border: 2px solid white;
  }

  /* =========================
     AGENT INFORMATION
     ========================= */

  .agent-name {
    color: var(--malohub-text);
    font-weight: 700;
  }

  .time {
    color: var(--malohub-muted);
  }

  .preview {
    color: #6b8178;
  }

  /* =========================
     PROPERTY ROW
     ========================= */

  .property-row {
    background:
      linear-gradient(
        135deg,
        rgba(22, 122, 82, 0.07),
        rgba(216, 173, 90, 0.07)
      );
    border: 1px solid rgba(22, 122, 82, 0.09);
    border-radius: 12px;
  }

  .property-row ion-icon {
    color: var(--malohub-gold);
  }

  /* =========================
     UNREAD BADGE
     ========================= */

  .unread-badge {
    background:
      linear-gradient(
        135deg,
        var(--malohub-emerald),
        var(--malohub-green)
      );
    color: white;
    border: none;
    box-shadow:
      0 4px 12px rgba(32, 160, 107, 0.25);
  }

  /* =========================
     CHEVRON
     ========================= */

  .chevron {
    color: var(--malohub-green);
    opacity: 0.65;
    transition:
      transform 0.2s ease,
      opacity 0.2s ease;
  }

  .conversation-item:hover .chevron {
    transform: translateX(4px);
    opacity: 1;
  }

  /* =========================
     EMPTY STATE
     ========================= */

  .empty-state {
    background:
      linear-gradient(
        145deg,
        rgba(255, 255, 255, 0.78),
        rgba(230, 245, 237, 0.82)
      );
    border: 1px solid rgba(22, 122, 82, 0.1);
    border-radius: 24px;
    box-shadow:
      0 12px 35px rgba(18, 67, 48, 0.08);
  }

  .empty-icon {
    background:
      linear-gradient(
        135deg,
        var(--malohub-light),
        #d7eee2
      );
    color: var(--malohub-green);
    border: 1px solid rgba(32, 160, 107, 0.1);
    box-shadow:
      0 8px 22px rgba(22, 122, 82, 0.1);
  }

  /* =========================
     CTA BUTTON
     ========================= */

  .cta-button {
    background:
      linear-gradient(
        135deg,
        var(--malohub-green),
        var(--malohub-emerald)
      );
    color: white;
    border: none;
    border-radius: 14px;
    box-shadow:
      0 8px 20px rgba(22, 122, 82, 0.25);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  .cta-button:hover {
    transform: translateY(-2px);
    box-shadow:
      0 12px 25px rgba(22, 122, 82, 0.32);
  }

  .cta-button:active {
    transform: translateY(0);
  }

  /* =========================
     LOADING STATE
     ========================= */

  .loading-state {
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(22, 122, 82, 0.08);
    border-radius: 20px;
    box-shadow:
      0 8px 25px rgba(18, 67, 48, 0.06);
  }

  /* =========================
     ERROR CARD
     ========================= */

  .error-card {
    background:
      linear-gradient(
        135deg,
        rgba(255, 247, 235, 0.96),
        rgba(255, 241, 220, 0.96)
      );
    border: 1px solid rgba(216, 173, 90, 0.3);
    border-radius: 18px;
    color: #694f27;
    box-shadow:
      0 8px 25px rgba(120, 87, 30, 0.08);
  }

  /* =========================
     FLOATING ACTION AREA
     ========================= */

  .fab-spacer {
    background: transparent;
  }

  /* =========================
     SCROLLBAR
     ========================= */

  ::-webkit-scrollbar {
    width: 7px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(22, 122, 82, 0.04);
  }

  ::-webkit-scrollbar-thumb {
    background:
      linear-gradient(
        180deg,
        var(--malohub-emerald),
        var(--malohub-green)
      );
    border-radius: 10px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--malohub-dark);
  }

  /* =========================
     MOBILE
     ========================= */

  @media (max-width: 600px) {
    .chat-header {
      border-radius: 0 0 24px 24px;
    }

    .conversation-item {
      border-radius: 17px;
      margin-bottom: 10px;
    }

    .search-wrap {
      border-radius: 16px;
    }
  }
`}</style>
    </IonPage>
  );
};

export default ChatList;