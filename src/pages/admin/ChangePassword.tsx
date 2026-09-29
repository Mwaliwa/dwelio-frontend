import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonNote,
  IonSpinner,
  useIonToast,
  useIonAlert,
  useIonRouter,
} from "@ionic/react";

import {
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  keyOutline,
  checkmarkCircleOutline,
  shieldCheckmarkOutline,
} from "ionicons/icons";

const API_URL = "http://localhost:5001";

export default function ChangePassword() {
  const router = useIonRouter();
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);

  /* =====================================================
     PASSWORD VALIDATION
  ===================================================== */

  const passwordLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

  const passwordsMatch =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;

  /* =====================================================
     VALIDATE
  ===================================================== */

  const validateForm = () => {
    if (!currentPassword.trim()) {
      return "Please enter your current password.";
    }

    if (!newPassword.trim()) {
      return "Please enter your new password.";
    }

    if (newPassword.length < 8) {
      return "New password must contain at least 8 characters.";
    }

    if (!hasUppercase) {
      return "New password must contain at least one uppercase letter.";
    }

    if (!hasLowercase) {
      return "New password must contain at least one lowercase letter.";
    }

    if (!hasNumber) {
      return "New password must contain at least one number.";
    }

    if (!hasSpecial) {
      return "New password must contain at least one special character.";
    }

    if (!confirmPassword.trim()) {
      return "Please confirm your new password.";
    }

    if (newPassword !== confirmPassword) {
      return "The new passwords do not match.";
    }

    if (currentPassword === newPassword) {
      return "Your new password must be different from your current password.";
    }

    return null;
  };

  /* =====================================================
     CHANGE PASSWORD
  ===================================================== */

  const changePassword = async () => {
    const validationError = validateForm();

    if (validationError) {
      presentToast({
        message: validationError,
        duration: 3000,
        position: "top",
        color: "danger",
      });

      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      presentToast({
        message: "Your session has expired. Please log in again.",
        duration: 3000,
        position: "top",
        color: "danger",
      });

      router.push("/login", "root", "replace");

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/change-password`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      let data: {
        success?: boolean;
        message?: string;
      } = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        presentToast({
          message: "Your session has expired. Please log in again.",
          duration: 3000,
          position: "top",
          color: "danger",
        });

        router.push("/login", "root", "replace");

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to change password."
        );
      }

      presentToast({
        message:
          data.message || "Password changed successfully.",
        duration: 2500,
        position: "top",
        color: "success",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push("/admin/settings", "back");
      }, 700);
    } catch (error) {
      console.error("CHANGE PASSWORD ERROR:", error);

      presentToast({
        message:
          error instanceof Error
            ? error.message
            : "Unable to change password.",
        duration: 3500,
        position: "top",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     CONFIRM
  ===================================================== */

  const handleSubmit = () => {
    const validationError = validateForm();

    if (validationError) {
      presentToast({
        message: validationError,
        duration: 3000,
        position: "top",
        color: "danger",
      });

      return;
    }

    presentAlert({
      header: "Change Password",
      message:
        "Are you sure you want to change your password?",
      buttons: [
        {
          text: "Cancel",
          role: "cancel",
        },
        {
          text: "Change",
          handler: () => {
            changePassword();
          },
        },
      ],
    });
  };

  /* =====================================================
     REQUIREMENT
  ===================================================== */

  const Requirement = ({
    valid,
    text,
  }: {
    valid: boolean;
    text: string;
  }) => {
    return (
      <div className="password-requirement">
        <IonIcon
          icon={
            valid
              ? checkmarkCircleOutline
              : shieldCheckmarkOutline
          }
          className={valid ? "valid" : "invalid"}
        />

        <span>{text}</span>
      </div>
    );
  };

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="dark">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/admin/settings" />
          </IonButtons>

          <IonTitle>Change Password</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="change-password-content">
        <div className="change-password-container">

          {/* HEADER */}
          <div className="password-header">
            <div className="password-icon">
              <IonIcon icon={lockClosedOutline} />
            </div>

            <h1>Change Password</h1>

            <p>
              Update your password to keep your Dwelio
              administrator account secure.
            </p>
          </div>

          {/* SECURITY MESSAGE */}
          <div className="security-box">
            <IonIcon icon={shieldCheckmarkOutline} />

            <div>
              <strong>Keep your account secure</strong>

              <p>
                Use a strong password that you do not
                use on other websites.
              </p>
            </div>
          </div>

          {/* CURRENT PASSWORD */}
          <div className="form-group">
            <IonLabel>Current Password</IonLabel>

            <IonItem lines="none" className="password-item">
              <IonIcon
                slot="start"
                icon={lockClosedOutline}
                color="medium"
              />

              <IonInput
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                placeholder="Enter current password"
                autocomplete="current-password"
                onIonInput={(event) => {
                  setCurrentPassword(
                    event.detail.value || ""
                  );
                }}
              />

              <IonButton
                slot="end"
                fill="clear"
                onClick={() => {
                  setShowCurrent(!showCurrent);
                }}
              >
                <IonIcon
                  icon={
                    showCurrent
                      ? eyeOffOutline
                      : eyeOutline
                  }
                />
              </IonButton>
            </IonItem>
          </div>

          {/* NEW PASSWORD */}
          <div className="form-group">
            <IonLabel>New Password</IonLabel>

            <IonItem lines="none" className="password-item">
              <IonIcon
                slot="start"
                icon={keyOutline}
                color="medium"
              />

              <IonInput
                type={showNew ? "text" : "password"}
                value={newPassword}
                placeholder="Enter new password"
                autocomplete="new-password"
                onIonInput={(event) => {
                  setNewPassword(
                    event.detail.value || ""
                  );
                }}
              />

              <IonButton
                slot="end"
                fill="clear"
                onClick={() => {
                  setShowNew(!showNew);
                }}
              >
                <IonIcon
                  icon={
                    showNew
                      ? eyeOffOutline
                      : eyeOutline
                  }
                />
              </IonButton>
            </IonItem>
          </div>

          {/* REQUIREMENTS */}
          <div className="requirements">
            <h3>Password Requirements</h3>

            <Requirement
              valid={passwordLength}
              text="At least 8 characters"
            />

            <Requirement
              valid={hasUppercase}
              text="At least one uppercase letter"
            />

            <Requirement
              valid={hasLowercase}
              text="At least one lowercase letter"
            />

            <Requirement
              valid={hasNumber}
              text="At least one number"
            />

            <Requirement
              valid={hasSpecial}
              text="At least one special character"
            />
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="form-group">
            <IonLabel>Confirm New Password</IonLabel>

            <IonItem lines="none" className="password-item">
              <IonIcon
                slot="start"
                icon={lockClosedOutline}
                color="medium"
              />

              <IonInput
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                placeholder="Confirm new password"
                autocomplete="new-password"
                onIonInput={(event) => {
                  setConfirmPassword(
                    event.detail.value || ""
                  );
                }}
              />

              <IonButton
                slot="end"
                fill="clear"
                onClick={() => {
                  setShowConfirm(!showConfirm);
                }}
              >
                <IonIcon
                  icon={
                    showConfirm
                      ? eyeOffOutline
                      : eyeOutline
                  }
                />
              </IonButton>
            </IonItem>

            {confirmPassword &&
              !passwordsMatch && (
                <IonNote color="danger">
                  Passwords do not match.
                </IonNote>
              )}

            {passwordsMatch && (
              <IonNote color="success">
                Passwords match.
              </IonNote>
            )}
          </div>

          {/* BUTTON */}
          <IonButton
            expand="block"
            size="large"
            className="change-button"
            disabled={
              loading ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword
            }
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <IonSpinner name="crescent" />
                <span>Changing Password...</span>
              </>
            ) : (
              <>
                <IonIcon
                  slot="start"
                  icon={checkmarkCircleOutline}
                />

                Change Password
              </>
            )}
          </IonButton>

          {/* CANCEL */}
          <IonButton
            expand="block"
            fill="clear"
            color="medium"
            disabled={loading}
            onClick={() => {
              router.push(
                "/admin/settings",
                "back"
              );
            }}
          >
            Cancel
          </IonButton>

          {/* FOOTER */}
          <div className="page-footer">
            <IonIcon icon={shieldCheckmarkOutline} />

            <p>
              Dwelio protects your account using secure
              password encryption.
            </p>
          </div>
        </div>
      </IonContent>

      {/* ===================================================
          EMBEDDED CSS
      =================================================== */}

      <style>
        {`
          .change-password-content {
            --background: var(--ion-background-color);
          }

          .change-password-container {
            width: 100%;
            max-width: 650px;
            margin: 0 auto;
            padding: 24px 16px 45px;
            box-sizing: border-box;
          }

          .password-header {
            text-align: center;
            margin-bottom: 25px;
          }

          .password-icon {
            width: 68px;
            height: 68px;
            margin: 0 auto 15px;
            border-radius: 18px;

            display: flex;
            align-items: center;
            justify-content: center;

            background: var(--ion-color-primary);
            color: white;

            font-size: 32px;

            box-shadow:
              0 8px 25px rgba(0, 0, 0, 0.12);
          }

          .password-header h1 {
            margin: 0;
            font-size: 25px;
            font-weight: 700;
            color: var(--ion-text-color);
          }

          .password-header p {
            max-width: 500px;
            margin: 8px auto 0;

            font-size: 14px;
            line-height: 1.5;

            color: var(--ion-color-medium);
          }

          .security-box {
            display: flex;
            align-items: center;

            gap: 13px;

            padding: 15px;

            margin-bottom: 25px;

            border-radius: 15px;

            background: rgba(
              var(--ion-color-primary-rgb),
              0.08
            );
          }

          .security-box > ion-icon {
            flex-shrink: 0;

            font-size: 27px;

            color: var(--ion-color-primary);
          }

          .security-box strong {
            display: block;

            font-size: 14px;

            color: var(--ion-text-color);
          }

          .security-box p {
            margin: 4px 0 0;

            font-size: 12px;

            line-height: 1.4;

            color: var(--ion-color-medium);
          }

          .form-group {
            margin-bottom: 20px;
          }

          .form-group > ion-label {
            display: block;

            margin-left: 4px;
            margin-bottom: 7px;

            font-size: 13px;
            font-weight: 600;

            color: var(--ion-text-color);
          }

          .password-item {
            --background: var(--ion-item-background);

            --padding-start: 12px;
            --padding-end: 5px;

            --min-height: 56px;

            border: 1px solid
              var(--ion-color-light-shade);

            border-radius: 14px;
          }

          .password-item ion-input {
            --padding-top: 8px;
            --padding-bottom: 8px;
          }

          .requirements {
            margin-bottom: 22px;

            padding: 16px;

            border-radius: 15px;

            background: var(--ion-item-background);

            border: 1px solid
              var(--ion-color-light-shade);
          }

          .requirements h3 {
            margin: 0 0 14px;

            font-size: 14px;

            font-weight: 700;

            color: var(--ion-text-color);
          }

          .password-requirement {
            display: flex;
            align-items: center;

            gap: 9px;

            margin-bottom: 9px;

            font-size: 12px;

            color: var(--ion-color-medium);
          }

          .password-requirement:last-child {
            margin-bottom: 0;
          }

          .password-requirement ion-icon {
            font-size: 17px;
          }

          .password-requirement ion-icon.valid {
            color: var(--ion-color-success);
          }

          .password-requirement ion-icon.invalid {
            color: var(--ion-color-medium);
          }

          .form-group ion-note {
            display: block;

            margin: 7px 4px 0;

            font-size: 11px;
          }

          .change-button {
            margin-top: 10px;

            --border-radius: 14px;

            font-weight: 700;

            text-transform: none;
          }

          .change-button ion-spinner {
            margin-right: 9px;
          }

          .page-footer {
            text-align: center;

            margin-top: 25px;

            color: var(--ion-color-medium);
          }

          .page-footer ion-icon {
            font-size: 22px;

            color: var(--ion-color-primary);
          }

          .page-footer p {
            margin: 6px 0 0;

            font-size: 11px;

            line-height: 1.5;
          }

          @media (min-width: 768px) {
            .change-password-container {
              padding-top: 40px;
            }
          }
        `}
      </style>
    </IonPage>
  );
}