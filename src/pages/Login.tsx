import React, { useContext, useState } from "react";
import { flushSync } from "react-dom";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonSpinner,
  useIonRouter,
} from "@ionic/react";

import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const router = useIonRouter();
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error("Login must be used inside AuthProvider");
  }

  const { login } = auth;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = "http://localhost:5001/api/auth/login";

  const handleLogin = async () => {
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
      });

      let data: any = {};
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.toLowerCase().includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || "Server returned an invalid response.");
      }

      console.log("LOGIN RESPONSE:", data);

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || "Invalid login details."
        );
      }

      if (!data.token || !data.user) {
        throw new Error(
          "Invalid server response. Token or user information is missing."
        );
      }

      // -------------------------------------------------
      // NORMALIZE USER
      // -------------------------------------------------
      const serverUser = data.user;

      const userId = serverUser.id || serverUser.user_id;
      const userName =
        serverUser.name || serverUser.full_name || "Customer";
      const userEmail = serverUser.email || cleanEmail;
      const role = String(serverUser.role || "customer").toLowerCase();

      if (!userId) {
        throw new Error("User ID is missing from server response.");
      }

      const user = {
        id: userId,
        name: userName,
        email: userEmail,
        role,
      };

      console.log("NORMALIZED USER:", user);

      // -------------------------------------------------
      // CRITICAL FIX
      // Force React to commit the auth state update
      // BEFORE we navigate. This prevents the
      // "stuck on login page" race condition.
      // -------------------------------------------------
      flushSync(() => {
        login(data.token, user);
      });

      console.log("AUTH SAVED:", {
        token: data.token,
        user,
        role,
      });

      // -------------------------------------------------
      // NAVIGATION (history is replaced so user can't
      // go back to the login page)
      // -------------------------------------------------
      if (role === "admin") {
        router.push("/admin", "root", "replace");
      } else if (role === "agent" || role === "landlord") {
        router.push("/agent/dashboard", "root", "replace");
      } else {
        router.push("/customer", "root", "replace");
      }
    } catch (err: any) {
      console.error("LOGIN ERROR:", err);

      if (
        err?.message === "Failed to fetch" ||
        err?.name === "TypeError"
      ) {
        setError(
          "Cannot connect to the server. Please check that the backend is running and CORS is configured correctly."
        );
      } else {
        setError(err?.message || "Unable to login.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Allow pressing Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleLogin();
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Login to MaloHub</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard>
          <IonCardContent>
            <h2 className="ion-text-center">Welcome Back </h2>

            {error && (
              <IonText color="danger">
                <p className="ion-text-center">{error}</p>
              </IonText>
            )}

            <IonItem>
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput
                type="email"
                placeholder="Enter email"
                value={email}
                onIonInput={(e) => setEmail(e.detail.value || "")}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Password</IonLabel>
              <IonInput
                type="password"
                placeholder="Enter password"
                value={password}
                onIonInput={(e) => setPassword(e.detail.value || "")}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
            </IonItem>

            <IonButton
              expand="block"
              className="ion-margin-top"
              disabled={loading || !email.trim() || !password}
              onClick={handleLogin}
            >
              {loading ? <IonSpinner name="crescent" /> : "Sign In"}
            </IonButton>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
}