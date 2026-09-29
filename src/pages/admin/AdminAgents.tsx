import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonAvatar,
  IonBadge,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonRefresher,
  IonRefresherContent,
  IonLoading,
  IonModal,
  IonButtons,
  IonTextarea,
  IonChip,
  IonText,
  useIonToast,
  useIonAlert,
} from "@ionic/react";
import {
  peopleOutline,
  personAddOutline,
  checkmarkOutline,
  closeOutline,
  trashOutline,
  mailOutline,
  calendarOutline,
  shieldCheckmarkOutline,
} from "ionicons/icons";

const API_URL = "http://localhost:5001";

interface Agent {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at?: string;
}

interface AgentRequest {
  id: number;
  user_id: number;
  name: string;
  email: string;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  created_at: string;
}

export default function AdminAgents() {
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();

  const [segment, setSegment] = useState<"agents" | "requests">("agents");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [requests, setRequests] = useState<AgentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<AgentRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const token = localStorage.getItem("token");

  // ========================
  // FETCH DATA
  // ========================
  const fetchAgents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/agents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents || []);
      }
    } catch (err) {
      console.error("Failed to load agents", err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/api/agent-requests/admin?status=pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Failed to load requests", err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchAgents(), fetchRequests()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ========================
  // ACTIONS
  // ========================
  const handleRequestAction = async (status: "approved" | "rejected") => {
    if (!selectedRequest) return;
    setActionLoading(true);

    try {
      const res = await fetch(
        `${API_URL}/api/agent-requests/admin/${selectedRequest.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            admin_note: adminNote || null,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      await presentToast({
        message: `Request ${status} successfully`,
        color: "success",
        duration: 2500,
      });

      setSelectedRequest(null);
      setAdminNote("");
      loadData();
    } catch (err: any) {
      presentToast({
        message: err.message || "Something went wrong",
        color: "danger",
        duration: 3000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDemote = (agent: Agent) => {
    presentAlert({
      header: "Demote Agent",
      message: `Are you sure you want to remove agent role from ${agent.name}? They will become a customer again.`,
      buttons: [
        { text: "Cancel", role: "cancel" },
        {
          text: "Demote",
          role: "destructive",
          handler: async () => {
            try {
              const res = await fetch(
                `${API_URL}/api/admin/agents/${agent.id}/demote`,
                {
                  method: "PATCH",
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Failed to demote");

              presentToast({
                message: `${agent.name} is now a customer`,
                color: "success",
                duration: 2500,
              });
              loadData();
            } catch (err: any) {
              presentToast({
                message: err.message,
                color: "danger",
                duration: 3000,
              });
            }
          },
        },
      ],
    });
  };

  // ========================
  // FILTER
  // ========================
  const filteredAgents = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRequests = requests.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase())
  );

  // ========================
  // RENDER
  // ========================
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Manage Agents</IonTitle>
        </IonToolbar>

        <IonToolbar>
          <IonSegment
            value={segment}
            onIonChange={(e) => setSegment(e.detail.value as any)}
          >
            <IonSegmentButton value="agents">
              <IonLabel>
                Agents
                {agents.length > 0 && (
                  <IonBadge color="light" style={{ marginLeft: 6 }}>
                    {agents.length}
                  </IonBadge>
                )}
              </IonLabel>
            </IonSegmentButton>

            <IonSegmentButton value="requests">
              <IonLabel>
                Requests
                {requests.length > 0 && (
                  <IonBadge color="warning" style={{ marginLeft: 6 }}>
                    {requests.length}
                  </IonBadge>
                )}
              </IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>

        <IonToolbar>
          <IonSearchbar
            value={search}
            onIonInput={(e) => setSearch(e.detail.value || "")}
            placeholder="Search by name or email..."
            debounce={300}
          />
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher
          slot="fixed"
          onIonRefresh={(e) => {
            loadData().finally(() => e.detail.complete());
          }}
        >
          <IonRefresherContent />
        </IonRefresher>

        {loading && <IonLoading isOpen={true} message="Loading..." />}

        {/* ===================== AGENTS TAB ===================== */}
        {segment === "agents" && !loading && (
          <>
            {filteredAgents.length === 0 ? (
              <div style={{ textAlign: "center", marginTop: 80, color: "#999" }}>
                <IonIcon icon={peopleOutline} style={{ fontSize: 56 }} />
                <p>No agents found</p>
              </div>
            ) : (
              <IonList>
                {filteredAgents.map((agent) => (
                  <IonItem key={agent.id}>
                    <IonAvatar slot="start">
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "linear-gradient(135deg, #3880ff, #5260ff)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: 700,
                          fontSize: 18,
                        }}
                      >
                        {agent.name.charAt(0).toUpperCase()}
                      </div>
                    </IonAvatar>

                    <IonLabel>
                      <h2 style={{ fontWeight: 600 }}>{agent.name}</h2>
                      <p>
                        <IonIcon icon={mailOutline} style={{ verticalAlign: "middle", marginRight: 4 }} />
                        {agent.email}
                      </p>
                      <IonChip color="success" style={{ marginTop: 4, height: 24 }}>
                        <IonIcon icon={shieldCheckmarkOutline} />
                        <IonLabel>Agent</IonLabel>
                      </IonChip>
                    </IonLabel>

                    <IonButton
                      fill="outline"
                      color="danger"
                      size="small"
                      onClick={() => handleDemote(agent)}
                    >
                      <IonIcon icon={trashOutline} slot="start" />
                      Demote
                    </IonButton>
                  </IonItem>
                ))}
              </IonList>
            )}
          </>
        )}

        {/* ===================== REQUESTS TAB ===================== */}
        {segment === "requests" && !loading && (
          <>
            {filteredRequests.length === 0 ? (
              <div style={{ textAlign: "center", marginTop: 80, color: "#999" }}>
                <IonIcon icon={personAddOutline} style={{ fontSize: 56 }} />
                <p>No pending requests</p>
              </div>
            ) : (
              <IonList>
                {filteredRequests.map((req) => (
                  <IonItem
                    key={req.id}
                    button
                    detail
                    onClick={() => {
                      setSelectedRequest(req);
                      setAdminNote("");
                    }}
                  >
                    <IonAvatar slot="start">
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "#ffc409",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#000",
                          fontWeight: 700,
                          fontSize: 18,
                        }}
                      >
                        {req.name.charAt(0).toUpperCase()}
                      </div>
                    </IonAvatar>

                    <IonLabel>
                      <h2 style={{ fontWeight: 600 }}>{req.name}</h2>
                      <p>{req.email}</p>
                      <p style={{ fontSize: 12, color: "#888" }}>
                        <IonIcon icon={calendarOutline} style={{ verticalAlign: "middle" }} />{" "}
                        {new Date(req.created_at).toLocaleString()}
                      </p>
                    </IonLabel>

                    <IonBadge color="warning" slot="end">
                      Pending
                    </IonBadge>
                  </IonItem>
                ))}
              </IonList>
            )}
          </>
        )}

        {/* ===================== REVIEW MODAL ===================== */}
        <IonModal
          isOpen={!!selectedRequest}
          onDidDismiss={() => {
            setSelectedRequest(null);
            setAdminNote("");
          }}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Review Request</IonTitle>
              <IonButtons slot="end">
                <IonButton
                  onClick={() => {
                    setSelectedRequest(null);
                    setAdminNote("");
                  }}
                >
                  Close
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">
            {selectedRequest && (
              <>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #3880ff, #5260ff)",
                      color: "white",
                      fontSize: 28,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px",
                    }}
                  >
                    {selectedRequest.name.charAt(0).toUpperCase()}
                  </div>
                  <h2 style={{ margin: 0 }}>{selectedRequest.name}</h2>
                  <p style={{ color: "#666", margin: "4px 0" }}>
                    {selectedRequest.email}
                  </p>
                  <IonText color="medium" style={{ fontSize: 13 }}>
                    Requested on {new Date(selectedRequest.created_at).toLocaleString()}
                  </IonText>
                </div>

                {selectedRequest.message && (
                  <div style={{ marginBottom: 20 }}>
                    <IonText>
                      <strong>Message from user:</strong>
                    </IonText>
                    <div
                      style={{
                        background: "#f4f5f8",
                        padding: 14,
                        borderRadius: 12,
                        marginTop: 8,
                        lineHeight: 1.5,
                      }}
                    >
                      {selectedRequest.message}
                    </div>
                  </div>
                )}

                <IonTextarea
                  label="Admin Note (optional)"
                  labelPlacement="stacked"
                  fill="outline"
                  autoGrow
                  rows={3}
                  value={adminNote}
                  placeholder="Reason for approval or rejection..."
                  onIonInput={(e) => setAdminNote(e.detail.value || "")}
                />

                <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
                  <IonButton
                    expand="block"
                    color="success"
                    onClick={() => handleRequestAction("approved")}
                    disabled={actionLoading}
                  >
                    <IonIcon icon={checkmarkOutline} slot="start" />
                    Approve
                  </IonButton>

                  <IonButton
                    expand="block"
                    color="danger"
                    onClick={() => handleRequestAction("rejected")}
                    disabled={actionLoading}
                  >
                    <IonIcon icon={closeOutline} slot="start" />
                    Reject
                  </IonButton>
                </div>
              </>
            )}
          </IonContent>
        </IonModal>
      </IonContent>

      <IonLoading isOpen={actionLoading} message="Processing..." />
    </IonPage>
  );
}