import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSpinner,
  useIonToast,
  useIonRouter,
} from "@ionic/react";
import { useState } from "react";

const API_URL = "http://localhost:5001";

const ChangePassword: React.FC = () => {
  const router = useIonRouter();
  const [presentToast] = useIonToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      presentToast({
        message: "All fields are required",
        duration: 2000,
        color: "warning",
      });
      return;
    }

    if (newPassword.length < 6) {
      presentToast({
        message: "New password must be at least 6 characters",
        duration: 2000,
        color: "warning",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      presentToast({
        message: "New passwords do not match",
        duration: 2000,
        color: "warning",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      presentToast({
        message: "Please login again",
        duration: 2000,
        color: "danger",
      });
      router.push("/login", "root");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/users/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to change password");
      }

      presentToast({
        message: "Password changed successfully",
        duration: 2000,
        color: "success",
      });

      setTimeout(() => {
        router.goBack();
      }, 700);
    } catch (err: any) {
      console.error(err);
      presentToast({
        message: err.message || "Failed to change password",
        duration: 3000,
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/customer/profile" />
          </IonButtons>
          <IonTitle>Change Password</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonList inset>
          <IonItem>
            <IonLabel position="stacked">Current Password</IonLabel>
            <IonInput
              type="password"
              value={currentPassword}
              onIonInput={(e) => setCurrentPassword(e.detail.value || "")}
              placeholder="Enter current password"
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">New Password</IonLabel>
            <IonInput
              type="password"
              value={newPassword}
              onIonInput={(e) => setNewPassword(e.detail.value || "")}
              placeholder="Enter new password"
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Confirm New Password</IonLabel>
            <IonInput
              type="password"
              value={confirmPassword}
              onIonInput={(e) => setConfirmPassword(e.detail.value || "")}
              placeholder="Confirm new password"
            />
          </IonItem>
        </IonList>

        <div style={{ marginTop: 24, padding: "0 8px" }}>
          <IonButton
            expand="block"
            onClick={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <>
                <IonSpinner name="crescent" style={{ marginRight: 8 }} />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ChangePassword;