import React from "react";
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
} from "@ionic/react";
import {
  homeOutline,
  searchOutline,
  heartOutline,
  chatbubblesOutline,
  personOutline,
} from "ionicons/icons";
import { Route, Redirect, useLocation } from "react-router-dom";

import CustomerHome from "./CustomerHome";
import CustomerDashboard from "./CustomerDashboard";
import Favorites from "./Favorites";
import PublicProperties from "../Properties";
import Profile from "./Profile";
import Reviews from "./Reviews";
import EditProfile from "./EditProfile";
import ChangePassword from "./ChangePassword";
import Settings from "./Settings";
import BecomeAgent from "./BecomeAgent"; // ← added

// Shared chat components
import ChatList from "../chat/ChatList";
import ChatRoom from "../chat/ChatRoom";

const CustomerTabs: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Selected states
  const isHome =
    currentPath === "/customer" ||
    currentPath === "/customer/" ||
    currentPath === "/customer/home";

  const isProperties = currentPath === "/customer/properties";
  const isFavorites = currentPath === "/customer/favorites";
  const isChat = currentPath.startsWith("/customer/chat");
  const isProfile =
    currentPath === "/customer/profile" ||
    currentPath.startsWith("/customer/profile/") ||
    currentPath === "/customer/become-agent"; // ← keep profile tab highlighted

  // Hide tab bar when inside a conversation
  const hideTabBar =
    currentPath.startsWith("/customer/chat/") &&
    currentPath !== "/customer/chat";

  return (
    <IonTabs>
      <IonRouterOutlet>
        {/* Main tabs */}
        <Route exact path="/customer/home" component={CustomerHome} />
        <Route exact path="/customer/properties" component={PublicProperties} />
        <Route exact path="/customer/favorites" component={Favorites} />
        <Route exact path="/customer/dashboard" component={CustomerDashboard} />

        {/* Chat */}
        <Route
          exact
          path="/customer/chat"
          render={() => (
            <ChatList role="customer" basePath="/customer/chat" />
          )}
        />
        <Route
          path="/customer/chat/:id"
          render={() => <ChatRoom role="customer" />}
        />

        {/* Profile & related */}
        <Route exact path="/customer/profile" component={Profile} />
        <Route exact path="/customer/profile/edit" component={EditProfile} />
        <Route exact path="/customer/reviews" component={Reviews} />
        <Route exact path="/customer/settings" component={Settings} />
        <Route
          exact
          path="/customer/change-password"
          component={ChangePassword}
        />

        {/* Become Agent */}
        <Route exact path="/customer/become-agent" component={BecomeAgent} />

        {/* Default redirect */}
        <Route exact path="/customer">
          <Redirect to="/customer/home" />
        </Route>
        <Route exact path="/customer/">
          <Redirect to="/customer/home" />
        </Route>
      </IonRouterOutlet>

      {/* ===================== TAB BAR ===================== */}
      <IonTabBar
        slot="bottom"
        className={`customer-tab-bar ${hideTabBar ? "hidden" : ""}`}
      >
        <IonTabButton tab="home" href="/customer/home" selected={isHome}>
          <IonIcon icon={homeOutline} />
          <IonLabel>Home</IonLabel>
        </IonTabButton>

        <IonTabButton
          tab="properties"
          href="/customer/properties"
          selected={isProperties}
        >
          <IonIcon icon={searchOutline} />
          <IonLabel>Search</IonLabel>
        </IonTabButton>

        <IonTabButton
          tab="favorites"
          href="/customer/favorites"
          selected={isFavorites}
        >
          <IonIcon icon={heartOutline} />
          <IonLabel>Favorites</IonLabel>
        </IonTabButton>

        <IonTabButton tab="chat" href="/customer/chat" selected={isChat}>
          <IonIcon icon={chatbubblesOutline} />
          <IonLabel>Messages</IonLabel>
        </IonTabButton>

        <IonTabButton
          tab="profile"
          href="/customer/profile"
          selected={isProfile}
        >
          <IonIcon icon={personOutline} />
          <IonLabel>Profile</IonLabel>
        </IonTabButton>
      </IonTabBar>

      <style>{`
        .customer-tab-bar {
          --background: #ffffff;
          --border: 1px solid #e5e7eb;
          border-top: 1px solid #e5e7eb;
          min-height: 62px;
          padding-bottom: env(safe-area-inset-bottom);
          transition: transform 0.25s ease, opacity 0.25s ease;
        }

        .customer-tab-bar.hidden {
          display: none;
        }

        .customer-tab-bar ion-tab-button {
          --color: #64748b;
          --color-selected: #2563eb;
          font-size: 11px;
          font-weight: 600;
        }

        .customer-tab-bar ion-tab-button ion-icon {
          font-size: 22px;
          margin-bottom: 3px;
        }

        .customer-tab-bar ion-tab-button ion-label {
          font-size: 11px;
          font-weight: 600;
        }

        @media (min-width: 768px) {
          .customer-tab-bar {
            min-height: 68px;
          }

          .customer-tab-bar ion-tab-button ion-icon {
            font-size: 23px;
          }

          .customer-tab-bar ion-tab-button ion-label {
            font-size: 12px;
          }
        }
      `}</style>
    </IonTabs>
  );
};

export default CustomerTabs;