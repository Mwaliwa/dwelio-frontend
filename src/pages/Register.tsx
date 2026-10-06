import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonText,
  IonLoading,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCheckbox,
  useIonRouter,
  useIonToast,
} from "@ionic/react";

import {
  personOutline,
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  checkmarkCircleOutline,
  arrowBackOutline,
} from "ionicons/icons";

/* =========================================================
   API
========================================================= */

const API_URL = "http://localhost:5001";

/* =========================================================
   RESPONSE TYPE
========================================================= */

interface RegisterResponse {
  success?: boolean;
  message?: string;
  error?: string;

  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

/* =========================================================
   REGISTER PAGE
========================================================= */

export default function Register() {
  const router = useIonRouter();
  const [presentToast] = useIonToast();

  /* =======================================================
     FORM STATE
  ======================================================= */

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  /* =======================================================
     UI STATE
  ======================================================= */

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =======================================================
     TOAST
  ======================================================= */

  const showToast = async (
    message: string,
    color: "success" | "danger" | "warning" | "primary"
  ) => {
    await presentToast({
      message,
      duration: 3000,
      position: "top",
      color,
    });
  };

  /* =======================================================
     VALIDATE
  ======================================================= */

  const validateForm = () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError("Please enter your full name.");
      return false;
    }

    if (cleanName.length < 2) {
      setError("Your name must contain at least 2 characters.");
      return false;
    }

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return false;
    }

    if (!password) {
      setError("Please enter a password.");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }

    if (!confirmPassword) {
      setError("Please confirm your password.");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    if (!acceptTerms) {
      setError("Please accept the Terms & Conditions.");
      return false;
    }

    return true;
  };

  /* =======================================================
     REGISTER
  ======================================================= */

  const handleRegister = async () => {
    if (loading) return;

    setError("");

    if (!validateForm()) {
      return;
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    setLoading(true);

    try {
      const endpoint = `${API_URL}/api/auth/register`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password,
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      let data: RegisterResponse = {};

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Server response:", text);
        throw new Error("The server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || "Registration failed.");
      }

      await showToast("Account created successfully!", "success");

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setAcceptTerms(false);

      setTimeout(() => {
        router.push("/login", "root");
      }, 800);
    } catch (err: unknown) {
      console.error("REGISTRATION ERROR:", err);

      let message = "Unable to create account.";

      if (err instanceof TypeError) {
        message =
          "Cannot connect to the server. Make sure the backend is running.";
      } else if (err instanceof Error) {
        message = err.message;
      }

      setError(message);
      await showToast(message, "danger");
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <IonPage>
      {/* ===================================================
          EMBEDDED RESPONSIVE CSS
      =================================================== */}
      <style>
        {`
        * {
          box-sizing: border-box;
        }

        .register-content {
          --background: transparent;
        }

        .register-background {
          min-height: 100%;
          width: 100%;
          padding: 30px 20px 20px;
          position: relative;
          background-image: url('/assets/nice.jpg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .register-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.55),
            rgba(0, 0, 0, 0.72)
          );
          z-index: 1;
        }

        .register-container {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          min-height: calc(100vh - 120px);
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(380px, 1fr);
          gap: 60px;
          align-items: center;
        }

        /* =================================================
           INTRO
        ================================================= */

        .register-intro {
          padding: 20px;
          color: white;
        }

        .register-intro h1 {
          margin: 0 0 16px;
          font-size: clamp(2rem, 4vw, 3.2rem);
          line-height: 1.15;
          font-weight: 800;
          color: white;
          text-shadow: 0 3px 12px rgba(0, 0, 0, 0.45);
        }

        .register-intro > p {
          max-width: 480px;
          margin: 0 0 30px;
          font-size: 17px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.9);
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        /* =================================================
           FEATURES
        ================================================= */

        .intro-features {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .intro-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(255, 255, 255, 0.95);
          font-size: 15px;
        }

        .intro-feature ion-icon {
          font-size: 22px;
          color: #90caf9;
          flex-shrink: 0;
        }

        /* =================================================
           CARD
        ================================================= */

        .register-card {
          width: 100%;
          margin: 0;
          border-radius: 22px;
          background: white;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
          overflow: hidden;
        }

        .register-card ion-card-content {
          padding: 34px;
        }

        /* =================================================
           HEADER
        ================================================= */

        .form-header {
          margin-bottom: 25px;
        }

        .form-header h2 {
          margin: 0 0 8px;
          font-size: 28px;
          font-weight: 750;
          color: #172033;
        }

        .form-header p {
          margin: 0;
          color: #667085;
          font-size: 14px;
          line-height: 1.5;
        }

        /* =================================================
           ERROR
        ================================================= */

        .register-error {
          padding: 13px 15px;
          margin-bottom: 18px;
          border-radius: 10px;
          background: #fff1f1;
          border: 1px solid #ffd0d0;
          font-size: 14px;
          line-height: 1.5;
        }

        /* =================================================
           INPUTS
        ================================================= */

        .form-item {
          --background: transparent;
          --padding-start: 0;
          --inner-padding-end: 0;
          margin-bottom: 14px;
        }

        .form-item ion-icon {
          margin-right: 10px;
          margin-top: 20px;
        }

        .form-item ion-label {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 7px;
        }

        .form-item ion-input {
          --padding-top: 9px;
          --padding-bottom: 12px;
          font-size: 15px;
        }

        .form-item ion-button {
          margin-top: 17px;
        }

        /* =================================================
           TERMS
        ================================================= */

        .terms-container {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin: 22px 0;
          font-size: 13px;
          line-height: 1.55;
        }

        .terms-container ion-checkbox {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .terms-container strong {
          color: #3880ff;
        }

        /* =================================================
           REGISTER BUTTON
        ================================================= */

        .register-button {
          --border-radius: 12px;
          height: 52px;
          margin-top: 5px;
          font-size: 15px;
          font-weight: 700;
          text-transform: none;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .register-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(56, 128, 255, 0.25);
        }

        .register-button:active {
          transform: translateY(0);
        }

        /* =================================================
           LOGIN
        ================================================= */

        .login-section {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 5px;
          margin-top: 20px;
          font-size: 14px;
        }

        .login-section ion-button {
          --padding-start: 5px;
          --padding-end: 5px;
          font-weight: 700;
          text-transform: none;
        }

        /* =================================================
           FOOTER
        ================================================= */

        .register-footer {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1100px;
          margin: 20px auto 0;
          padding: 10px;
          text-align: center;
          color: rgba(255, 255, 255, 0.75);
          font-size: 12px;
        }

        /* =================================================
           TABLET
        ================================================= */

        @media (max-width: 900px) {
          .register-background {
            padding: 25px 16px 20px;
          }

          .register-container {
            grid-template-columns: 1fr;
            max-width: 600px;
            gap: 25px;
            min-height: auto;
          }

          .register-intro {
            text-align: center;
            padding: 10px;
          }

          .register-intro h1 {
            font-size: 2.2rem;
          }

          .register-intro > p {
            margin-left: auto;
            margin-right: auto;
          }

          .intro-features {
            display: none;
          }
        }

        /* =================================================
           MOBILE
        ================================================= */

        @media (max-width: 600px) {
          .register-background {
            padding: 15px 10px 15px;
          }

          .register-container {
            width: 100%;
            gap: 10px;
          }

          .register-intro {
            padding: 8px 5px 5px;
          }

          .register-intro h1 {
            font-size: 1.8rem;
            margin-bottom: 8px;
          }

          .register-intro > p {
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 10px;
          }

          .register-card {
            border-radius: 16px;
            box-shadow: 0 10px 35px rgba(0, 0, 0, 0.2);
          }

          .register-card ion-card-content {
            padding: 20px 16px;
          }

          .form-header {
            margin-bottom: 20px;
          }

          .form-header h2 {
            font-size: 23px;
          }

          .form-header p {
            font-size: 13px;
          }

          .register-error {
            font-size: 13px;
            padding: 11px 12px;
          }

          .form-item {
            margin-bottom: 10px;
          }

          .form-item ion-input {
            font-size: 14px;
          }

          .terms-container {
            font-size: 12px;
            gap: 9px;
            margin: 18px 0;
          }

          .register-button {
            height: 50px;
            font-size: 14px;
          }

          .login-section {
            font-size: 13px;
            margin-top: 16px;
          }

          .register-footer {
            font-size: 11px;
            padding-bottom: 5px;
          }
        }

        /* =================================================
           SMALL PHONES
        ================================================= */

        @media (max-width: 360px) {
          .register-background {
            padding: 10px 7px;
          }

          .register-card ion-card-content {
            padding: 18px 12px;
          }

          .register-intro h1 {
            font-size: 1.55rem;
          }

          .register-intro > p {
            font-size: 13px;
          }

          .form-header h2 {
            font-size: 21px;
          }

          .terms-container {
            font-size: 11px;
          }
        }

        /* =================================================
           LANDSCAPE PHONE
        ================================================= */

        @media (max-height: 600px) and (orientation: landscape) {
          .register-container {
            min-height: auto;
            padding-top: 10px;
          }

          .register-intro {
            display: none;
          }

          .register-card {
            max-width: 600px;
            margin: 0 auto;
          }
        }
        `}
      </style>

      {/* ===================================================
          HEADER
      =================================================== */}
      <IonHeader>
        <IonToolbar color="primary">
          <IonButton
            slot="start"
            fill="clear"
            color="light"
            type="button"
            onClick={() => router.push("/", "back")}
          >
            <IonIcon icon={arrowBackOutline} />
          </IonButton>

          <IonTitle>MaloHub</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* ===================================================
          CONTENT
      =================================================== */}
      <IonContent fullscreen className="register-content">
        <div className="register-background">
          {/* Dark overlay */}
          <div className="register-overlay" />

          <div className="register-container">
            {/* =================================================
                INTRO (Logo removed)
            ================================================= */}
            <div className="register-intro">
              <h1>Welcome to MaloHub</h1>

              <p>
                Create your account and discover your next home, apartment,
                land or investment property.
              </p>

              <div className="intro-features">
                <div className="intro-feature">
                  <IonIcon icon={checkmarkCircleOutline} />
                  <span>Browse properties</span>
                </div>

                <div className="intro-feature">
                  <IonIcon icon={checkmarkCircleOutline} />
                  <span>Connect with property owners</span>
                </div>

                <div className="intro-feature">
                  <IonIcon icon={checkmarkCircleOutline} />
                  <span>Rent or buy with confidence</span>
                </div>
              </div>
            </div>

            {/* =================================================
                REGISTER FORM
            ================================================= */}
            <IonCard className="register-card">
              <IonCardContent>
                <div className="form-header">
                  <h2>Create Account</h2>
                  <p>Fill in your details to create your MaloHub account.</p>
                </div>

                {/* ERROR */}
                {error && (
                  <div className="register-error">
                    <IonText color="danger">{error}</IonText>
                  </div>
                )}

                {/* NAME */}
                <IonItem className="form-item" lines="full">
                  <IonIcon slot="start" icon={personOutline} color="medium" />
                  <IonLabel position="stacked">Full Name</IonLabel>
                  <IonInput
                    type="text"
                    value={name}
                    placeholder="Enter your full name"
                    autocomplete="name"
                    clearInput
                    onIonInput={(event) => setName(event.detail.value || "")}
                  />
                </IonItem>

                {/* EMAIL */}
                <IonItem className="form-item" lines="full">
                  <IonIcon slot="start" icon={mailOutline} color="medium" />
                  <IonLabel position="stacked">Email Address</IonLabel>
                  <IonInput
                    type="email"
                    value={email}
                    placeholder="you@example.com"
                    autocomplete="email"
                    inputMode="email"
                    clearInput
                    onIonInput={(event) => setEmail(event.detail.value || "")}
                  />
                </IonItem>

                {/* PASSWORD */}
                <IonItem className="form-item" lines="full">
                  <IonIcon
                    slot="start"
                    icon={lockClosedOutline}
                    color="medium"
                  />
                  <IonLabel position="stacked">Password</IonLabel>
                  <IonInput
                    type={showPassword ? "text" : "password"}
                    value={password}
                    placeholder="Minimum 6 characters"
                    autocomplete="new-password"
                    onIonInput={(event) =>
                      setPassword(event.detail.value || "")
                    }
                  />
                  <IonButton
                    slot="end"
                    fill="clear"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <IonIcon
                      icon={showPassword ? eyeOffOutline : eyeOutline}
                    />
                  </IonButton>
                </IonItem>

                {/* CONFIRM PASSWORD */}
                <IonItem className="form-item" lines="full">
                  <IonIcon
                    slot="start"
                    icon={lockClosedOutline}
                    color="medium"
                  />
                  <IonLabel position="stacked">Confirm Password</IonLabel>
                  <IonInput
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    placeholder="Repeat your password"
                    autocomplete="new-password"
                    onIonInput={(event) =>
                      setConfirmPassword(event.detail.value || "")
                    }
                  />
                  <IonButton
                    slot="end"
                    fill="clear"
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                  >
                    <IonIcon
                      icon={
                        showConfirmPassword ? eyeOffOutline : eyeOutline
                      }
                    />
                  </IonButton>
                </IonItem>

                {/* TERMS */}
                <div className="terms-container">
                  <IonCheckbox
                    checked={acceptTerms}
                    onIonChange={(event) =>
                      setAcceptTerms(event.detail.checked)
                    }
                  />
                  <IonText color="medium">
                    I agree to MaloHub's{" "}
                    <strong>Terms & Conditions</strong> and{" "}
                    <strong>Privacy Policy</strong>.
                  </IonText>
                </div>

                {/* REGISTER */}
                <IonButton
                  expand="block"
                  size="large"
                  color="primary"
                  type="button"
                  className="register-button"
                  disabled={loading}
                  onClick={handleRegister}
                >
                  <IonIcon icon={checkmarkCircleOutline} slot="start" />
                  {loading ? "Creating Account..." : "Create Account"}
                </IonButton>

                {/* LOGIN */}
                <div className="login-section">
                  <IonText color="medium">Already have an account?</IonText>
                  <IonButton
                    fill="clear"
                    size="small"
                    type="button"
                    onClick={() => router.push("/login", "forward")}
                  >
                    Login
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          </div>

          {/* FOOTER */}
          <div className="register-footer">
            © {new Date().getFullYear()} MaloHub. All rights reserved.
          </div>
        </div>
      </IonContent>

      {/* LOADING */}
      <IonLoading
        isOpen={loading}
        message="Creating your account..."
        spinner="crescent"
      />
    </IonPage>
  );
}