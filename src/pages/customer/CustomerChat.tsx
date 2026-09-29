import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  IonText,
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
} from "ionicons/icons";
import { useHistory } from "react-router-dom";

/* =========================================================
   CONFIG
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

const extractConversations = (data: unknown): Conversation[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.conversations)) return obj.conversations;
    if (Array.isArray(obj.chats)) return obj.chats;
    if (Array.isArray(obj.data)) return obj.data;
  }
  return [];
};

/* =========================================================
   COMPONENT
========================================================= */

const CustomerChat: React.FC = () => {
  const history = useHistory();

  const [conversations, setConversations] = useState<Conversation[]>([]);
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
        if (!isRefresh) setError("");

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
      } catch (err) {
        console.error("CUSTOMER CHAT ERROR:", err);
        const message =
          "Unable to load your conversations. Please check your connection and try again.";
        setError(message);
        if (isRefresh) setToastMessage(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [history]
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
     DERIVED STATE
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
      const lastMsg = (chat.last_message || "").toLowerCase();

      return (
        agent.includes(query) ||
        property.includes(query) ||
        lastMsg.includes(query)
      );
    });
  }, [conversations, searchText]);

  const totalUnread = useMemo(
    () =>
      conversations.reduce(
        (sum, chat) => sum + Number(chat.unread_count || 0),
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
     EMPTY / ERROR STATES
  ------------------------------------------------------- */

  const EmptyState = () => (
    <div className="empty-state">
      <div className="empty-icon">
        <IonIcon icon={chatbubblesOutline} />
      </div>
      <h2>No conversations yet</h2>
      <p>
        Your chats with property agents and landlords will appear here once you
        start messaging.
      </p>
      <IonButton expand="block" onClick={startNewChat} className="cta-button">
        <IonIcon slot="start" icon={addOutline} />
        Find a Property
      </IonButton>
    </div>
  );

  const NoResultsState = () => (
    <div className="empty-state compact">
      <div className="empty-icon muted">
        <IonIcon icon={searchOutline} />
      </div>
      <h2>No matches</h2>
      <p>
        No conversations match “{searchText}”.
      </p>
      <IonButton fill="clear" onClick={() => setSearchText("")}>
        Clear search
      </IonButton>
    </div>
  );

  /* -------------------------------------------------------
     LOADING
  ------------------------------------------------------- */

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
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
            placeholder="Search by agent, property or message"
            animated
            debounce={250}
          />
        </div>

        {error && !conversations.length && (
          <div className="error-card">
            <IonIcon icon={alertCircleOutline} />
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
            <IonButton size="small" fill="outline" onClick={() => loadConversations()}>
              Try again
            </IonButton>
          </div>
        )}

        {!error && conversations.length === 0 && <EmptyState />}

        {!error &&
          conversations.length > 0 &&
          filteredConversations.length === 0 && <NoResultsState />}

        {filteredConversations.length > 0 && (
          <IonList lines="none" className="conversation-list">
            {filteredConversations.map((chat) => {
              const unread = Number(chat.unread_count || 0);
              const agentName = chat.agent_name || "Property Agent";
              const propertyName =
                chat.property_name || chat.property_title || "Property";
              const message = chat.last_message || "Start a conversation…";

              return (
                <IonItem
                  key={chat.id}
                  button
                  detail={false}
                  onClick={() => openChat(chat)}
                  className={`conversation-item ${unread > 0 ? "is-unread" : ""}`}
                >
                  <IonAvatar slot="start">
                    {chat.avatar ? (
                      <img src={chat.avatar} alt={agentName} />
                    ) : (
                      <div className="avatar-fallback">
                        <IonIcon icon={personOutline} />
                      </div>
                    )}
                  </IonAvatar>

                  <IonLabel>
                    <div className="item-top">
                      <h2 className="agent-name">{agentName}</h2>
                      <span className="time">
                        <IonIcon icon={timeOutline} />
                        {formatMessageTime(chat.last_message_at)}
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

        {/* Spacer for FAB */}
        <div className="fab-spacer" />

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={startNewChat} aria-label="Start new chat">
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>

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
        /* ---------- Header ---------- */
        .chat-header {
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
        }

        .title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .title-badge {
          font-size: 11px;
          min-width: 22px;
          height: 22px;
          border-radius: 11px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 6px;
        }

        .header-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2px 16px 12px;
          gap: 12px;
        }

        .summary-left {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--ion-color-medium);
          font-size: 13px;
        }

        .summary-left ion-icon {
          font-size: 17px;
        }

        .unread-chip {
          margin: 0;
          height: 26px;
          font-size: 11px;
        }

        /* ---------- Search ---------- */
        .search-wrap {
          padding: 10px 12px 6px;
          background: var(--ion-background-color);
        }

        .search-wrap ion-searchbar {
          --background: var(--ion-color-light);
          --box-shadow: none;
          --border-radius: 14px;
          padding: 0;
        }

        /* ---------- List ---------- */
        .conversation-list {
          background: transparent;
          padding: 4px 12px 0;
        }

        .conversation-item {
          --background: var(--ion-background-color);
          --padding-start: 12px;
          --padding-end: 10px;
          --inner-padding-end: 0;
          margin: 6px 0;
          border-radius: 16px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .conversation-item:active {
          transform: scale(0.985);
        }

        .conversation-item.is-unread {
          box-shadow: 0 3px 14px rgba(var(--ion-color-primary-rgb), 0.14);
        }

        .conversation-item ion-avatar {
          width: 50px;
          height: 50px;
          margin-right: 12px;
        }

        .avatar-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--ion-color-primary);
          color: #fff;
          font-size: 22px;
        }

        .item-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .agent-name {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: var(--ion-text-color);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .time {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 11px;
          color: var(--ion-color-medium);
        }

        .time ion-icon {
          font-size: 12px;
        }

        .property-row {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 3px;
          color: var(--ion-color-primary);
          font-size: 11px;
          font-weight: 600;
        }

        .property-row ion-icon {
          font-size: 13px;
        }

        .preview {
          margin: 5px 0 0;
          font-size: 13px;
          color: var(--ion-color-medium);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .preview.bold {
          color: var(--ion-text-color);
          font-weight: 600;
        }

        .item-end {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .unread-badge {
          min-width: 20px;
          height: 20px;
          border-radius: 10px;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chevron {
          color: var(--ion-color-medium);
          font-size: 18px;
        }

        /* ---------- Empty / Error / Loading ---------- */
        .empty-state {
          min-height: 58vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 32px 24px;
        }

        .empty-state.compact {
          min-height: 42vh;
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--ion-color-primary);
          color: #fff;
          margin-bottom: 18px;
          box-shadow: 0 8px 24px rgba(var(--ion-color-primary-rgb), 0.28);
        }

        .empty-icon.muted {
          background: var(--ion-color-medium);
          box-shadow: none;
        }

        .empty-icon ion-icon {
          font-size: 38px;
        }

        .empty-state h2 {
          margin: 0 0 8px;
          font-size: 20px;
          font-weight: 700;
        }

        .empty-state p {
          max-width: 300px;
          margin: 0 0 20px;
          color: var(--ion-color-medium);
          font-size: 14px;
          line-height: 1.55;
        }

        .cta-button {
          max-width: 240px;
          width: 100%;
        }

        .loading-state {
          min-height: 70vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--ion-color-medium);
          gap: 12px;
        }

        .loading-state ion-spinner {
          width: 38px;
          height: 38px;
        }

        .error-card {
          margin: 16px;
          padding: 20px;
          border-radius: 16px;
          background: rgba(var(--ion-color-danger-rgb), 0.08);
          text-align: center;
        }

        .error-card > ion-icon {
          font-size: 34px;
          color: var(--ion-color-danger);
          margin-bottom: 6px;
        }

        .error-card p {
          font-size: 13px;
          margin: 0 0 12px;
        }

        .fab-spacer {
          height: 96px;
        }

        /* ---------- Desktop ---------- */
        @media (min-width: 768px) {
          .conversation-list,
          .search-wrap,
          .header-summary {
            max-width: 820px;
            margin-left: auto;
            margin-right: auto;
          }
        }
      `}</style>
    </IonPage>
  );
};

export default CustomerChat;