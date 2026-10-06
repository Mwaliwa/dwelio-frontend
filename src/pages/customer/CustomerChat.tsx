
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonBadge,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  IonButton,
  IonButtons,
  IonChip,
  IonFab,
  IonFabButton,
  IonToast,
  IonText,
} from "@ionic/react";

import {
  chatbubblesOutline,
  personOutline,
  refreshOutline,
  searchOutline,
  addOutline,
  chevronForwardOutline,
  timeOutline,
  businessOutline,
  alertCircleOutline,
  homeOutline,
  checkmarkCircleOutline,
} from "ionicons/icons";

import { useHistory } from "react-router-dom";

/* =========================================================
   MALOHUB CONFIGURATION
========================================================= */

const API_URL = "http://localhost:5001";

/* =========================================================
   TYPES
========================================================= */

interface Conversation {
  id: number;
  property_id?: number;
  property_name?: string;
  property_title?: string;
  agent_id?: number;
  agent_name?: string;
  customer_id?: number;
  customer_name?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  status?: string;
  avatar?: string;
}

/* =========================================================
   BRAND COLORS
========================================================= */

const BRAND = {
  green: "#142D26",
  emerald: "#16845B",
  gold: "#D5A65B",
  background: "#F8F8F4",
  navy: "#263746",
  muted: "#788782",
};

/* =========================================================
   HELPERS
========================================================= */

const getToken = (): string | null =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken");

const formatMessageTime = (dateString?: string): string => {
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

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
  });
};

const extractConversations = (data: unknown): Conversation[] => {
  if (Array.isArray(data)) return data as Conversation[];

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    if (Array.isArray(obj.conversations))
      return obj.conversations as Conversation[];

    if (Array.isArray(obj.chats))
      return obj.chats as Conversation[];

    if (Array.isArray(obj.data))
      return obj.data as Conversation[];
  }

  return [];
};

/* =========================================================
   CUSTOMER CHAT COMPONENT
========================================================= */

const CustomerChat: React.FC = () => {
  const history = useHistory();

  /* -------------------------------------------------------
     STATE
  ------------------------------------------------------- */

  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  const [searchText, setSearchText] = useState("");

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [toastMessage, setToastMessage] = useState("");

  /* -------------------------------------------------------
     LOAD CONVERSATIONS
  ------------------------------------------------------- */

  const loadConversations = useCallback(
    async (isRefresh = false) => {
      try {
        if (!isRefresh) {
          setError("");
        }

        const token = getToken();

        if (!token) {
          history.replace("/login");
          return;
        }

        const response = await fetch(`${API_URL}/api/chat`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("authToken");
          localStorage.removeItem("accessToken");

          history.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();

        setConversations(extractConversations(data));
        setError("");
      } catch (err) {
        console.error("MALOHUB CHAT ERROR:", err);

        const message =
          "Unable to load your conversations. Please check your connection and try again.";

        setError(message);

        if (isRefresh) {
          setToastMessage(message);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [history]
  );

  /* -------------------------------------------------------
     INITIAL LOAD
  ------------------------------------------------------- */

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
     FILTER CONVERSATIONS
  ------------------------------------------------------- */

  const filteredConversations = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) return conversations;

    return conversations.filter((chat) => {
      const agent = (chat.agent_name || "").toLowerCase();

      const property = (
        chat.property_name ||
        chat.property_title ||
        ""
      ).toLowerCase();

      const message = (chat.last_message || "").toLowerCase();

      return (
        agent.includes(query) ||
        property.includes(query) ||
        message.includes(query)
      );
    });
  }, [conversations, searchText]);

  /* -------------------------------------------------------
     UNREAD COUNTER
  ------------------------------------------------------- */

  const totalUnread = useMemo(
    () =>
      conversations.reduce(
        (sum, chat) =>
          sum + Math.max(0, Number(chat.unread_count || 0)),
        0
      ),
    [conversations]
  );

  /* -------------------------------------------------------
     NAVIGATION
  ------------------------------------------------------- */

  const openChat = (chat: Conversation) => {
    history.push(`/customer/chat/${chat.id}`);
  };

  const startNewChat = () => {
    history.push("/properties");
  };

  /* -------------------------------------------------------
     EMPTY STATE
  ------------------------------------------------------- */

  const EmptyState = () => (
    <div className="malohub-empty-state">
      <div className="malohub-empty-icon">
        <IonIcon icon={chatbubblesOutline} />
      </div>

      <span className="empty-eyebrow">
        MALOHUB MESSAGING
      </span>

      <h2>No conversations yet</h2>

      <p>
        Your conversations with property agents and
        landlords will appear here. Find a property
        and start your journey today.
      </p>

      <IonButton
        expand="block"
        onClick={startNewChat}
        className="malohub-cta"
      >
        <IonIcon slot="start" icon={homeOutline} />
        Explore Properties
      </IonButton>

      <div className="empty-trust">
        <IonIcon icon={checkmarkCircleOutline} />
        <span>Find properties. Connect with agents. Move forward.</span>
      </div>
    </div>
  );

  /* -------------------------------------------------------
     NO SEARCH RESULTS
  ------------------------------------------------------- */

  const NoResultsState = () => (
    <div className="malohub-empty-state compact">
      <div className="malohub-empty-icon muted">
        <IonIcon icon={searchOutline} />
      </div>

      <h2>No matches found</h2>

      <p>
        We couldn't find conversations matching
        "{searchText}".
      </p>

      <IonButton
        fill="clear"
        color="primary"
        onClick={() => setSearchText("")}
      >
        Clear search
      </IonButton>
    </div>
  );

  /* -------------------------------------------------------
     LOADING SCREEN
  ------------------------------------------------------- */

  if (loading) {
    return (
      <IonPage className="malohub-page">
        <IonHeader className="malohub-header">
          <IonToolbar>
            <IonTitle>
              <div className="malohub-brand">
                <div className="brand-icon">
                  <IonIcon icon={homeOutline} />
                </div>

                <div className="brand-text">
                  <strong>
                    Malo<span>hub</span>
                  </strong>
                  <small>REAL ESTATE • INVEST • GROW</small>
                </div>
              </div>
            </IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <div className="malohub-loading">
            <div className="loading-logo">
              <IonIcon icon={homeOutline} />
            </div>

            <IonSpinner name="crescent" />

            <h3>Loading messages</h3>

            <p>Connecting you with your property network...</p>
          </div>
        </IonContent>

        <style>{styles}</style>
      </IonPage>
    );
  }

  /* =========================================================
     MAIN RENDER
  ========================================================= */

  return (
    <IonPage className="malohub-page">

      {/* ================================================
          HEADER
      ================================================ */}

      <IonHeader className="malohub-header">
        <IonToolbar>
          <IonTitle>
            <div className="malohub-brand">
              <div className="brand-icon">
                <IonIcon icon={homeOutline} />
              </div>

              <div className="brand-text">
                <strong>
                  Malo<span>hub</span>
                </strong>

                <small>REAL ESTATE • INVEST • GROW</small>
              </div>
            </div>
          </IonTitle>

          <IonButtons slot="end">
            <IonButton
              onClick={() => loadConversations()}
              disabled={refreshing}
              aria-label="Refresh conversations"
              className="header-action"
            >
              <IonIcon
                slot="icon-only"
                icon={refreshOutline}
              />
            </IonButton>
          </IonButtons>
        </IonToolbar>

        {/* HEADER SUMMARY */}

        <div className="malohub-header-summary">
          <div>
            <div className="messages-title">
              <h1>Messages</h1>

              {totalUnread > 0 && (
                <IonBadge className="total-unread-badge">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </IonBadge>
              )}
            </div>

            <div className="messages-subtitle">
              <IonIcon icon={chatbubblesOutline} />

              <span>
                {conversations.length}{" "}
                {conversations.length === 1
                  ? "conversation"
                  : "conversations"}
              </span>

              {totalUnread > 0 && (
                <>
                  <span className="summary-dot">•</span>

                  <span className="unread-summary">
                    {totalUnread} unread
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </IonHeader>

      {/* ================================================
          CONTENT
      ================================================ */}

      <IonContent fullscreen className="malohub-content">

        {/* PULL TO REFRESH */}

        <IonRefresher
          slot="fixed"
          onIonRefresh={handleRefresh}
        >
          <IonRefresherContent
            pullingIcon={refreshOutline}
            pullingText="Pull to refresh"
            refreshingSpinner="crescent"
            refreshingText="Updating conversations..."
          />
        </IonRefresher>

        {/* SEARCH */}

        <div className="malohub-search-wrap">
          <div className="search-label">
            <span>YOUR CONVERSATIONS</span>
          </div>

          <IonSearchbar
            value={searchText}
            onIonInput={(e) =>
              setSearchText(e.detail.value ?? "")
            }
            placeholder="Search agent, property or message..."
            animated
            debounce={250}
            className="malohub-search"
          />
        </div>

        {/* ERROR STATE */}

        {error && conversations.length === 0 && (
          <div className="malohub-error-card">
            <div className="error-icon">
              <IonIcon icon={alertCircleOutline} />
            </div>

            <h3>Connection problem</h3>

            <p>{error}</p>

            <IonButton
              onClick={() => loadConversations()}
              className="malohub-cta"
              size="default"
            >
              <IonIcon slot="start" icon={refreshOutline} />
              Try Again
            </IonButton>
          </div>
        )}

        {/* EMPTY STATE */}

        {!error && conversations.length === 0 && (
          <EmptyState />
        )}

        {/* NO SEARCH RESULTS */}

        {!error &&
          conversations.length > 0 &&
          filteredConversations.length === 0 && (
            <NoResultsState />
          )}

        {/* CONVERSATION LIST */}

        {filteredConversations.length > 0 && (
          <IonList
            lines="none"
            className="malohub-conversation-list"
          >
            {filteredConversations.map((chat) => {
              const unread = Math.max(
                0,
                Number(chat.unread_count || 0)
              );

              const agentName =
                chat.agent_name || "Property Agent";

              const propertyName =
                chat.property_name ||
                chat.property_title ||
                "Property enquiry";

              const message =
                chat.last_message ||
                "Start a conversation with this agent...";

              return (
                <IonItem
                  key={chat.id}
                  button
                  detail={false}
                  onClick={() => openChat(chat)}
                  className={`malohub-conversation ${
                    unread > 0 ? "is-unread" : ""
                  }`}
                >
                  {/* AGENT AVATAR */}

                  <IonAvatar slot="start" className="agent-avatar">
                    {chat.avatar ? (
                      <img
                        src={chat.avatar}
                        alt={agentName}
                      />
                    ) : (
                      <div className="avatar-fallback">
                        <IonIcon icon={personOutline} />
                      </div>
                    )}
                  </IonAvatar>

                  {/* CONVERSATION DETAILS */}

                  <IonLabel className="conversation-details">

                    <div className="conversation-top">
                      <h2 className="agent-name">
                        {agentName}
                      </h2>

                      <span className="message-time">
                        <IonIcon icon={timeOutline} />
                        {formatMessageTime(chat.last_message_at)}
                      </span>
                    </div>

                    <div className="property-name">
                      <IonIcon icon={businessOutline} />
                      <span>{propertyName}</span>
                    </div>

                    <p
                      className={`message-preview ${
                        unread > 0 ? "unread-preview" : ""
                      }`}
                    >
                      {message}
                    </p>

                  </IonLabel>

                  {/* UNREAD INDICATOR */}

                  <div slot="end" className="conversation-end">
                    {unread > 0 && (
                      <IonBadge className="conversation-unread">
                        {unread > 99 ? "99+" : unread}
                      </IonBadge>
                    )}

                    <IonIcon
                      icon={chevronForwardOutline}
                      className="conversation-chevron"
                    />
                  </div>

                </IonItem>
              );
            })}
          </IonList>
        )}

        {/* FLOATING BUTTON SPACER */}

        <div className="malohub-fab-spacer" />

        {/* COMPOSE BUTTON */}

        <IonFab
          vertical="bottom"
          horizontal="end"
          slot="fixed"
          className="malohub-fab"
        >
          <IonFabButton
            onClick={startNewChat}
            aria-label="Find a property"
          >
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>

        {/* TOAST */}

        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage}
          duration={3200}
          position="bottom"
          color="danger"
          onDidDismiss={() => setToastMessage("")}
        />

      </IonContent>

      {/* ================================================
          MALOHUB STYLES
      ================================================ */}

      <style>{styles}</style>

    </IonPage>
  );
};

/* =========================================================
   COMPLETE MALOHUB STYLESHEET
========================================================= */

const styles = `

/* ==========================================
   BRAND COLORS
========================================== */

.malohub-page {
  --mh-green: #142D26;
  --mh-emerald: #16845B;
  --mh-gold: #D5A65B;
  --mh-gold-light: #F4E5C6;
  --mh-background: #F8F8F4;
  --mh-white: #FFFFFF;
  --mh-navy: #263746;
  --mh-muted: #788782;
  --mh-border: #E6EAE5;

  --ion-color-primary: #142D26;
  --ion-color-primary-rgb: 20, 45, 38;
  --ion-color-primary-contrast: #ffffff;
  --ion-color-primary-shade: #122720;
  --ion-color-primary-tint: #2c413a;

  --ion-background-color: #F8F8F4;
  --ion-text-color: #263746;
}

/* ==========================================
   HEADER
========================================== */

.malohub-header {
  background: var(--mh-green);
  box-shadow: 0 4px 18px rgba(20, 45, 38, 0.16);
}

.malohub-header ion-toolbar {
  --background: var(--mh-green);
  --color: #FFFFFF;
  --border-width: 0;
  --min-height: 76px;

  padding: 5px 8px;
}

.malohub-header ion-title {
  padding-inline-start: 12px;
  padding-inline-end: 8px;
}

/* ==========================================
   MALOHUB BRAND
========================================== */

.malohub-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon {
  width: 43px;
  height: 43px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 13px;

  background: linear-gradient(
    145deg,
    #E2B66C,
    #D5A65B
  );

  color: var(--mh-green);

  box-shadow: 0 4px 12px rgba(213, 166, 91, 0.20);
}

.brand-icon ion-icon {
  font-size: 25px;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.brand-text strong {
  font-size: 23px;
  font-weight: 850;
  letter-spacing: -1px;
  color: #FFFFFF;
}

.brand-text strong span {
  color: var(--mh-gold);
}

.brand-text small {
  color: #C5D5CD;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 1.4px;
}

/* ==========================================
   HEADER ACTIONS
========================================== */

.header-action {
  --color: #FFFFFF;
  --background-hover: rgba(255,255,255,0.10);

  width: 40px;
  height: 40px;
}

.header-action ion-icon {
  font-size: 21px;
}

/* ==========================================
   HEADER SUMMARY
========================================== */

.malohub-header-summary {
  padding: 8px 19px 18px;
  background: var(--mh-green);
}

.messages-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.messages-title h1 {
  margin: 0;

  color: #FFFFFF;

  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.7px;
}

.total-unread-badge {
  display: flex;
  align-items: center;
  justify-content: center;

  min-width: 24px;
  height: 24px;

  padding: 0 7px;

  border-radius: 9px;

  background: var(--mh-gold);
  color: var(--mh-green);

  font-size: 11px;
  font-weight: 800;
}

.messages-subtitle {
  display: flex;
  align-items: center;
  gap: 7px;

  margin-top: 8px;

  color: #C9D7D0;
  font-size: 12px;
  font-weight: 500;
}

.messages-subtitle ion-icon {
  font-size: 16px;
  color: var(--mh-gold);
}

.summary-dot {
  color: var(--mh-gold);
}

.unread-summary {
  color: #E5C58E;
  font-weight: 700;
}

/* ==========================================
   CONTENT BACKGROUND
========================================== */

.malohub-content {
  --background: var(--mh-background);
}

/* ==========================================
   SEARCH AREA
========================================== */

.malohub-search-wrap {
  padding: 21px 15px 9px;
  background: var(--mh-background);
}

.search-label {
  margin: 0 0 9px 4px;
}

.search-label span {
  color: var(--mh-muted);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.4px;
}

.malohub-search {
  --background: #FFFFFF;
  --color: var(--mh-green);
  --placeholder-color: #98A39D;
  --icon-color: var(--mh-emerald);
  --clear-button-color: var(--mh-muted);

  --box-shadow: 0 3px 13px rgba(20, 45, 38, 0.055);
  --border-radius: 14px;

  padding: 0;
}

.malohub-search .searchbar-input-container {
  min-height: 49px;
}

.malohub-search .searchbar-input {
  font-size: 13px;
  font-weight: 500;
}

/* ==========================================
   CONVERSATION LIST
========================================== */

.malohub-conversation-list {
  background: transparent;

  padding: 5px 13px 0;
}

/* ==========================================
   CONVERSATION CARD
========================================== */

.malohub-conversation {
  --background: #FFFFFF;
  --color: var(--mh-navy);

  --padding-start: 12px;
  --padding-end: 10px;
  --inner-padding-end: 0;

  margin: 9px 0;

  border: 1px solid var(--mh-border);
  border-radius: 16px;

  box-shadow:
    0 3px 12px rgba(20, 45, 38, 0.045);

  overflow: hidden;

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.malohub-conversation::part(native) {
  border-radius: 16px;
}

.malohub-conversation:active {
  transform: scale(0.985);
}

/* UNREAD CARD */

.malohub-conversation.is-unread {
  border-left: 4px solid var(--mh-emerald);

  background: #F2F8F3;

  box-shadow:
    0 4px 14px rgba(22, 132, 91, 0.08);
}

.malohub-conversation.is-unread::part(native) {
  background: #F2F8F3;
}

/* ==========================================
   AGENT AVATARS
========================================== */

.agent-avatar {
  width: 49px;
  height: 49px;

  margin-right: 12px;

  border: 2px solid var(--mh-gold-light);

  background: var(--mh-green);
}

.agent-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;

  background: linear-gradient(
    145deg,
    var(--mh-green),
    var(--mh-emerald)
  );

  color: #FFFFFF;
}

.avatar-fallback ion-icon {
  font-size: 23px;
}

/* ==========================================
   CONVERSATION DETAILS
========================================== */

.conversation-details {
  min-width: 0;
}

.conversation-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 7px;
}

.agent-name {
  margin: 0;

  color: var(--mh-green);

  font-size: 14px;
  font-weight: 800;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-time {
  flex-shrink: 0;

  display: flex;
  align-items: center;
  gap: 4px;

  color: var(--mh-muted);

  font-size: 10px;
  font-weight: 500;
}

.message-time ion-icon {
  color: var(--mh-gold);
  font-size: 12px;
}

/* ==========================================
   PROPERTY DETAILS
========================================== */

.property-name {
  display: flex;
  align-items: center;
  gap: 5px;

  margin-top: 5px;

  color: var(--mh-emerald);

  font-size: 11px;
  font-weight: 700;

  overflow: hidden;
}

.property-name ion-icon {
  flex-shrink: 0;

  color: var(--mh-gold);
  font-size: 14px;
}

.property-name span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ==========================================
   MESSAGE PREVIEW
========================================== */

.message-preview {
  margin: 6px 0 1px;

  color: var(--mh-muted);

  font-size: 12px;
  line-height: 1.45;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-preview.unread-preview {
  color: var(--mh-navy);
  font-weight: 700;
}

/* ==========================================
   CARD END
========================================== */

.conversation-end {
  display: flex;
  align-items: center;
  gap: 5px;
}

.conversation-unread {
  display: flex;
  align-items: center;
  justify-content: center;

  min-width: 21px;
  height: 21px;

  padding: 0 5px;

  border-radius: 50%;

  background: var(--mh-emerald);
  color: #FFFFFF;

  font-size: 10px;
  font-weight: 800;

  box-shadow:
    0 3px 8px rgba(22, 132, 91, 0.18);
}

.conversation-chevron {
  color: #A4B0A9;
  font-size: 18px;
}

/* ==========================================
   EMPTY STATE
========================================== */

.malohub-empty-state {
  min-height: 58vh;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 35px 25px;

  text-align: center;
}

.malohub-empty-state.compact {
  min-height: 43vh;
}

.malohub-empty-icon {
  width: 86px;
  height: 86px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 17px;

  border-radius: 27px;

  background: linear-gradient(
    145deg,
    #E2F1E9,
    #F6E9CC
  );

  color: var(--mh-green);

  box-shadow:
    0 8px 22px rgba(20, 45, 38, 0.07);
}

.malohub-empty-icon ion-icon {
  font-size: 40px;
}

.malohub-empty-icon.muted {
  background: #EAEFEA;
  color: var(--mh-muted);
  box-shadow: none;
}

.empty-eyebrow {
  margin-bottom: 8px;

  color: var(--mh-emerald);

  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.7px;
}

.malohub-empty-state h2 {
  margin: 0 0 9px;

  color: var(--mh-green);

  font-size: 21px;
  font-weight: 800;
  letter-spacing: -0.4px;
}

.malohub-empty-state p {
  max-width: 300px;

  margin: 0 0 21px;

  color: var(--mh-muted);

  font-size: 13px;
  line-height: 1.65;
}

/* ==========================================
   GOLD CTA BUTTON
========================================== */

.malohub-cta {
  width: 100%;
  max-width: 245px;

  --background: var(--mh-gold);
  --background-hover: #C4974F;
  --background-activated: #B88942;

  --color: var(--mh-green);

  --border-radius: 13px;

  font-size: 13px;
  font-weight: 800;

  box-shadow:
    0 5px 15px rgba(213, 166, 91, 0.20);
}

.malohub-cta ion-icon {
  font-size: 18px;
}

/* ==========================================
   EMPTY STATE TRUST MESSAGE
========================================== */

.empty-trust {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  margin-top: 19px;

  color: var(--mh-muted);

  font-size: 10px;
  line-height: 1.5;
}

.empty-trust ion-icon {
  color: var(--mh-emerald);
  font-size: 15px;
}

/* ==========================================
   ERROR CARD
========================================== */

.malohub-error-card {
  margin: 24px 16px;
  padding: 25px 20px;

  border: 1px solid #F0D8D0;
  border-radius: 18px;

  background: #FFF8F5;

  text-align: center;
}

.error-icon {
  width: 58px;
  height: 58px;

  margin: 0 auto 12px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 18px;

  background: #FCE9E3;
  color: #C75C4C;
}

.error-icon ion-icon {
  font-size: 29px;
}

.malohub-error-card h3 {
  color: var(--mh-green);
  font-size: 18px;
  font-weight: 800;
  margin: 0 0 8px;
}

.malohub-error-card p {
  color: var(--mh-muted);
  font-size: 13px;
  line-height: 1.6;
  margin: 0 0 17px;
}

/* ==========================================
   LOADING SCREEN
========================================== */

.malohub-loading {
  min-height: 75vh;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 25px;

  text-align: center;
}

.loading-logo {
  width: 75px;
  height: 75px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 19px;

  border-radius: 23px;

  background: var(--mh-green);
  color: var(--mh-gold);

  box-shadow:
    0 8px 24px rgba(20, 45, 38, 0.16);
}

.loading-logo ion-icon {
  font-size: 38px;
}

.malohub-loading ion-spinner {
  width: 31px;
  height: 31px;

  --color: var(--mh-emerald);
}

.malohub-loading h3 {
  margin: 15px 0 5px;

  color: var(--mh-green);

  font-size: 17px;
  font-weight: 800;
}

.malohub-loading p {
  color: var(--mh-muted);
  font-size: 12px;
}

/* ==========================================
   FLOATING ACTION BUTTON
========================================== */

.malohub-fab {
  margin: 0 12px 15px 0;
}

.malohub-fab ion-fab-button {
  --background: var(--mh-green);
  --background-hover: var(--mh-emerald);
  --background-activated: #0D211B;

  --color: var(--mh-gold);

  --box-shadow:
    0 7px 20px rgba(20, 45, 38, 0.24);

  width: 57px;
  height: 57px;
}

.malohub-fab ion-fab-button ion-icon {
  font-size: 27px;
}

.malohub-fab-spacer {
  height: 100px;
}

/* ==========================================
   REFRESHER
========================================== */

ion-refresher {
  --color: var(--mh-emerald);
}

ion-refresher-content {
  --color: var(--mh-emerald);
}

/* ==========================================
   TOAST
========================================== */

ion-toast {
  --border-radius: 12px;
}

/* ==========================================
   DESKTOP RESPONSIVENESS
========================================== */

@media (min-width: 768px) {

  .malohub-conversation-list,
  .malohub-search-wrap,
  .malohub-header-summary {
    max-width: 850px;
    margin-left: auto;
    margin-right: auto;
  }

  .malohub-search-wrap {
    padding-top: 25px;
  }

  .malohub-conversation {
    margin: 11px 0;
    border-radius: 18px;
  }

  .malohub-conversation::part(native) {
    border-radius: 18px;
  }

  .malohub-conversation:hover {
    transform: translateY(-2px);

    border-color: rgba(22, 132, 91, 0.28);

    box-shadow:
      0 9px 23px rgba(20, 45, 38, 0.09);
  }

  .malohub-empty-state {
    min-height: 55vh;
  }

}

/* ==========================================
   SMALL MOBILE SCREENS
========================================== */

@media (max-width: 380px) {

  .brand-text strong {
    font-size: 20px;
  }

  .brand-text small {
    font-size: 7px;
    letter-spacing: 1px;
  }

  .brand-icon {
    width: 39px;
    height: 39px;
  }

  .messages-title h1 {
    font-size: 21px;
  }

  .agent-avatar {
    width: 42px;
    height: 42px;
    margin-right: 9px;
  }

  .agent-name {
    font-size: 12px;
  }

  .message-time {
    font-size: 9px;
  }

  .property-name {
    font-size: 10px;
  }

  .message-preview {
    font-size: 11px;
  }

  .malohub-conversation {
    --padding-start: 9px;
    --padding-end: 7px;
  }

}

/* ==========================================
   ACCESSIBILITY
========================================== */

@media (prefers-reduced-motion: reduce) {

  .malohub-conversation {
    transition: none;
  }

}

`;

export default CustomerChat;