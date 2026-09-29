import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonToggle,
  IonButton,
  IonAlert,
  IonNote,
  IonCard,
  IonCardContent,
  IonToast,
  useIonRouter,
  useIonAlert,
  useIonToast,
} from "@ionic/react";

import {
  personOutline,
  lockClosedOutline,
  notificationsOutline,
  heartOutline,
  starOutline,
  chevronForwardOutline,
  logOutOutline,
  informationCircleOutline,
  shieldCheckmarkOutline,
  moonOutline,
  trashOutline,
} from "ionicons/icons";

import { useEffect, useState } from "react";

/* =========================================================
   CONFIGURATION
========================================================= */

const API_URL = "http://localhost:5001";

/* =========================================================
   TYPES
========================================================= */

interface UserData {
  name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  phone_number?: string;
  avatar?: string;
  profile_image?: string;
}

/* =========================================================
   SETTINGS PAGE
========================================================= */

const Settings: React.FC = () => {
  const router = useIonRouter();

  const [presentAlert] = useIonAlert();
  const [presentToast] = useIonToast();

  const [user, setUser] = useState<UserData>({});

  const [notificationsEnabled, setNotificationsEnabled] =
    useState<boolean>(true);

  const [darkMode, setDarkMode] = useState<boolean>(false);

  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const [deletingAccount, setDeletingAccount] = useState(false);

  /* =========================================================
     LOAD SETTINGS
  ========================================================= */

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      /* ---------- User ---------- */

      const userString = localStorage.getItem("user");

      if (userString) {
        const parsedUser = JSON.parse(userString);
        setUser(parsedUser);
      } else {
        setUser({
          name: localStorage.getItem("name") || "",
          email: localStorage.getItem("email") || "",
          phone: localStorage.getItem("phone") || "",
          avatar: localStorage.getItem("avatar") || "",
        });
      }

      /* ---------- Notifications ---------- */

      const savedNotifications =
        localStorage.getItem("notificationsEnabled");

      if (savedNotifications !== null) {
        setNotificationsEnabled(savedNotifications === "true");
      }

      /* ---------- Dark mode ---------- */

      const savedDarkMode = localStorage.getItem("darkMode");

      if (savedDarkMode !== null) {
        const enabled = savedDarkMode === "true";

        setDarkMode(enabled);

        applyDarkMode(enabled);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  /* =========================================================
     DARK MODE
  ========================================================= */

  const applyDarkMode = (enabled: boolean) => {
    document.body.classList.toggle("dark", enabled);
  };

  const handleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);

    localStorage.setItem("darkMode", String(enabled));

    applyDarkMode(enabled);

    presentToast({
      message: enabled
        ? "Dark mode enabled"
        : "Dark mode disabled",
      duration: 1500,
      color: "medium",
    });
  };

  /* =========================================================
     NOTIFICATIONS
  ========================================================= */

  const handleNotifications = (enabled: boolean) => {
    setNotificationsEnabled(enabled);

    localStorage.setItem(
      "notificationsEnabled",
      String(enabled)
    );

    presentToast({
      message: enabled
        ? "Notifications enabled"
        : "Notifications disabled",
      duration: 1500,
      color: "medium",
    });
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    presentAlert({
      header: "Log out",
      message: "Are you sure you want to log out of your account?",

      buttons: [
        {
          text: "Cancel",
          role: "cancel",
        },

        {
          text: "Log out",
          role: "destructive",

          handler: () => {
            performLogout();
          },
        },
      ],
    });
  };

  const performLogout = () => {
    /*
     * Clear authentication data.
     */

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    localStorage.removeItem("name");
    localStorage.removeItem("email");
    localStorage.removeItem("phone");
    localStorage.removeItem("avatar");

    presentToast({
      message: "Logged out successfully",
      duration: 1500,
      color: "medium",
    });

    /*
     * Navigate to login and clear navigation history.
     */

    setTimeout(() => {
      router.push("/login", "root", "replace");
    }, 300);
  };

  /* =========================================================
     DELETE ACCOUNT
  ========================================================= */

  const confirmDeleteAccount = () => {
    setShowDeleteAlert(true);
  };

  const deleteAccount = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      performLogout();
      return;
    }

    try {
      setDeletingAccount(true);

      const response = await fetch(
        `${API_URL}/api/users/account`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to delete account"
        );
      }

      /*
       * Clear local authentication.
       */

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      localStorage.removeItem("name");
      localStorage.removeItem("email");
      localStorage.removeItem("phone");
      localStorage.removeItem("avatar");

      presentToast({
        message: "Your account has been deleted",
        duration: 2000,
        color: "success",
      });

      setTimeout(() => {
        router.push("/login", "root", "replace");
      }, 500);
    } catch (error: any) {
      console.error("DELETE ACCOUNT ERROR:", error);

      presentToast({
        message:
          error?.message ||
          "Unable to delete your account",
        duration: 3000,
        color: "danger",
      });
    } finally {
      setDeletingAccount(false);
      setShowDeleteAlert(false);
    }
  };

  /* =========================================================
     USER DISPLAY
  ========================================================= */

  const displayName =
    user.name ||
    user.full_name ||
    "Customer";

  const displayEmail =
    user.email ||
    "No email available";

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <IonPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton
              defaultHref="/customer/profile"
            />
          </IonButtons>

          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <IonContent className="ion-padding">

        {/* ===================================================
            ACCOUNT HEADER
        =================================================== */}

        <IonCard
          style={{
            margin: "0 0 18px 0",
            borderRadius: "16px",
            boxShadow:
              "0 4px 16px rgba(0,0,0,0.06)",
          }}
        >
          <IonCardContent>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "var(--ion-color-primary)",
                  color: "#fff",
                  fontSize: "22px",
                  fontWeight: 700,
                }}
              >
                {displayName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div style={{ flex: 1 }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: 650,
                  }}
                >
                  {displayName}
                </h2>

                <IonNote>
                  {displayEmail}
                </IonNote>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* ===================================================
            ACCOUNT
        =================================================== */}

        <IonList
          inset
          style={{
            borderRadius: "14px",
            overflow: "hidden",
          }}
        >
          <IonItem
            button
            detail={false}
            routerLink="/customer/profile/edit"
          >
            <IonIcon
              icon={personOutline}
              slot="start"
              color="primary"
            />

            <IonLabel>
              <h3>Edit Profile</h3>
              <p>
                Update your name, email and phone
              </p>
            </IonLabel>

            <IonIcon
              icon={chevronForwardOutline}
              slot="end"
              color="medium"
            />
          </IonItem>

          <IonItem
            button
            detail={false}
            routerLink="/customer/change-password"
          >
            <IonIcon
              icon={lockClosedOutline}
              slot="start"
              color="primary"
            />

            <IonLabel>
              <h3>Change Password</h3>
              <p>
                Update your account password
              </p>
            </IonLabel>

            <IonIcon
              icon={chevronForwardOutline}
              slot="end"
              color="medium"
            />
          </IonItem>
        </IonList>

        {/* ===================================================
            PREFERENCES
        =================================================== */}

        <IonList
          inset
          style={{
            marginTop: "16px",
            borderRadius: "14px",
            overflow: "hidden",
          }}
        >
          <IonItem>
            <IonIcon
              icon={notificationsOutline}
              slot="start"
              color="primary"
            />

            <IonLabel>
              <h3>Notifications</h3>
              <p>
                Receive property and account updates
              </p>
            </IonLabel>

            <IonToggle
              checked={notificationsEnabled}
              onIonChange={(event) =>
                handleNotifications(
                  event.detail.checked
                )
              }
            />
          </IonItem>

          <IonItem>
            <IonIcon
              icon={moonOutline}
              slot="start"
              color="medium"
            />

            <IonLabel>
              <h3>Dark Mode</h3>
              <p>
                Use a darker appearance
              </p>
            </IonLabel>

            <IonToggle
              checked={darkMode}
              onIonChange={(event) =>
                handleDarkMode(
                  event.detail.checked
                )
              }
            />
          </IonItem>
        </IonList>

        {/* ===================================================
            CUSTOMER ACTIVITY
        =================================================== */}

        <IonList
          inset
          style={{
            marginTop: "16px",
            borderRadius: "14px",
            overflow: "hidden",
          }}
        >
          <IonItem
            button
            detail={false}
            routerLink="/customer/favorites"
          >
            <IonIcon
              icon={heartOutline}
              slot="start"
              color="danger"
            />

            <IonLabel>
              <h3>My Favorites</h3>
              <p>
                View properties you saved
              </p>
            </IonLabel>

            <IonIcon
              icon={chevronForwardOutline}
              slot="end"
              color="medium"
            />
          </IonItem>

          <IonItem
            button
            detail={false}
            routerLink="/customer/reviews"
          >
            <IonIcon
              icon={starOutline}
              slot="start"
              color="warning"
            />

            <IonLabel>
              <h3>My Reviews</h3>
              <p>
                View reviews you have submitted
              </p>
            </IonLabel>

            <IonIcon
              icon={chevronForwardOutline}
              slot="end"
              color="medium"
            />
          </IonItem>
        </IonList>

        {/* ===================================================
            SECURITY
        =================================================== */}

        <IonList
          inset
          style={{
            marginTop: "16px",
            borderRadius: "14px",
            overflow: "hidden",
          }}
        >
          <IonItem>
            <IonIcon
              icon={shieldCheckmarkOutline}
              slot="start"
              color="success"
            />

            <IonLabel>
              <h3>Account Security</h3>
              <p>
                Your account is protected
              </p>
            </IonLabel>
          </IonItem>

          <IonItem
            button
            detail={false}
            onClick={() =>
              presentToast({
                message:
                  "Your account information is securely stored.",
                duration: 1800,
                color: "medium",
              })
            }
          >
            <IonIcon
              icon={informationCircleOutline}
              slot="start"
              color="medium"
            />

            <IonLabel>
              <h3>Privacy & Security</h3>
              <p>
                Learn about your account security
              </p>
            </IonLabel>

            <IonIcon
              icon={chevronForwardOutline}
              slot="end"
              color="medium"
            />
          </IonItem>
        </IonList>

        {/* ===================================================
            LOGOUT
        =================================================== */}

        <div
          style={{
            marginTop: "28px",
            padding: "0 4px",
          }}
        >
          <IonButton
            expand="block"
            color="danger"
            fill="outline"
            onClick={handleLogout}
            style={{
              height: "48px",
              "--border-radius": "12px",
            }}
          >
            <IonIcon
              icon={logOutOutline}
              slot="start"
            />

            Log Out
          </IonButton>
        </div>

        {/* ===================================================
            DELETE ACCOUNT
        =================================================== */}

        <div
          style={{
            marginTop: "18px",
            textAlign: "center",
          }}
        >
          <IonButton
            fill="clear"
            color="danger"
            size="small"
            onClick={confirmDeleteAccount}
            disabled={deletingAccount}
          >
            <IonIcon
              icon={trashOutline}
              slot="start"
            />

            Delete Account
          </IonButton>
        </div>

        {/* ===================================================
            VERSION
        =================================================== */}

        <p
          className="ion-text-center"
          style={{
            marginTop: "28px",
            marginBottom: "20px",
            fontSize: "12px",
            color:
              "var(--ion-color-medium)",
          }}
        >
          Customer App
          <br />
          Version 1.0.0
        </p>

        {/* ===================================================
            DELETE CONFIRMATION
        =================================================== */}

        <IonAlert
          isOpen={showDeleteAlert}
          header="Delete Account?"
          message={
            "This action permanently deletes your account and cannot be undone."
          }
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
              handler: () =>
                setShowDeleteAlert(false),
            },
            {
              text: deletingAccount
                ? "Deleting..."
                : "Delete Account",
              role: "destructive",
              handler: () => {
                if (!deletingAccount) {
                  deleteAccount();
                }
              },
            },
          ]}
          onDidDismiss={() =>
            setShowDeleteAlert(false)
          }
        />
      </IonContent>
    </IonPage>
  );
};

export default Settings;