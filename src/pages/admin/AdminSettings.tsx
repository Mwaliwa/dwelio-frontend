import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonNote,
  IonToggle,
  IonAvatar,
  IonText,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonInput,
  useIonToast,
  useIonAlert,
  useIonRouter,
} from "@ionic/react";

import {
  personOutline,
  mailOutline,
  shieldCheckmarkOutline,
  logOutOutline,
  moonOutline,
  notificationsOutline,
  keyOutline,
  informationCircleOutline,
  chevronForwardOutline,
  callOutline,
  lockClosedOutline,
  settingsOutline,
  checkmarkCircleOutline,
  saveOutline,
  closeOutline,
} from "ionicons/icons";

/* =========================================================
   TYPES
========================================================= */

interface UserInfo {
  id?: number | string;
  name?: string;
  email?: string;
  role?: string;
  phone?: string;
  created_at?: string;
  avatar?: string;
}

type ThemePreference = "dark" | "light";

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/* =========================================================
   CONSTANTS
========================================================= */

const APP_VERSION = "1.0.0";
const API_BASE = "http://localhost:5001/api";

const STORAGE_KEYS = {
  USER: "user",
  TOKEN: "token",
  THEME: "theme",
  NOTIFICATIONS: "notifications",
} as const;

/* =========================================================
   HELPERS
========================================================= */

function safeParseUser(raw: string | null): UserInfo | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as UserInfo;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
  return null;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "AU";
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

/* =========================================================
   COMPONENT
========================================================= */

export default function AdminSettings() {
  const router = useIonRouter();
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const [form, setForm] = useState<ProfileForm>({
    name: "",
    email: "",
    phone: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof ProfileForm, string>>
  >({});

  // Change password
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<
    Partial<Record<keyof PasswordForm, string>>
  >({});

  /* ---------- LOAD SETTINGS ---------- */

  useEffect(() => {
    let mounted = true;

    const load = () => {
      try {
        const parsedUser = safeParseUser(
          localStorage.getItem(STORAGE_KEYS.USER)
        );

        if (mounted) {
          setUser(parsedUser);
          setForm({
            name: parsedUser?.name?.trim() || "",
            email: parsedUser?.email?.trim() || "",
            phone: parsedUser?.phone?.trim() || "",
          });
        }

        const savedTheme = localStorage.getItem(
          STORAGE_KEYS.THEME
        ) as ThemePreference | null;
        const prefersDark =
          window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;

        let initialDark = false;
        if (savedTheme === "dark") initialDark = true;
        else if (savedTheme === "light") initialDark = false;
        else initialDark = prefersDark;

        if (mounted) {
          setDarkMode(initialDark);
          document.body.classList.toggle("dark", initialDark);
        }

        const savedNotif = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
        if (savedNotif !== null && mounted) {
          setNotifications(savedNotif === "true");
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  /* ---------- SYSTEM THEME LISTENER ---------- */

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(STORAGE_KEYS.THEME)) {
        setDarkMode(e.matches);
        document.body.classList.toggle("dark", e.matches);
      }
    };
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  /* ---------- PROFILE FORM ---------- */

  const updateForm = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ProfileForm, string>> = {};
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();

    if (!name) errors.name = "Name is required.";
    else if (name.length < 2)
      errors.name = "Name must be at least 2 characters.";

    if (!email) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Enter a valid email address.";
    }

    if (phone && phone.length < 7) {
      errors.phone = "Enter a valid phone number.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const startEditing = () => {
    setForm({
      name: user?.name?.trim() || "",
      email: user?.email?.trim() || "",
      phone: user?.phone?.trim() || "",
    });
    setFormErrors({});
    setIsEditing(true);
    setShowPasswordForm(false);
  };

  const cancelEditing = () => {
    setForm({
      name: user?.name?.trim() || "",
      email: user?.email?.trim() || "",
      phone: user?.phone?.trim() || "",
    });
    setFormErrors({});
    setIsEditing(false);
  };

  const saveProfile = async () => {
    if (!validateForm()) {
      presentToast({
        message: "Please correct the highlighted fields.",
        duration: 2200,
        color: "warning",
        position: "top",
      });
      return;
    }

    const token = getToken();
    if (!token) {
      presentToast({
        message: "Session expired. Please log in again.",
        duration: 2500,
        color: "danger",
        position: "top",
      });
      router.push("/login", "root", "replace");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
      };

      const response = await fetch(`${API_BASE}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const raw = await response.text();
      let data: any = {};
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          throw new Error(`Invalid server response (${response.status})`);
        }
      }

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        router.push("/login", "root", "replace");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Failed to update profile (${response.status})`
        );
      }

      const serverUser = data.user || data.data?.user || {};
      const updatedUser: UserInfo = {
        ...user,
        ...serverUser,
        name: serverUser.name || payload.name,
        email: serverUser.email || payload.email,
        phone: serverUser.phone ?? payload.phone ?? undefined,
      };

      setUser(updatedUser);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      setIsEditing(false);

      presentToast({
        message: data.message || "Profile updated successfully.",
        duration: 2000,
        color: "success",
        position: "top",
      });
    } catch (err: any) {
      console.error("Save profile error:", err);
      presentToast({
        message: err?.message || "Unable to save changes.",
        duration: 2800,
        color: "danger",
        position: "top",
      });
    } finally {
      setSaving(false);
    }
  };

  /* ---------- CHANGE PASSWORD ---------- */

  const updatePasswordForm = (
    field: keyof PasswordForm,
    value: string
  ) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    if (passwordErrors[field]) {
      setPasswordErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validatePasswordForm = (): boolean => {
    const errors: Partial<Record<keyof PasswordForm, string>> = {};
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword) {
      errors.currentPassword = "Current password is required.";
    }
    if (!newPassword) {
      errors.newPassword = "New password is required.";
    } else if (newPassword.length < 6) {
      errors.newPassword = "New password must be at least 6 characters.";
    }
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your new password.";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    if (currentPassword && newPassword && currentPassword === newPassword) {
      errors.newPassword =
        "New password must be different from current password.";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePasswordSubmit = async () => {
    if (!validatePasswordForm()) {
      presentToast({
        message: "Please correct the password fields.",
        duration: 2200,
        color: "warning",
        position: "top",
      });
      return;
    }

    const token = getToken();
    if (!token) {
      presentToast({
        message: "Session expired. Please log in again.",
        duration: 2500,
        color: "danger",
        position: "top",
      });
      router.push("/login", "root", "replace");
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch(`${API_BASE}/users/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const raw = await response.text();
      let data: any = {};
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          throw new Error(`Invalid server response (${response.status})`);
        }
      }

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        router.push("/login", "root", "replace");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Failed to change password (${response.status})`
        );
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({});
      setShowPasswordForm(false);

      presentToast({
        message: data.message || "Password changed successfully.",
        duration: 2200,
        color: "success",
        position: "top",
      });
    } catch (err: any) {
      console.error("Change password error:", err);
      presentToast({
        message: err?.message || "Unable to change password.",
        duration: 2800,
        color: "danger",
        position: "top",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  /* ---------- TOGGLES ---------- */

  const toggleDarkMode = useCallback(
    (checked: boolean) => {
      setDarkMode(checked);
      document.body.classList.toggle("dark", checked);
      localStorage.setItem(
        STORAGE_KEYS.THEME,
        checked ? "dark" : "light"
      );
      presentToast({
        message: checked ? "Dark mode enabled" : "Light mode enabled",
        duration: 1500,
        position: "top",
        color: "medium",
      });
    },
    [presentToast]
  );

  const toggleNotifications = useCallback(
    (checked: boolean) => {
      setNotifications(checked);
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, String(checked));
      presentToast({
        message: checked
          ? "Notifications enabled"
          : "Notifications disabled",
        duration: 1600,
        position: "top",
        color: "medium",
      });
    },
    [presentToast]
  );

  /* ---------- OTHER ACTIONS ---------- */

  const handleAbout = useCallback(() => {
    presentAlert({
      header: "About the Admin Panel",
      message:
        "DWELIO Admin Panel\n\n" +
        `Version ${APP_VERSION}\n\n` +
        "Manage your properties, users, bookings and application settings from one secure administration panel.",
      buttons: [{ text: "Close", role: "cancel" }],
    });
  }, [presentAlert]);

  const handleLogout = useCallback(() => {
    presentAlert({
      header: "Log out?",
      message:
        "You will need to sign in again to access the administration panel.",
      buttons: [
        { text: "Cancel", role: "cancel" },
        {
          text: "Log out",
          role: "destructive",
          handler: async () => {
            if (loggingOut) return;
            try {
              setLoggingOut(true);
              localStorage.removeItem(STORAGE_KEYS.TOKEN);
              localStorage.removeItem(STORAGE_KEYS.USER);

              if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
              }

              setTimeout(() => {
                try {
                  router.push("/login", "root", "replace");
                } catch {
                  window.location.replace("/login");
                }
              }, 120);
            } catch {
              setLoggingOut(false);
              presentToast({
                message: "Unable to complete logout. Please try again.",
                duration: 2500,
                position: "top",
                color: "danger",
              });
            }
          },
        },
      ],
    });
  }, [loggingOut, presentAlert, presentToast, router]);

  /* ---------- DERIVED ---------- */

  const displayName = useMemo(
    () => user?.name?.trim() || "Admin User",
    [user]
  );
  const displayEmail = useMemo(
    () => user?.email?.trim() || "No email available",
    [user]
  );
  const displayRole = useMemo(() => {
    if (!user?.role) return "Administrator";
    return (
      user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
    );
  }, [user]);
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  /* ---------- LOADING ---------- */

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="dark">
            <IonButtons slot="start">
              <IonBackButton defaultHref="/admin" />
            </IonButtons>
            <IonTitle>Settings</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={styles.loadingContainer}>
            <IonSpinner name="crescent" />
            <IonText color="medium">
              <p style={{ marginTop: 12 }}>Loading settings...</p>
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  /* ---------- MAIN UI ---------- */

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar color="dark">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/admin" />
          </IonButtons>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="admin-settings-page">
        <div style={styles.pageContainer}>
          {/* Intro */}
          <div style={styles.pageIntro}>
            <div style={styles.pageIntroIcon}>
              <IonIcon
                icon={settingsOutline}
                style={{
                  fontSize: 24,
                  color: "var(--ion-color-primary)",
                }}
              />
            </div>
            <div>
              <h1 style={styles.pageTitle}>Settings</h1>
              <p style={styles.pageSubtitle}>
                Manage your account and application preferences.
              </p>
            </div>
          </div>

          {/* Profile card */}
          <div style={styles.profileCard}>
            <div style={styles.profileGlow} />
            <div style={styles.profileContent}>
              <IonAvatar style={styles.avatar}>
                <span>{initials}</span>
              </IonAvatar>
              <div style={styles.profileInfo}>
                <h2 style={styles.profileName}>{displayName}</h2>
                <div style={styles.profileEmail}>
                  <IonIcon icon={mailOutline} />
                  <span>{displayEmail}</span>
                </div>
                <div style={styles.roleBadge}>
                  <IonIcon icon={shieldCheckmarkOutline} />
                  <span>{displayRole}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ACCOUNT */}
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Account</h2>
            <span style={styles.sectionDescription}>
              {isEditing ? "Editing your details" : "Your account information"}
            </span>
          </div>

          <IonList inset style={styles.list}>
            <IonItem lines="none">
              <div slot="start" style={styles.itemIcon}>
                <IonIcon icon={personOutline} />
              </div>
              <IonLabel position="stacked">
                <p style={styles.itemLabel}>Full name</p>
              </IonLabel>
              {isEditing ? (
                <IonInput
                  value={form.name}
                  placeholder="Enter your full name"
                  onIonInput={(e) =>
                    updateForm("name", e.detail.value || "")
                  }
                  style={{ marginTop: 4 }}
                />
              ) : (
                <h3 style={styles.itemValue}>{displayName}</h3>
              )}
            </IonItem>
            {isEditing && formErrors.name && (
              <IonText color="danger">
                <small style={styles.errorText}>{formErrors.name}</small>
              </IonText>
            )}

            <IonItem lines="none">
              <div slot="start" style={styles.itemIcon}>
                <IonIcon icon={mailOutline} />
              </div>
              <IonLabel position="stacked">
                <p style={styles.itemLabel}>Email address</p>
              </IonLabel>
              {isEditing ? (
                <IonInput
                  type="email"
                  value={form.email}
                  placeholder="Enter your email"
                  onIonInput={(e) =>
                    updateForm("email", e.detail.value || "")
                  }
                  style={{ marginTop: 4 }}
                />
              ) : (
                <h3 style={styles.itemValue}>{displayEmail}</h3>
              )}
            </IonItem>
            {isEditing && formErrors.email && (
              <IonText color="danger">
                <small style={styles.errorText}>{formErrors.email}</small>
              </IonText>
            )}

            <IonItem lines="none">
              <div slot="start" style={styles.itemIcon}>
                <IonIcon icon={callOutline} />
              </div>
              <IonLabel position="stacked">
                <p style={styles.itemLabel}>Phone number</p>
              </IonLabel>
              {isEditing ? (
                <IonInput
                  type="tel"
                  value={form.phone}
                  placeholder="Enter your phone number"
                  onIonInput={(e) =>
                    updateForm("phone", e.detail.value || "")
                  }
                  style={{ marginTop: 4 }}
                />
              ) : (
                <h3 style={styles.itemValue}>
                  {user?.phone?.trim() || "No phone number"}
                </h3>
              )}
            </IonItem>
            {isEditing && formErrors.phone && (
              <IonText color="danger">
                <small style={styles.errorText}>{formErrors.phone}</small>
              </IonText>
            )}

            <IonItem lines="none">
              <div slot="start" style={styles.itemIcon}>
                <IonIcon icon={shieldCheckmarkOutline} />
              </div>
              <IonLabel>
                <p style={styles.itemLabel}>Account role</p>
                <h3 style={styles.itemValue}>{displayRole}</h3>
              </IonLabel>
              <IonNote slot="end" color="success">
                <IonIcon
                  icon={checkmarkCircleOutline}
                  style={{ verticalAlign: "middle", marginRight: 4 }}
                />
                Active
              </IonNote>
            </IonItem>
          </IonList>

          <div style={styles.editActions}>
            {!isEditing ? (
              <IonButton
                expand="block"
                fill="outline"
                onClick={startEditing}
                style={{ margin: 0 }}
              >
                Edit Profile
              </IonButton>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <IonButton
                  expand="block"
                  fill="outline"
                  color="medium"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  <IonIcon slot="start" icon={closeOutline} />
                  Cancel
                </IonButton>
                <IonButton
                  expand="block"
                  onClick={saveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <IonSpinner
                        name="crescent"
                        style={{ marginRight: 8 }}
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <IonIcon slot="start" icon={saveOutline} />
                      Save
                    </>
                  )}
                </IonButton>
              </div>
            )}
          </div>

          {/* PREFERENCES */}
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Preferences</h2>
            <span style={styles.sectionDescription}>
              Customize your experience
            </span>
          </div>

          <IonList inset style={styles.list}>
            <IonItem>
              <div slot="start" style={styles.itemIcon}>
                <IonIcon icon={moonOutline} />
              </div>
              <IonLabel>
                <h3 style={styles.preferenceTitle}>Dark mode</h3>
                <p style={styles.preferenceDescription}>
                  Use a darker appearance throughout the app
                </p>
              </IonLabel>
              <IonToggle
                slot="end"
                checked={darkMode}
                onIonChange={(e) => toggleDarkMode(e.detail.checked)}
              />
            </IonItem>

            <IonItem>
              <div slot="start" style={styles.itemIcon}>
                <IonIcon icon={notificationsOutline} />
              </div>
              <IonLabel>
                <h3 style={styles.preferenceTitle}>Notifications</h3>
                <p style={styles.preferenceDescription}>
                  Receive notifications about important activity
                </p>
              </IonLabel>
              <IonToggle
                slot="end"
                checked={notifications}
                onIonChange={(e) =>
                  toggleNotifications(e.detail.checked)
                }
              />
            </IonItem>
          </IonList>

          {/* SECURITY */}
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Security</h2>
            <span style={styles.sectionDescription}>
              Protect your administrator account
            </span>
          </div>

          <IonList inset style={styles.list}>
            <IonItem
              button
              detail={false}
              onClick={() => {
                setShowPasswordForm((v) => !v);
                setIsEditing(false);
                setPasswordErrors({});
              }}
            >
              <div slot="start" style={styles.itemIcon}>
                <IonIcon icon={keyOutline} />
              </div>
              <IonLabel>
                <h3 style={styles.preferenceTitle}>Change password</h3>
                <p style={styles.preferenceDescription}>
                  Update your account password
                </p>
              </IonLabel>
              <IonIcon
                slot="end"
                icon={chevronForwardOutline}
                color="medium"
              />
            </IonItem>

            {showPasswordForm && (
              <>
                <IonItem lines="none">
                  <IonLabel position="stacked">Current password</IonLabel>
                  <IonInput
                    type="password"
                    value={passwordForm.currentPassword}
                    placeholder="Enter current password"
                    onIonInput={(e) =>
                      updatePasswordForm(
                        "currentPassword",
                        e.detail.value || ""
                      )
                    }
                  />
                </IonItem>
                {passwordErrors.currentPassword && (
                  <IonText color="danger">
                    <small style={styles.errorText}>
                      {passwordErrors.currentPassword}
                    </small>
                  </IonText>
                )}

                <IonItem lines="none">
                  <IonLabel position="stacked">New password</IonLabel>
                  <IonInput
                    type="password"
                    value={passwordForm.newPassword}
                    placeholder="At least 6 characters"
                    onIonInput={(e) =>
                      updatePasswordForm(
                        "newPassword",
                        e.detail.value || ""
                      )
                    }
                  />
                </IonItem>
                {passwordErrors.newPassword && (
                  <IonText color="danger">
                    <small style={styles.errorText}>
                      {passwordErrors.newPassword}
                    </small>
                  </IonText>
                )}

                <IonItem lines="none">
                  <IonLabel position="stacked">Confirm new password</IonLabel>
                  <IonInput
                    type="password"
                    value={passwordForm.confirmPassword}
                    placeholder="Repeat new password"
                    onIonInput={(e) =>
                      updatePasswordForm(
                        "confirmPassword",
                        e.detail.value || ""
                      )
                    }
                  />
                </IonItem>
                {passwordErrors.confirmPassword && (
                  <IonText color="danger">
                    <small style={styles.errorText}>
                      {passwordErrors.confirmPassword}
                    </small>
                  </IonText>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    padding: "12px 14px 16px",
                  }}
                >
                  <IonButton
                    expand="block"
                    fill="outline"
                    color="medium"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordForm({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                      setPasswordErrors({});
                    }}
                    disabled={changingPassword}
                  >
                    Cancel
                  </IonButton>
                  <IonButton
                    expand="block"
                    onClick={handleChangePasswordSubmit}
                    disabled={changingPassword}
                  >
                    {changingPassword ? (
                      <>
                        <IonSpinner
                          name="crescent"
                          style={{ marginRight: 8 }}
                        />
                        Saving...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </IonButton>
                </div>
              </>
            )}

            <IonItem lines="none">
              <div slot="start" style={styles.itemIcon}>
                <IonIcon icon={lockClosedOutline} />
              </div>
              <IonLabel>
                <h3 style={styles.preferenceTitle}>Account security</h3>
                <p style={styles.preferenceDescription}>
                  Your administrator account requires authentication
                </p>
              </IonLabel>
              <IonNote slot="end" color="success">
                Secure
              </IonNote>
            </IonItem>
          </IonList>

          {/* APPLICATION */}
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Application</h2>
            <span style={styles.sectionDescription}>
              Application information
            </span>
          </div>

          <IonList inset style={styles.list}>
            <IonItem button detail={false} onClick={handleAbout}>
              <div slot="start" style={styles.itemIcon}>
                <IonIcon icon={informationCircleOutline} />
              </div>
              <IonLabel>
                <h3 style={styles.preferenceTitle}>About</h3>
                <p style={styles.preferenceDescription}>
                  Information about this application
                </p>
              </IonLabel>
              <IonNote slot="end">v{APP_VERSION}</IonNote>
            </IonItem>
          </IonList>

          {/* Logout */}
          <div style={styles.logoutContainer}>
            <IonButton
              expand="block"
              color="danger"
              fill="outline"
              size="large"
              onClick={handleLogout}
              disabled={loggingOut || saving || changingPassword}
              style={styles.logoutButton}
            >
              {loggingOut ? (
                <>
                  <IonSpinner slot="start" name="crescent" />
                  Signing out...
                </>
              ) : (
                <>
                  <IonIcon slot="start" icon={logOutOutline} />
                  Log out
                </>
              )}
            </IonButton>
          </div>

          <div style={styles.footer}>
            <p style={styles.footerText}>Signed in as</p>
            <p style={styles.footerEmail}>{displayEmail}</p>
            <p style={styles.versionText}>
              DWELIO Admin Panel · v{APP_VERSION}
            </p>
          </div>
        </div>
      </IonContent>

      <style>
        {`
          .admin-settings-page {
            --background: var(--ion-background-color);
          }
          .admin-settings-page ion-list {
            --background: transparent;
          }
          .admin-settings-page ion-item {
            --padding-start: 14px;
            --padding-end: 14px;
            --inner-padding-end: 4px;
            --min-height: 70px;
          }
          .dark .admin-settings-page {
            --background: #101114;
          }
          .dark .admin-settings-page ion-list {
            --background: #18191d;
          }
        `}
      </style>
    </IonPage>
  );
}

/* =========================================================
   STYLES – Fixed TypeScript typing for CSS custom properties
========================================================= */

const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    width: "100%",
    maxWidth: 900,
    margin: "0 auto",
    padding: "20px 16px 40px",
    boxSizing: "border-box",
  },
  loadingContainer: {
    minHeight: "70vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  pageIntro: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 22,
  },
  pageIntroIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "color-mix(in srgb, var(--ion-color-primary) 12%, transparent)",
    flexShrink: 0,
  },
  pageTitle: {
    margin: 0,
    fontSize: 26,
    fontWeight: 750,
    lineHeight: 1.2,
    color: "var(--ion-text-color)",
  },
  pageSubtitle: {
    margin: "5px 0 0",
    fontSize: 14,
    lineHeight: 1.4,
    color: "var(--ion-color-medium)",
  },
  profileCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 22,
    padding: 20,
    marginBottom: 30,
    background:
      "linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-primary-shade))",
    color: "#ffffff",
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.12)",
  },
  profileGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: "50%",
    right: -70,
    top: -70,
    background: "rgba(255,255,255,0.12)",
  },
  profileContent: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    gap: 18,
  },
  avatar: {
    width: 72,
    height: 72,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.2)",
    border: "2px solid rgba(255,255,255,0.45)",
    color: "#ffffff",
    fontSize: 23,
    fontWeight: 750,
  },
  profileInfo: {
    minWidth: 0,
    flex: 1,
  },
  profileName: {
    margin: "0 0 6px",
    fontSize: 21,
    fontWeight: 700,
    color: "#ffffff",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  profileEmail: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    opacity: 0.9,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  roleBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    marginTop: 9,
    padding: "5px 9px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.17)",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
    padding: "0 4px 9px",
    marginTop: 22,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 700,
    color: "var(--ion-text-color)",
  },
  sectionDescription: {
    fontSize: 11,
    color: "var(--ion-color-medium)",
    textAlign: "right",
  },
  list: {
    margin: "0 0 12px",
    borderRadius: 17,
    overflow: "hidden",
    background: "var(--ion-item-background)",
    boxShadow: "0 4px 18px rgba(0, 0, 0, 0.05)",
  },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "color-mix(in srgb, var(--ion-color-primary) 10%, transparent)",
    color: "var(--ion-color-primary)",
    fontSize: 19,
    flexShrink: 0,
    marginRight: 4,
  },
  itemLabel: {
    margin: 0,
    fontSize: 11,
    color: "var(--ion-color-medium)",
  },
  itemValue: {
    margin: "4px 0 0",
    fontSize: 14,
    fontWeight: 600,
    color: "var(--ion-text-color)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  preferenceTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: "var(--ion-text-color)",
  },
  preferenceDescription: {
    margin: "4px 0 0",
    fontSize: 11.5,
    lineHeight: 1.35,
    color: "var(--ion-color-medium)",
  },
  editActions: {
    marginBottom: 20,
  },
  errorText: {
    display: "block",
    margin: "0 0 10px 16px",
    fontSize: 12,
  },
  logoutContainer: {
    marginTop: 28,
  },
  // FIXED: CSS custom property is now properly typed
  logoutButton: {
    "--border-radius": "14px",
    margin: 0,
    fontWeight: 700,
    textTransform: "none",
  } as React.CSSProperties,
  footer: {
    textAlign: "center",
    padding: "22px 10px 0",
  },
  footerText: {
    margin: 0,
    fontSize: 11,
    color: "var(--ion-color-medium)",
  },
  footerEmail: {
    margin: "4px 0 8px",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--ion-text-color)",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  versionText: {
    margin: 0,
    fontSize: 10,
    color: "var(--ion-color-medium)",
  },
};