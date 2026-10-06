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

      // No existing request
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
    if (!form.property_types) return "Please select the type of properties you want to manage.";
    if (!form.operating_areas.trim()) return "Please enter the areas where you intend to operate.";
    if (!form.message.trim()) return "Please explain why you want to become an agent.";
    if (!agreed) return "Please confirm that the information you provided is accurate.";

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
        // Fallback if backend doesn't return the full object
        setRequest({
          ...form,
          status: "pending",
          created_at: new Date().toISOString(),
        });
      }

      // Reset form after successful submission
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
  // Reset form when user wants to submit a new application
  // --------------------------------------------------
  const handleNewApplication = () => {
    setRequest(null);
    setError(null);
    setAgreed(false);
    setForm(initialForm);
    loadUserInformation(); // re-fill name, email, phone
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

                  {status === "approved" && (
                    <>
                      <IonIcon
                        icon={checkmarkCircleOutline}
                        className="status-icon approved"
                      />
                      <h2>Congratulations!</h2>
                      <p>
                        Your application has been approved. You are now a Dwelio
                        Agent.
                      </p>
                      <IonButton
                        expand="block"
                        onClick={() => router.push("/agent/dashboard")}
                      >
                        Go to Agent Dashboard
                      </IonButton>
                    </>
                  )}

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
                    <div className="agent-intro">
                      <IonIcon icon={personAddOutline} />
                      <h1>Become a MaloHub Agent</h1>
                      <p>
                        Complete the application below. The information you provide
                        will be reviewed by our administrators before your account
                        is approved.
                      </p>
                    </div>

                    {/* Personal Information */}
                    <div className="form-section">
                      <div className="section-heading">
                        <IonIcon icon={personAddOutline} />
                        <div>
                          <h3>Personal Information</h3>
                          <p>Tell us about yourself.</p>
                        </div>
                      </div>

                      <IonList lines="none">
                        <IonItem>
                          <IonInput
                            label="Full Name *"
                            labelPlacement="stacked"
                            fill="outline"
                            value={form.full_name}
                            placeholder="Enter your full name"
                            onIonInput={(e) =>
                              updateField("full_name", e.detail.value || "")
                            }
                          />
                        </IonItem>

                        <IonItem>
                          <IonInput
                            label="Phone Number *"
                            labelPlacement="stacked"
                            fill="outline"
                            type="tel"
                            value={form.phone}
                            placeholder="e.g. +265..."
                            onIonInput={(e) =>
                              updateField("phone", e.detail.value || "")
                            }
                          />
                        </IonItem>

                        <IonItem>
                          <IonInput
                            label="Email Address *"
                            labelPlacement="stacked"
                            fill="outline"
                            type="email"
                            value={form.email}
                            placeholder="Enter your email"
                            onIonInput={(e) =>
                              updateField("email", e.detail.value || "")
                            }
                          />
                        </IonItem>

                        <IonItem>
                          <IonInput
                            label="National ID / Identification Number *"
                            labelPlacement="stacked"
                            fill="outline"
                            value={form.national_id}
                            placeholder="Enter your identification number"
                            onIonInput={(e) =>
                              updateField("national_id", e.detail.value || "")
                            }
                          />
                        </IonItem>

                        <IonItem>
                          <IonInput
                            label="Date of Birth *"
                            labelPlacement="stacked"
                            fill="outline"
                            type="date"
                            value={form.date_of_birth}
                            onIonInput={(e) =>
                              updateField("date_of_birth", e.detail.value || "")
                            }
                          />
                        </IonItem>

                        <IonItem>
                          <IonSelect
                            label="Gender *"
                            labelPlacement="stacked"
                            fill="outline"
                            value={form.gender}
                            placeholder="Select gender"
                            onIonChange={(e) =>
                              updateField("gender", e.detail.value || "")
                            }
                          >
                            <IonSelectOption value="male">Male</IonSelectOption>
                            <IonSelectOption value="female">Female</IonSelectOption>
                            <IonSelectOption value="other">Other</IonSelectOption>
                            <IonSelectOption value="prefer_not_to_say">
                              Prefer not to say
                            </IonSelectOption>
                          </IonSelect>
                        </IonItem>
                      </IonList>
                    </div>

                    {/* Location Information */}
                    <div className="form-section">
                      <div className="section-heading">
                        <IonIcon icon={locationOutline} />
                        <div>
                          <h3>Location Information</h3>
                          <p>Where are you based?</p>
                        </div>
                      </div>

                      <IonList lines="none">
                        <IonItem>
                          <IonTextarea
                            label="Residential Address *"
                            labelPlacement="stacked"
                            fill="outline"
                            rows={3}
                            autoGrow
                            value={form.address}
                            placeholder="Enter your residential address"
                            onIonInput={(e) =>
                              updateField("address", e.detail.value || "")
                            }
                          />
                        </IonItem>

                        <IonItem>
                          <IonInput
                            label="City / Location *"
                            labelPlacement="stacked"
                            fill="outline"
                            value={form.city}
                            placeholder="e.g. Lilongwe"
                            onIonInput={(e) =>
                              updateField("city", e.detail.value || "")
                            }
                          />
                        </IonItem>

                        <IonItem>
                          <IonTextarea
                            label="Areas You Intend to Operate In *"
                            labelPlacement="stacked"
                            fill="outline"
                            rows={3}
                            autoGrow
                            value={form.operating_areas}
                            placeholder="e.g. Area 3, Area 10, Area 47, Lilongwe"
                            onIonInput={(e) =>
                              updateField("operating_areas", e.detail.value || "")
                            }
                          />
                        </IonItem>
                      </IonList>
                    </div>

                    {/* Professional Information */}
                    <div className="form-section">
                      <div className="section-heading">
                        <IonIcon icon={businessOutline} />
                        <div>
                          <h3>Professional Information</h3>
                          <p>Tell us about your professional background.</p>
                        </div>
                      </div>

                      <IonList lines="none">
                        <IonItem>
                          <IonInput
                            label="Occupation *"
                            labelPlacement="stacked"
                            fill="outline"
                            value={form.occupation}
                            placeholder="e.g. Businessperson, Teacher, Property Manager"
                            onIonInput={(e) =>
                              updateField("occupation", e.detail.value || "")
                            }
                          />
                        </IonItem>

                        <IonItem>
                          <IonSelect
                            label="Real Estate Experience *"
                            labelPlacement="stacked"
                            fill="outline"
                            value={form.experience}
                            placeholder="Select experience"
                            onIonChange={(e) =>
                              updateField("experience", e.detail.value || "")
                            }
                          >
                            <IonSelectOption value="none">No experience</IonSelectOption>
                            <IonSelectOption value="less_than_1">
                              Less than 1 year
                            </IonSelectOption>
                            <IonSelectOption value="1_3">1–3 years</IonSelectOption>
                            <IonSelectOption value="3_5">3–5 years</IonSelectOption>
                            <IonSelectOption value="5_plus">
                              More than 5 years
                            </IonSelectOption>
                          </IonSelect>
                        </IonItem>

                        <IonItem>
                          <IonInput
                            label="Company / Agency Name (Optional)"
                            labelPlacement="stacked"
                            fill="outline"
                            value={form.company_name}
                            placeholder="Enter company or agency name"
                            onIonInput={(e) =>
                              updateField("company_name", e.detail.value || "")
                            }
                          />
                        </IonItem>

                        <IonItem>
                          <IonInput
                            label="License Number (Optional)"
                            labelPlacement="stacked"
                            fill="outline"
                            value={form.license_number}
                            placeholder="Enter license number if applicable"
                            onIonInput={(e) =>
                              updateField("license_number", e.detail.value || "")
                            }
                          />
                        </IonItem>

                        <IonItem>
                          <IonSelect
                            label="Property Type You Want to Manage *"
                            labelPlacement="stacked"
                            fill="outline"
                            value={form.property_types}
                            placeholder="Select property type"
                            onIonChange={(e) =>
                              updateField("property_types", e.detail.value || "")
                            }
                          >
                            <IonSelectOption value="houses">Houses</IonSelectOption>
                            <IonSelectOption value="apartments">
                              Apartments
                            </IonSelectOption>
                            <IonSelectOption value="land">Land</IonSelectOption>
                            <IonSelectOption value="commercial">
                              Commercial Properties
                            </IonSelectOption>
                            <IonSelectOption value="all">
                              All Property Types
                            </IonSelectOption>
                          </IonSelect>
                        </IonItem>
                      </IonList>
                    </div>

                    {/* Application Details */}
                    <div className="form-section">
                      <div className="section-heading">
                        <IonIcon icon={documentTextOutline} />
                        <div>
                          <h3>Application Details</h3>
                          <p>Explain why you want to become an agent.</p>
                        </div>
                      </div>

                      <IonItem>
                        <IonTextarea
                          label="Why do you want to become a Dwelio Agent? *"
                          labelPlacement="stacked"
                          fill="outline"
                          autoGrow
                          rows={5}
                          value={form.message}
                          placeholder="Tell us about yourself, your goals, and why you would like to become a Dwelio Agent."
                          onIonInput={(e) =>
                            updateField("message", e.detail.value || "")
                          }
                        />
                      </IonItem>
                    </div>

                    {/* Agreement */}
                    <div className="agreement-box">
                      <IonCheckbox
                        checked={agreed}
                        onIonChange={(e) => setAgreed(e.detail.checked)}
                      />
                      <IonLabel>
                        I confirm that the information provided in this application
                        is accurate and complete. I understand that Dwelio may review
                        my information before approving my agent account.
                      </IonLabel>
                    </div>

                    {/* Submit Button */}
                    <IonButton
                      expand="block"
                      size="large"
                      className="submit-agent-button"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <IonSpinner name="crescent" style={{ marginRight: 8 }} />
                          Submitting Application...
                        </>
                      ) : (
                        <>
                          <IonIcon icon={personAddOutline} slot="start" />
                          Submit Agent Application
                        </>
                      )}
                    </IonButton>

                    <p className="application-note">
                      Your application will be reviewed by a Dwelio administrator.
                      You will be notified when a decision has been made.
                    </p>
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