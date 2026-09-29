import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonLoading,
  IonModal,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonRow,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
  useIonAlert,
  useIonRouter,
  useIonToast,
} from "@ionic/react";

import {
  alertCircleOutline,
  arrowBackOutline,
  calendarOutline,
  checkmarkCircleOutline,
  checkmarkOutline,
  closeCircleOutline,
  closeOutline,
  documentTextOutline,
  mailOutline,
  personCircleOutline,
  refreshOutline,
  searchOutline,
  timeOutline,
} from "ionicons/icons";

/* =========================================================
   CONFIG
========================================================= */

const API_URL = "http://localhost:5001";

/* =========================================================
   TYPES
========================================================= */

type RequestStatus = "pending" | "approved" | "rejected";
type FilterStatus = RequestStatus | "all";

interface AgentRequest {
  id: number;
  name: string;
  email: string;
  message?: string | null;
  status: RequestStatus;
  admin_note?: string | null;
  created_at: string;
  updated_at?: string | null;
}

interface ApiResponse {
  success?: boolean;
  error?: string;
  message?: string;
  requests?: AgentRequest[];
  data?: AgentRequest[] | { requests?: AgentRequest[] };
}

interface ActionResponse {
  success?: boolean;
  error?: string;
  message?: string;
  request?: AgentRequest;
}

/* =========================================================
   HELPERS
========================================================= */

const getStatusColor = (
  status: RequestStatus
): "warning" | "success" | "danger" => {
  switch (status) {
    case "approved":
      return "success";
    case "rejected":
      return "danger";
    default:
      return "warning";
  }
};

const getStatusIcon = (status: RequestStatus) => {
  switch (status) {
    case "approved":
      return checkmarkCircleOutline;
    case "rejected":
      return closeCircleOutline;
    default:
      return timeOutline;
  }
};

const formatDate = (date?: string | null) => {
  if (!date) return "Unknown date";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Unknown date";
  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getInitials = (name?: string) => {
  if (!name) return "U";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

const normalizeRequests = (raw: any): AgentRequest[] => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.requests)) return raw.requests;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.requests)) return raw.data.requests;
  return [];
};

/* =========================================================
   COMPONENT
========================================================= */

export default function AdminAgentRequests() {
  const router = useIonRouter();
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();

  const [requests, setRequests] = useState<AgentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedRequest, setSelectedRequest] =
    useState<AgentRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const abortControllerRef = useRef<AbortController | null>(null);

  const token = useMemo(() => localStorage.getItem("token"), []);

  /* ---------- TOAST ---------- */

  const showToast = useCallback(
    async (
      message: string,
      color: "success" | "danger" | "warning" | "medium" = "medium"
    ) => {
      await presentToast({
        message,
        color,
        duration: 3000,
        position: "bottom",
      });
    },
    [presentToast]
  );

  /* ---------- AUTH ---------- */

  const handleUnauthorized = useCallback(
    async (status: number) => {
      if (status !== 401 && status !== 403) return false;

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      await showToast(
        status === 403
          ? "You do not have permission to access this page."
          : "Your session has expired. Please login again.",
        "danger"
      );

      router.push("/login", "root", "replace");
      return true;
    },
    [router, showToast]
  );

  /* ---------- SAFE JSON ---------- */

  const parseResponse = async <T,>(response: Response): Promise<T> => {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(
        text || `Server returned an unexpected response (${response.status}).`
      );
    }
    return response.json() as Promise<T>;
  };

  /* ---------- FETCH ---------- */

  const fetchRequests = useCallback(
    async (showLoader = true) => {
      if (!token) {
        await showToast(
          "Authentication required. Please login again.",
          "danger"
        );
        router.push("/login", "root", "replace");
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        if (showLoader) setLoading(true);

        // Fixed: no more comparison against empty string
        const query =
          filter !== "all"
            ? `?status=${encodeURIComponent(filter)}`
            : "";

        const response = await fetch(
          `${API_URL}/api/agent-requests/admin${query}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            signal: controller.signal,
          }
        );

        if (await handleUnauthorized(response.status)) return;

        const data = await parseResponse<ApiResponse>(response);

        if (!response.ok) {
          throw new Error(
            data.error ||
              data.message ||
              `Failed to load requests (${response.status}).`
          );
        }

        const list = normalizeRequests(data);
        setRequests(list);
      } catch (error: any) {
        if (error?.name === "AbortError") return;

        console.error("FETCH AGENT REQUESTS ERROR:", error);
        await showToast(
          error?.message || "Failed to load agent requests.",
          "danger"
        );
      } finally {
        if (showLoader) setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [filter, handleUnauthorized, router, showToast, token]
  );

  useEffect(() => {
    fetchRequests(true);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchRequests]);

  /* ---------- REFRESH ---------- */

  const handleRefresh = async (event: CustomEvent) => {
    setRefreshing(true);
    try {
      await fetchRequests(false);
    } finally {
      setRefreshing(false);
      event.detail.complete();
    }
  };

  /* ---------- FILTERED LIST ---------- */

  const filteredRequests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return requests;

    return requests.filter(
      (r) =>
        r.name?.toLowerCase().includes(term) ||
        r.email?.toLowerCase().includes(term)
    );
  }, [requests, searchTerm]);

  /* ---------- COUNTS ---------- */

  const counts = useMemo(() => {
    return {
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
      total: requests.length,
    };
  }, [requests]);

  /* ---------- OPEN / CLOSE ---------- */

  const openRequest = (request: AgentRequest) => {
    setSelectedRequest(request);
    setAdminNote(request.admin_note || "");
  };

  const closeRequest = () => {
    if (actionLoading) return;
    setSelectedRequest(null);
    setAdminNote("");
  };

  /* ---------- ACTIONS ---------- */

  const confirmAction = (status: "approved" | "rejected") => {
    if (!selectedRequest || actionLoading) return;

    presentAlert({
      header:
        status === "approved"
          ? "Approve Agent Request?"
          : "Reject Agent Request?",
      message:
        status === "approved"
          ? `Are you sure you want to approve ${selectedRequest.name} as an agent?`
          : `Are you sure you want to reject ${selectedRequest.name}'s agent request?`,
      buttons: [
        { text: "Cancel", role: "cancel" },
        {
          text: status === "approved" ? "Approve" : "Reject",
          role: "destructive",
          handler: () => handleAction(status),
        },
      ],
    });
  };

  const handleAction = async (status: "approved" | "rejected") => {
    if (!selectedRequest || actionLoading) return;

    if (!token) {
      await showToast(
        "Authentication required. Please login again.",
        "danger"
      );
      router.push("/login", "root", "replace");
      return;
    }

    setActionLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/agent-requests/admin/${selectedRequest.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            admin_note: adminNote.trim() || null,
          }),
        }
      );

      if (await handleUnauthorized(response.status)) return;

      const data = await parseResponse<ActionResponse>(response);

      if (!response.ok || data.success === false) {
        throw new Error(
          data.error || data.message || `Unable to ${status} request.`
        );
      }

      await showToast(
        status === "approved"
          ? "Agent request approved successfully."
          : "Agent request rejected successfully.",
        "success"
      );

      setSelectedRequest(null);
      setAdminNote("");
      await fetchRequests(false);
    } catch (error: any) {
      console.error("AGENT REQUEST ACTION ERROR:", error);
      if (error?.name !== "AbortError") {
        await showToast(
          error?.message ||
            "Something went wrong while processing the request.",
          "danger"
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  const filterLabel = useMemo(() => {
    switch (filter) {
      case "pending":
        return "Pending Requests";
      case "approved":
        return "Approved Requests";
      case "rejected":
        return "Rejected Requests";
      default:
        return "All Requests";
    }
  }, [filter]);

  /* ---------- RENDER ---------- */

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton
              fill="clear"
              color="light"
              aria-label="Go back"
              onClick={() => router.goBack()}
            >
              <IonIcon slot="icon-only" icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>

          <IonTitle>Agent Requests</IonTitle>

          <IonButtons slot="end">
            <IonButton
              fill="clear"
              color="light"
              aria-label="Refresh requests"
              disabled={loading || refreshing}
              onClick={() => fetchRequests(true)}
            >
              <IonIcon slot="icon-only" icon={refreshOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{ "--background": "#f6f7fb" } as React.CSSProperties}
      >
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingText="Pull to refresh"
            refreshingText="Refreshing..."
          />
        </IonRefresher>

        {/* Page header */}
        <div style={{ padding: "24px 16px 12px" }}>
          <IonText>
            <h1
              style={{
                margin: 0,
                fontSize: 25,
                fontWeight: 700,
                color: "#1f2937",
              }}
            >
              Agent Applications
            </h1>
            <p
              style={{
                margin: "7px 0 0",
                color: "#6b7280",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              Review and manage users requesting agent access.
            </p>
          </IonText>
        </div>

        {/* Filter + Search card */}
        <IonCard
          style={{
            margin: "12px 16px 18px",
            borderRadius: 16,
            boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
          }}
        >
          <IonCardContent>
            <IonGrid>
              <IonRow className="ion-align-items-center">
                <IonCol size="12" sizeMd="6">
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#6b7280",
                        marginBottom: 5,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Filter
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      {filterLabel}
                    </div>
                  </div>
                </IonCol>

                <IonCol size="12" sizeMd="6">
                  <IonSelect
                    value={filter}
                    label="Status"
                    labelPlacement="stacked"
                    fill="outline"
                    interface="popover"
                    onIonChange={(e) =>
                      setFilter(e.detail.value as FilterStatus)
                    }
                  >
                    <IonSelectOption value="pending">Pending</IonSelectOption>
                    <IonSelectOption value="approved">Approved</IonSelectOption>
                    <IonSelectOption value="rejected">Rejected</IonSelectOption>
                    <IonSelectOption value="all">All</IonSelectOption>
                  </IonSelect>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol size="12">
                  <IonSearchbar
                    value={searchTerm}
                    placeholder="Search by name or email..."
                    onIonInput={(e) => setSearchTerm(e.detail.value || "")}
                    style={{ padding: "8px 0 0" }}
                  />
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>

        {/* Quick counts (only when "All" is selected) */}
        {!loading && filter === "all" && (
          <div
            style={{
              display: "flex",
              gap: 10,
              padding: "0 16px 16px",
              flexWrap: "wrap",
            }}
          >
            <IonBadge color="warning" style={{ padding: "6px 12px" }}>
              Pending: {counts.pending}
            </IonBadge>
            <IonBadge color="success" style={{ padding: "6px 12px" }}>
              Approved: {counts.approved}
            </IonBadge>
            <IonBadge color="danger" style={{ padding: "6px 12px" }}>
              Rejected: {counts.rejected}
            </IonBadge>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "70px 20px",
              gap: 14,
            }}
          >
            <IonSpinner name="crescent" />
            <IonText color="medium">
              <p style={{ margin: 0 }}>Loading agent requests...</p>
            </IonText>
          </div>
        )}

        {/* Empty */}
        {!loading && filteredRequests.length === 0 && (
          <div
            style={{
              margin: "35px 16px",
              padding: "45px 25px",
              background: "#ffffff",
              borderRadius: 18,
              textAlign: "center",
              boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                margin: "0 auto 18px",
                borderRadius: "50%",
                background: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IonIcon
                icon={searchTerm ? searchOutline : documentTextOutline}
                style={{ fontSize: 34, color: "#64748b" }}
              />
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: "#1f2937",
              }}
            >
              {searchTerm ? "No matching requests" : "No requests found"}
            </h2>

            <p
              style={{
                margin: "9px auto 20px",
                maxWidth: 360,
                color: "#6b7280",
                lineHeight: 1.5,
                fontSize: 14,
              }}
            >
              {searchTerm
                ? "Try a different name or email."
                : "There are currently no agent requests matching the selected status."}
            </p>

            <IonButton fill="outline" onClick={() => fetchRequests(true)}>
              <IonIcon icon={refreshOutline} slot="start" />
              Refresh
            </IonButton>
          </div>
        )}

        {/* List */}
        {!loading && filteredRequests.length > 0 && (
          <IonList
            lines="none"
            style={{
              background: "transparent",
              padding: "0 16px 30px",
            }}
          >
            {filteredRequests.map((request) => (
              <IonItem
                key={request.id}
                button
                detail
                onClick={() => openRequest(request)}
                style={
                  {
                    "--background": "#ffffff",
                    "--border-radius": "16px",
                    "--padding-start": "14px",
                    "--padding-end": "12px",
                    marginBottom: "10px",
                    borderRadius: "16px",
                    boxShadow: "0 3px 14px rgba(0,0,0,0.045)",
                  } as React.CSSProperties
                }
              >
                <div
                  slot="start"
                  style={{
                    width: 46,
                    height: 46,
                    minWidth: 46,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #e0e7ff, #dbeafe)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#3730a3",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {getInitials(request.name)}
                </div>

                <IonLabel>
                  <h2
                    style={{
                      fontWeight: 700,
                      color: "#111827",
                      marginBottom: 4,
                    }}
                  >
                    {request.name}
                  </h2>
                  <p
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <IonIcon icon={mailOutline} />
                    {request.email}
                  </p>
                  <p
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      marginTop: 4,
                      fontSize: 12,
                    }}
                  >
                    <IonIcon icon={calendarOutline} />
                    {formatDate(request.created_at)}
                  </p>
                </IonLabel>

                <IonBadge
                  slot="end"
                  color={getStatusColor(request.status)}
                  style={{
                    textTransform: "capitalize",
                    padding: "6px 9px",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <IonIcon icon={getStatusIcon(request.status)} />
                  {request.status}
                </IonBadge>
              </IonItem>
            ))}
          </IonList>
        )}

        <IonLoading
          isOpen={actionLoading}
          message="Processing request..."
          spinner="crescent"
        />

        {/* Review Modal */}
        <IonModal
          isOpen={!!selectedRequest}
          onDidDismiss={closeRequest}
          breakpoints={[0, 0.65, 0.95, 1]}
          initialBreakpoint={0.95}
          handleBehavior="cycle"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Review Application</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={closeRequest} disabled={actionLoading}>
                  <IonIcon slot="icon-only" icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent
            className="ion-padding"
            style={{ "--background": "#f6f7fb" } as React.CSSProperties}
          >
            {selectedRequest && (
              <div style={{ maxWidth: 720, margin: "0 auto" }}>
                {/* Profile */}
                <IonCard
                  style={{
                    margin: "0 0 14px",
                    borderRadius: 18,
                    boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
                  }}
                >
                  <IonCardContent>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 15,
                      }}
                    >
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          minWidth: 64,
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #4f46e5, #2563eb)",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 19,
                        }}
                      >
                        {getInitials(selectedRequest.name)}
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h2
                          style={{
                            margin: 0,
                            fontSize: 20,
                            fontWeight: 700,
                            color: "#111827",
                          }}
                        >
                          {selectedRequest.name}
                        </h2>
                        <p
                          style={{
                            margin: "5px 0 0",
                            color: "#6b7280",
                            wordBreak: "break-word",
                          }}
                        >
                          {selectedRequest.email}
                        </p>
                      </div>

                      <IonBadge
                        color={getStatusColor(selectedRequest.status)}
                        style={{
                          textTransform: "capitalize",
                          padding: "7px 10px",
                          borderRadius: 8,
                        }}
                      >
                        {selectedRequest.status}
                      </IonBadge>
                    </div>
                  </IonCardContent>
                </IonCard>

                {/* Details */}
                <IonCard
                  style={{
                    margin: "0 0 14px",
                    borderRadius: 18,
                    boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
                  }}
                >
                  <IonCardContent>
                    <h3
                      style={{
                        margin: "0 0 15px",
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      Application Details
                    </h3>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        color: "#6b7280",
                        fontSize: 14,
                      }}
                    >
                      <IonIcon
                        icon={calendarOutline}
                        style={{ fontSize: 20 }}
                      />
                      <div>
                        <div style={{ fontSize: 12, marginBottom: 2 }}>
                          Submitted
                        </div>
                        <strong style={{ color: "#374151" }}>
                          {formatDate(selectedRequest.created_at)}
                        </strong>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>

                {/* Message */}
                <IonCard
                  style={{
                    margin: "0 0 14px",
                    borderRadius: 18,
                    boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
                  }}
                >
                  <IonCardContent>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      <IonIcon
                        icon={personCircleOutline}
                        style={{ fontSize: 21 }}
                      />
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 16,
                          fontWeight: 700,
                        }}
                      >
                        Applicant Message
                      </h3>
                    </div>

                    <div
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        padding: 15,
                        color: "#374151",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        minHeight: 60,
                      }}
                    >
                      {selectedRequest.message ||
                        "The applicant did not provide a message."}
                    </div>
                  </IonCardContent>
                </IonCard>

                {/* Actions (only for pending) */}
                {selectedRequest.status === "pending" && (
                  <IonCard
                    style={{
                      margin: "0 0 25px",
                      borderRadius: 18,
                      boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
                    }}
                  >
                    <IonCardContent>
                      <h3
                        style={{
                          margin: "0 0 6px",
                          fontSize: 16,
                          fontWeight: 700,
                        }}
                      >
                        Administrator Decision
                      </h3>
                      <p
                        style={{
                          margin: "0 0 15px",
                          color: "#6b7280",
                          fontSize: 13,
                          lineHeight: 1.5,
                        }}
                      >
                        Add an optional note before approving or rejecting
                        this application.
                      </p>

                      <IonTextarea
                        label="Admin Note"
                        labelPlacement="stacked"
                        fill="outline"
                        autoGrow
                        rows={4}
                        value={adminNote}
                        maxlength={1000}
                        counter
                        placeholder="Enter an optional note for the applicant..."
                        onIonInput={(e) =>
                          setAdminNote(e.detail.value || "")
                        }
                      />

                      <IonGrid style={{ padding: "18px 0 0" }}>
                        <IonRow>
                          <IonCol size="12" sizeSm="6">
                            <IonButton
                              expand="block"
                              color="success"
                              disabled={actionLoading}
                              onClick={() => confirmAction("approved")}
                            >
                              <IonIcon
                                icon={checkmarkOutline}
                                slot="start"
                              />
                              Approve
                            </IonButton>
                          </IonCol>
                          <IonCol size="12" sizeSm="6">
                            <IonButton
                              expand="block"
                              color="danger"
                              fill="outline"
                              disabled={actionLoading}
                              onClick={() => confirmAction("rejected")}
                            >
                              <IonIcon icon={closeOutline} slot="start" />
                              Reject
                            </IonButton>
                          </IonCol>
                        </IonRow>
                      </IonGrid>
                    </IonCardContent>
                  </IonCard>
                )}

                {/* Previous decision */}
                {selectedRequest.status !== "pending" && (
                  <IonCard
                    style={{
                      margin: "0 0 25px",
                      borderRadius: 18,
                      boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
                    }}
                  >
                    <IonCardContent>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 12,
                        }}
                      >
                        <IonIcon
                          icon={alertCircleOutline}
                          style={{ fontSize: 22 }}
                        />
                        <h3
                          style={{
                            margin: 0,
                            fontSize: 16,
                            fontWeight: 700,
                          }}
                        >
                          Administrator Note
                        </h3>
                      </div>

                      <div
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #e5e7eb",
                          borderRadius: 12,
                          padding: 15,
                          color: "#374151",
                          lineHeight: 1.6,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {selectedRequest.admin_note ||
                          "No administrator note was provided."}
                      </div>
                    </IonCardContent>
                  </IonCard>
                )}
              </div>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
}