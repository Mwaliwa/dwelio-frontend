import React, { useEffect, useState } from "react";

import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle,
  IonAvatar,
  IonText,
  IonButton,
  useIonRouter,
  useIonAlert,
} from "@ionic/react";

import {
  homeOutline,
  listOutline,
  heartOutline,
  personOutline,
  businessOutline,
  addCircleOutline,
  statsChartOutline,
  settingsOutline,
  logOutOutline,
  calendarOutline,
  chatbubbleOutline,
  personAddOutline,
  peopleOutline,
  keyOutline,
  shieldCheckmarkOutline,
  closeOutline,
  chevronForwardOutline,
} from "ionicons/icons";

/* =========================================================
   USER TYPE
========================================================= */

interface UserInfo {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
  phone?: string;
}

/* =========================================================
   MENU
========================================================= */

export default function Menu() {
  const router = useIonRouter();
  const [presentAlert] = useIonAlert();

  const [role, setRole] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);

  /* =======================================================
     LOAD USER
  ======================================================= */

  const loadUser = () => {
    try {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        const parsedUser: UserInfo = JSON.parse(storedUser);

        setUser(parsedUser);

        if (parsedUser.role) {
          setRole(parsedUser.role);
          return;
        }
      }
    } catch (error) {
      console.error("Unable to read stored user:", error);
    }

    /*
      Fallback for older login implementation
      that stores role separately.
    */
    const storedRole = localStorage.getItem("role");

    setRole(storedRole);
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadUser();

    window.addEventListener("storage", loadUser);
    window.addEventListener("roleChanged", loadUser);
    window.addEventListener("userChanged", loadUser);

    return () => {
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("roleChanged", loadUser);
      window.removeEventListener("userChanged", loadUser);
    };
  }, []);

  /* =======================================================
     REFRESH WHEN APP BECOMES VISIBLE
  ======================================================= */

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadUser();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, []);

  /* =======================================================
     NORMALIZE ROLE
  ======================================================= */

  const normalizedRole =
    role?.trim().toLowerCase() || null;

  const isLoggedIn = !!localStorage.getItem("token");

  /* =======================================================
     USER DISPLAY
  ======================================================= */

  const displayName =
    user?.name ||
    (normalizedRole === "admin"
      ? "Administrator"
      : normalizedRole === "agent"
      ? "Agent"
      : normalizedRole === "landlord"
      ? "Landlord"
      : normalizedRole === "customer"
      ? "Customer"
      : "Dwelio User");

  const displayEmail =
    user?.email || "";

  const displayRole =
    normalizedRole
      ? normalizedRole.charAt(0).toUpperCase() +
        normalizedRole.slice(1)
      : "Guest";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const navigate = (path: string) => {
    router.push(path);
  };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const logout = () => {
    presentAlert({
      header: "Log out",
      message:
        "Are you sure you want to log out of your Dwelio account?",

      buttons: [
        {
          text: "Cancel",
          role: "cancel",
        },

        {
          text: "Log out",
          role: "destructive",

          handler: () => {
            /*
              Do NOT use localStorage.clear().
              Keep theme and other application preferences.
            */

            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("role");

            setRole(null);
            setUser(null);

            window.dispatchEvent(
              new Event("roleChanged")
            );

            window.dispatchEvent(
              new Event("userChanged")
            );

            if (
              document.activeElement instanceof HTMLElement
            ) {
              document.activeElement.blur();
            }

            router.push(
              "/login",
              "root",
              "replace"
            );
          },
        },
      ],
    });
  };

  /* =======================================================
     MENU ITEM COMPONENT
  ======================================================= */

  const MenuItem = ({
    icon,
    label,
    path,
    color,
    badge,
  }: {
    icon: string;
    label: string;
    path: string;
    color?: string;
    badge?: string;
  }) => {
    return (
      <IonMenuToggle
        autoHide={false}
        key={path}
      >
        <IonItem
          button
          detail={false}
          lines="none"
          className="dwelio-menu-item"
          onClick={() => navigate(path)}
        >
          <IonIcon
            slot="start"
            icon={icon}
            color={color || "medium"}
          />

          <IonLabel>
            {label}
          </IonLabel>

          {badge && (
            <span className="menu-badge">
              {badge}
            </span>
          )}

          <IonIcon
            slot="end"
            icon={chevronForwardOutline}
            className="menu-arrow"
          />
        </IonItem>
      </IonMenuToggle>
    );
  };

  /* =======================================================
     SECTION TITLE
  ======================================================= */

  const SectionTitle = ({
    children,
  }: {
    children: React.ReactNode;
  }) => (
    <div className="menu-section-title">
      {children}
    </div>
  );

  /* =======================================================
     PUBLIC / GUEST
  ======================================================= */

  const renderGuestMenu = () => (
    <>
      <SectionTitle>
        MAIN
      </SectionTitle>

      <MenuItem
        icon={homeOutline}
        label="Home"
        path="/"
        color="primary"
      />

      <MenuItem
        icon={listOutline}
        label="Available Properties"
        path="/properties"
        color="primary"
      />

      <SectionTitle>
        ACCOUNT
      </SectionTitle>

      <MenuItem
        icon={personOutline}
        label="Login"
        path="/login"
        color="primary"
      />

      <MenuItem
        icon={personAddOutline}
        label="Create Account"
        path="/register"
        color="success"
      />
    </>
  );

  /* =======================================================
     CUSTOMER
  ======================================================= */

  const renderCustomerMenu = () => (
    <>
      <SectionTitle>
        CUSTOMER
      </SectionTitle>

      <MenuItem
        icon={statsChartOutline}
        label="Dashboard"
        path="/customer"
        color="primary"
      />

      <MenuItem
        icon={listOutline}
        label="Available Properties"
        path="/customer/properties"
        color="primary"
      />

      <MenuItem
        icon={heartOutline}
        label="Favorites"
        path="/customer/favorites"
        color="danger"
      />

      <MenuItem
        icon={chatbubbleOutline}
        label="Messages"
        path="/customer/chat"
        color="tertiary"
      />

      <MenuItem
        icon={personAddOutline}
        label="Become an Agent"
        path="/customer/become-agent"
        color="success"
      />

      <SectionTitle>
        ACCOUNT
      </SectionTitle>

      <MenuItem
        icon={personOutline}
        label="Profile"
        path="/customer/profile"
        color="primary"
      />

      <MenuItem
        icon={settingsOutline}
        label="Settings"
        path="/customer/settings"
      />
    </>
  );

  /* =======================================================
     AGENT / LANDLORD
  ======================================================= */

  const renderAgentMenu = () => (
    <>
      <SectionTitle>
        PROPERTY MANAGEMENT
      </SectionTitle>

      <MenuItem
        icon={statsChartOutline}
        label="Dashboard"
        path="/agent/dashboard"
        color="primary"
      />

      <MenuItem
        icon={businessOutline}
        label="My Properties"
        path="/agent/properties"
        color="success"
      />

      <MenuItem
        icon={addCircleOutline}
        label="Add Property"
        path="/agent/add-property"
        color="primary"
      />

      <MenuItem
        icon={calendarOutline}
        label="Bookings"
        path="/agent/bookings"
        color="warning"
      />

      <MenuItem
        icon={chatbubbleOutline}
        label="Messages"
        path="/agent/chat"
        color="tertiary"
      />

      <SectionTitle>
        ACCOUNT
      </SectionTitle>

      <MenuItem
        icon={settingsOutline}
        label="Settings"
        path="/agent/settings"
      />
    </>
  );

  /* =======================================================
     ADMIN
  ======================================================= */

  const renderAdminMenu = () => (
    <>
      <SectionTitle>
        ADMINISTRATION
      </SectionTitle>

      <MenuItem
        icon={statsChartOutline}
        label="Admin Dashboard"
        path="/admin"
        color="primary"
      />

      <MenuItem
        icon={businessOutline}
        label="Properties"
        path="/properties"
        color="success"
      />

      <MenuItem
        icon={peopleOutline}
        label="Agent Requests"
        path="/admin/agent-requests"
        color="warning"
      />

      <SectionTitle>
        SECURITY & ACCOUNT
      </SectionTitle>

      <MenuItem
        icon={keyOutline}
        label="Change Password"
        path="/admin/change-password"
        color="warning"
      />

      <MenuItem
        icon={settingsOutline}
        label="Settings"
        path="/admin/settings"
      />

      <MenuItem
        icon={shieldCheckmarkOutline}
        label="Security"
        path="/admin/security"
        color="success"
      />
    </>
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <IonMenu
      contentId="main-content"
      type="overlay"
      side="start"
      menuId="dwelio-main-menu"
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <IonHeader>
        <IonToolbar color="dark">

          <IonTitle>
            <div className="dwelio-brand">

              <div className="brand-logo">
                D
              </div>

              <div>
                <div className="brand-name">
                  DWELIO
                </div>

                <div className="brand-subtitle">
                  PROPERTY PLATFORM
                </div>
              </div>

            </div>
          </IonTitle>

          <IonMenuToggle>
            <IonButton
              fill="clear"
              color="light"
              slot="end"
            >
              <IonIcon
                slot="icon-only"
                icon={closeOutline}
              />
            </IonButton>
          </IonMenuToggle>

        </IonToolbar>
      </IonHeader>

      {/* =================================================
          CONTENT
      ================================================= */}

      <IonContent>

        {/* =================================================
            USER PROFILE
        ================================================= */}

        {isLoggedIn && (
          <div className="dwelio-profile">

            <IonAvatar className="dwelio-avatar">
              <div>
                {initials}
              </div>
            </IonAvatar>

            <div className="profile-details">

              <strong>
                {displayName}
              </strong>

              {displayEmail && (
                <IonText color="medium">
                  <span className="profile-email">
                    {displayEmail}
                  </span>
                </IonText>
              )}

              <span className="profile-role">
                {displayRole.toUpperCase()}
              </span>

            </div>

          </div>
        )}

        {/* =================================================
            MENU
        ================================================= */}

        <IonList className="dwelio-menu-list">

          {!isLoggedIn &&
            renderGuestMenu()}

          {isLoggedIn &&
            normalizedRole === "customer" &&
            renderCustomerMenu()}

          {isLoggedIn &&
            (normalizedRole === "agent" ||
              normalizedRole === "landlord") &&
            renderAgentMenu()}

          {isLoggedIn &&
            normalizedRole === "admin" &&
            renderAdminMenu()}

        </IonList>

        {/* =================================================
            LOGOUT
        ================================================= */}

        {isLoggedIn && (
          <div className="logout-wrapper">

            <IonMenuToggle autoHide={false}>
              <IonButton
                expand="block"
                fill="outline"
                color="danger"
                onClick={logout}
              >
                <IonIcon
                  slot="start"
                  icon={logOutOutline}
                />

                Log out
              </IonButton>
            </IonMenuToggle>

          </div>
        )}

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="dwelio-footer">

          <div className="footer-logo">
            D
          </div>

          <strong>
            DWELIO
          </strong>

          <p>
            Smart property management
          </p>

          <small>
            Version 1.0.0
          </small>

        </div>

      </IonContent>

      {/* =================================================
          EMBEDDED CSS
      ================================================= */}

      <style>
        {`

          /* ===============================================
             MENU
          =============================================== */

          ion-menu {
            --width: 295px;
          }

          /* ===============================================
             BRAND
          =============================================== */

          .dwelio-brand {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .brand-logo {
            width: 36px;
            height: 36px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 10px;

            background: var(--ion-color-primary);

            color: #ffffff;

            font-size: 21px;
            font-weight: 800;
          }

          .brand-name {
            font-size: 16px;
            font-weight: 800;

            letter-spacing: 1.2px;

            line-height: 1;
          }

          .brand-subtitle {
            margin-top: 4px;

            font-size: 8px;

            letter-spacing: 0.7px;

            opacity: 0.65;
          }

          /* ===============================================
             PROFILE
          =============================================== */

          .dwelio-profile {
            display: flex;
            align-items: center;

            gap: 12px;

            padding: 18px 15px;

            border-bottom: 1px solid
              var(--ion-color-light-shade);
          }

          .dwelio-avatar {
            width: 54px;
            height: 54px;

            flex-shrink: 0;

            background:
              var(--ion-color-primary);

            color: #ffffff;

            display: flex;
            align-items: center;
            justify-content: center;

            font-size: 18px;
            font-weight: 800;

            border: 2px solid
              rgba(255, 255, 255, 0.15);
          }

          .profile-details {
            min-width: 0;

            display: flex;
            flex-direction: column;
          }

          .profile-details strong {
            font-size: 14px;

            font-weight: 700;

            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .profile-email {
            display: block;

            max-width: 195px;

            margin-top: 3px;

            font-size: 11px;

            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .profile-role {
            width: fit-content;

            margin-top: 6px;

            padding: 3px 8px;

            border-radius: 5px;

            background: rgba(
              var(--ion-color-primary-rgb),
              0.12
            );

            color:
              var(--ion-color-primary);

            font-size: 9px;

            font-weight: 800;

            letter-spacing: 0.5px;
          }

          /* ===============================================
             LIST
          =============================================== */

          .dwelio-menu-list {
            padding: 8px 8px 0;

            background:
              var(--ion-background-color);
          }

          /* ===============================================
             SECTION
          =============================================== */

          .menu-section-title {
            padding: 17px 13px 7px;

            font-size: 9px;

            font-weight: 800;

            letter-spacing: 1.1px;

            color:
              var(--ion-color-medium);
          }

          /* ===============================================
             MENU ITEM
          =============================================== */

          .dwelio-menu-item {
            --background: transparent;

            --color:
              var(--ion-text-color);

            --padding-start: 12px;
            --padding-end: 8px;

            --min-height: 48px;

            margin: 3px 0;

            border-radius: 11px;

            font-size: 14px;

            transition:
              background 0.2s ease,
              transform 0.2s ease;
          }

          .dwelio-menu-item ion-icon[slot="start"] {
            width: 21px;
            height: 21px;

            margin-right: 11px;
          }

          .dwelio-menu-item:hover {
            --background:
              rgba(
                var(--ion-color-primary-rgb),
                0.08
              );

            transform:
              translateX(2px);
          }

          .menu-arrow {
            font-size: 15px;

            opacity: 0.3;
          }

          .menu-badge {
            min-width: 20px;
            height: 20px;

            display: flex;
            align-items: center;
            justify-content: center;

            margin-right: 6px;

            border-radius: 10px;

            background:
              var(--ion-color-danger);

            color: #ffffff;

            font-size: 10px;
            font-weight: 700;
          }

          /* ===============================================
             LOGOUT
          =============================================== */

          .logout-wrapper {
            padding: 14px 15px 10px;
          }

          .logout-wrapper ion-button {
            --border-radius: 11px;

            height: 46px;

            font-weight: 700;

            text-transform: none;
          }

          /* ===============================================
             FOOTER
          =============================================== */

          .dwelio-footer {
            text-align: center;

            padding: 20px 15px 28px;

            border-top: 1px solid
              var(--ion-color-light-shade);

            color:
              var(--ion-color-medium);
          }

          .footer-logo {
            width: 30px;
            height: 30px;

            display: flex;
            align-items: center;
            justify-content: center;

            margin: 0 auto 6px;

            border-radius: 8px;

            background:
              var(--ion-color-primary);

            color: #ffffff;

            font-size: 15px;
            font-weight: 800;
          }

          .dwelio-footer strong {
            font-size: 11px;

            letter-spacing: 1px;

            color:
              var(--ion-text-color);
          }

          .dwelio-footer p {
            margin: 4px 0;

            font-size: 10px;
          }

          .dwelio-footer small {
            font-size: 9px;

            opacity: 0.65;
          }

        `}
      </style>

    </IonMenu>
  );
}