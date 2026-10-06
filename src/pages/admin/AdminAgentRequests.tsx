import React, { useCallback, useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonTextarea,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardContent,
  IonIcon,
  IonSpinner,
  IonText,
  IonButtons,
  IonBackButton,
  IonItem,
  IonLabel,
  IonList,
  IonCheckbox,
  useIonToast,
  useIonRouter,
} from "@ionic/react";
import {
  personAddOutline,
  checkmarkCircleOutline,
  timeOutline,
  closeCircleOutline,
  refreshOutline,
  businessOutline,
  locationOutline,
  documentTextOutline,
  copyOutline,
} from "ionicons/icons";

import "./BecomeAgent.css";

const API_URL = "http://localhost:5001";

interface AgentRequest {
  id?: number | string;
  full_name?: string;
  phone?: string;
  email?: string;
  national_id?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  occupation?: string;
  experience?: string;
  company_name?: string | null;
  license_number?: string | null;
  property_types?: string;
  operating_areas?: string;
  message?: string | null;
  status: string;
  admin_note?: string | null;
  agent_code?: string | null; // ← added
  created_at?: string;
}

interface AgentForm {
  full_name: string;
  phone: string;
  email: string;
  national_id: string;
  date_of_birth: string;
  gender: string;
  address: string;
  city: string;
  occupation: string;
  experience: string;
  company_name: string;
  license_number: string;
  property_types: string;
  operating_areas: string;
  message: string;
}

const initialForm: AgentForm = {
  full_name: "",
  phone: "",
  email: "",
  national_id: "",
  date_of_birth: "",
  gender: "",
  address: "",
  city: "",
  occupation: "",
  experience: "",
  company_name: "",
  license_number: "",
  property_types: "",
  operating_areas: "",
  message: "",
};

export default function BecomeAgent() {
  const router = useIonRouter();
  const [presentToast] = useIonToast();

  const [form, setForm] = useState<AgentForm>(initialForm);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [request, setRequest] = useState<AgentRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agentCode, setAgentCode] = useState<string | null>(null);

  const getToken = () => localStorage.getItem("token");

  // --------------------------------------------------
  // Load basic user info from localStorage
  // --------------------------------------------------
  const loadUserInformation = () => {
    try {
      const savedUser = localStorage.getItem("user");
      if (!savedUser) return;

      const user = JSON.parse(savedUser);

      setForm((prev) => ({
        ...prev,
        full_name: prev.full_name || user.full_name || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || user.phone_number || "",
      }));

      // If user already has an agent code, store it
      if (user.agent_code) {
        setAgentCode(user.agent_code);
      }
    } catch (err) {
      console.error("Could not load saved user:", err);
    }
  };

  // --------------------------------------------------
  // Update a single form field
  // --------------------------------------------------
  const updateField = (field: keyof AgentForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // --------------------------------------------------
  // Check existing application status
  // --------------------------------------------------
  const checkStatus = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setChecking(false);
      setError("You must be logged in.");
      presentToast({
        message: "Please log in first.",
        color: "danger",
        duration: 2500,
      });
      setTimeout(() => router.push("/login", "root", "replace"), 400);
      return;
    }

    setChecking(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(`${API_URL}/api/agent-requests/me`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      const raw = await res.text();
      let data: any = {};
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          throw new Error(`Invalid server response (${res.status})`);
        }
      }

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        presentToast({
          message: "Session expired. Please log in again.",
          color: "danger",
          duration: 2500,
        });
        setTimeout(() => router.push("/login", "root", "replace"), 300);
        return;
      }

      if (res.status === 404) {
        setRequest(null);
        return;
      }

      if (!res.ok) {
        throw new Error(
          data.error || data.message || `Failed to check status (${res.status})`
        );
      }

      const existing =
        data.request ??
        data.data?.request ??
        (data.id && data.status ? data : null);

      setRequest(existing || null);

      // If approved and backend returns agent_code
      if (existing?.agent_code) {
        setAgentCode(existing.agent_code);
      }

      // Also try to get agent_code from localStorage user
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user.agent_code) {
          setAgentCode(user.agent_code);
        }
      }
    } catch (err: any) {
      console.error("Check agent request error:", err);

      if (err.name === "AbortError") {
        setError("Request timed out. Is the backend running on port 5001?");
      } else {
        setError(err.message || "Could not check request status.");
      }
      setRequest(null);
    } finally {
      clearTimeout(timeoutId);
      setChecking(false);
    }
  }, [presentToast, router]);

  // --------------------------------------------------
  // Initial load
  // --------------------------------------------------
  useEffect(() => {
    loadUserInformation();
    checkStatus();
  }, [checkStatus]);

  // --------------------------------------------------
  // Validation
  // --------------------------------------------------
  const validateForm = (): string | null => {
    if (!form.full_name.trim()) return "Please enter your full name.";
    if (!form.phone.trim()) return "Please enter your phone number.";
    if (!form.email.trim()) return "Please enter your email address.";
    if (!form.national_id.trim()) return "Please enter your national ID number.";
    if (!form.date_of_birth) return "Please enter your date of birth.";
    if (!form.gender) return "Please select your gender.";
    if (!form.address.trim()) return "Please enter your residential address.";
    if (!form.city.trim()) return "Please enter your city or location.";
    if (!form.occupation.trim()) return "Please enter your occupation.";
    if (!form.experience) return "Please select your real estate experience.";
    if (!form.property_types)
      return "Please select the type of properties you want to manage.";
    if (!form.operating_areas.trim())
      return "Please enter the areas where you intend to operate.";
    if (!form.message.trim())
      return "Please explain why you want to become an agent.";
    if (!agreed)
      return "Please confirm that the information you provided is accurate.";

    return null;
  };

  // --------------------------------------------------
  // Submit application
  // --------------------------------------------------
  const handleSubmit = async () => {
    if (loading || checking) return;

    const token = getToken();
    if (!token) {
      presentToast({
        message: "Please log in first.",
        color: "danger",
        duration: 2500,
      });
      router.push("/login", "root", "replace");
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      presentToast({
        message: validationError,
        color: "danger",
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/agent-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          national_id: form.national_id.trim(),
          date_of_birth: form.date_of_birth,
          gender: form.gender,
          address: form.address.trim(),
          city: form.city.trim(),
          occupation: form.occupation.trim(),
          experience: form.experience,
          company_name: form.company_name.trim() || null,
          license_number: form.license_number.trim() || null,
          property_types: form.property_types,
          operating_areas: form.operating_areas.trim(),
          message: form.message.trim(),
        }),
      });

      const raw = await res.text();
      let data: any = {};
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          throw new Error(`Invalid server response (${res.status})`);
        }
      }

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        presentToast({
          message: "Session expired. Please log in again.",
          color: "danger",
          duration: 2500,
        });
        router.push("/login", "root", "replace");
        return;
      }

      if (!res.ok) {
        throw new Error(
          data.error || data.message || `Failed to submit request (${res.status})`
        );
      }

      const created = data.request || data.data?.request;

      if (created) {
        setRequest(created);
      } else {
        setRequest({
          ...form,
          status: "pending",
          created_at: new Date().toISOString(),
        });
      }

      setForm(initialForm);
      setAgreed(false);

      presentToast({
        message: data.message || "Agent application submitted successfully!",
        color: "success",
        duration: 3500,
        icon: checkmarkCircleOutline,
      });
    } catch (err: any) {
      console.error("Submit agent request error:", err);
      setError(err.message || "Something went wrong while submitting your application.");
      presentToast({
        message: err.message || "Something went wrong.",
        color: "danger",
        duration: 3500,
      });
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Reset form
  // --------------------------------------------------
  const handleNewApplication = () => {
    setRequest(null);
    setError(null);
    setAgreed(false);
    setForm(initialForm);
    loadUserInformation();
  };

  // --------------------------------------------------
  // Copy Agent Code
  // --------------------------------------------------
  const copyAgentCode = async () => {
    if (!agentCode) return;
    try {
      await navigator.clipboard.writeText(agentCode);
      presentToast({
        message: "Agent Code copied!",
        color: "success",
        duration: 2000,
      });
    } catch {
      presentToast({
        message: "Could not copy code",
        color: "medium",
        duration: 2000,
      });
    }
  };

  const status = String(request?.status || "").toLowerCase();

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/customer/profile" />
          </IonButtons>
          <IonTitle>Become an Agent</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding agent-page">
        {checking ? (
          <div className="agent-loading">
            <IonSpinner name="crescent" />
            <IonText color="medium">Checking application status...</IonText>
          </div>
        ) : (
          <IonCard className="agent-card">
            <IonCardContent>
              {/* Error Banner */}
              {error && (
                <div className="agent-error">
                  <IonText color="danger">
                    <p>{error}</p>
                  </IonText>
                  <IonButton size="small" fill="outline" onClick={checkStatus}>
                    <IonIcon icon={refreshOutline} slot="start" />
                    Retry
                  </IonButton>
                </div>
              )}

              {/* ===================== EXISTING REQUEST ===================== */}
              {request ? (
                <div className="agent-status">
                  {/* ---------- PENDING ---------- */}
                  {status === "pending" && (
                    <>
                      <IonIcon icon={timeOutline} className="status-icon pending" />
                      <h2>Application Pending</h2>
                      <p>
                        Your agent application is currently being reviewed by an
                        administrator.
                      </p>

                      <div className="application-summary">
                        <strong>Applicant</strong>
                        <span>{request.full_name || "—"}</span>

                        <strong>Location</strong>
                        <span>{request.city || "—"}</span>

                        <strong>Phone</strong>
                        <span>{request.phone || "—"}</span>
                      </div>
                    </>
                  )}

                  {/* ---------- APPROVED ---------- */}
                  {status === "approved" && (
                    <>
                      <IonIcon
                        icon={checkmarkCircleOutline}
                        className="status-icon approved"
                      />
                      <h2>Congratulations!</h2>
                      <p>
                        Your application has been approved. You are now a official
                        MaloHub Agent.
                      </p>

                      {/* Agent Code Box */}
                      {(agentCode || request.agent_code) && (
                        <div
                          style={{
                            margin: "24px 0",
                            padding: "18px 20px",
                            background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
                            border: "1px solid #a7f3d0",
                            borderRadius: "14px",
                            textAlign: "center",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "#065f46",
                              marginBottom: "6px",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            Your Agent Code
                          </div>
                          <div
                            style={{
                              fontSize: "26px",
                              fontWeight: 800,
                              color: "#047857",
                              letterSpacing: "1px",
                              marginBottom: "12px",
                            }}
                          >
                            {agentCode || request.agent_code}
                          </div>
                          <IonButton
                            size="small"
                            fill="outline"
                            color="success"
                            onClick={copyAgentCode}
                          >
                            <IonIcon icon={copyOutline} slot="start" />
                            Copy Code
                          </IonButton>
                        </div>
                      )}

                      <IonButton
                        expand="block"
                        size="large"
                        onClick={() => router.push("/agent/dashboard")}
                      >
                        Go to Agent Dashboard
                      </IonButton>
                    </>
                  )}

                  {/* ---------- REJECTED ---------- */}
                  {status === "rejected" && (
                    <>
                      <IonIcon
                        icon={closeCircleOutline}
                        className="status-icon rejected"
                      />
                      <h2>Application Rejected</h2>
                      <p>
                        Unfortunately, your agent application was not approved.
                      </p>

                      {request.admin_note && (
                        <div className="admin-note">
                          <strong>Admin note:</strong>
                          <p>{request.admin_note}</p>
                        </div>
                      )}

                      <IonButton
                        fill="outline"
                        style={{ marginTop: 16 }}
                        onClick={handleNewApplication}
                      >
                        Submit a New Application
                      </IonButton>
                    </>
                  )}

                  {/* ---------- UNKNOWN STATUS ---------- */}
                  {!["pending", "approved", "rejected"].includes(status) && (
                    <>
                      <h2>Status: {request.status}</h2>
                      <p>Your application has been recorded.</p>
                    </>
                  )}

                  <IonButton
                    fill="clear"
                    size="small"
                    style={{ marginTop: 12 }}
                    onClick={checkStatus}
                  >
                    <IonIcon icon={refreshOutline} slot="start" />
                    Refresh Status
                  </IonButton>
                </div>
              ) : (
                /* ===================== APPLICATION FORM ===================== */
                !error && (
                  <>
                    {/* ... keep your entire existing form exactly as it was ... */}
                    {/* (Personal Info, Location, Professional, Message, Agreement, Submit) */}
                    {/* I left the form unchanged to keep this response focused */}
                  </>
                )
              )}
            </IonCardContent>
          </IonCard>
        )}
      </IonContent>
    </IonPage>
  );
}