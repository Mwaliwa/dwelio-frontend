// src/routes/ProtectedRoute.tsx
import React, { useContext } from "react";
import { Route, Redirect, RouteProps } from "react-router-dom";
import { IonSpinner, IonPage, IonContent } from "@ionic/react";
import { AuthContext } from "../context/AuthContext";

interface ProtectedRouteProps extends RouteProps {
  component: React.ComponentType<any>;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  component: Component,
  allowedRoles = [],
  ...rest
}) => {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error("ProtectedRoute must be used inside AuthProvider");
  }

  const { user, loading, isAuthenticated } = auth;

  return (
    <Route
      {...rest}
      render={(props) => {
        // Loading → spinner (never blank)
        if (loading) {
          return (
            <IonPage>
              <IonContent className="ion-padding ion-text-center">
                <div style={{ marginTop: "35vh" }}>
                  <IonSpinner name="crescent" />
                </div>
              </IonContent>
            </IonPage>
          );
        }

        // Not logged in
        if (!isAuthenticated || !user) {
          return <Redirect to="/login" />;
        }

        // Role check
        const userRole = (user.role || "customer").toLowerCase();
        const allowed = allowedRoles.map((r) => r.toLowerCase());

        if (allowed.length > 0 && !allowed.includes(userRole)) {
          if (userRole === "admin") return <Redirect to="/admin" />;
          if (userRole === "agent" || userRole === "landlord") {
            return <Redirect to="/agent/dashboard" />;
          }
          return <Redirect to="/customer" />;
        }

        // OK
        return <Component {...props} />;
      }}
    />
  );
};

export default ProtectedRoute;