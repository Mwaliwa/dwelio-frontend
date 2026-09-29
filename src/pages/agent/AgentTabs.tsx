import React from "react";
import { Redirect, Route, useLocation } from "react-router-dom";

import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from "@ionic/react";

import {
  homeOutline,
  businessOutline,
  calendarOutline,
  chatbubblesOutline,
  settingsOutline,
  addCircleOutline,
} from "ionicons/icons";

/* =========================================================
   AGENT PAGES
========================================================= */

import Dashboard from "./Dashboard";
import Properties from "./Properties";
import AddProperty from "./AddProperty";
import Bookings from "./Bookings";
import Settings from "./Settings";
import ChatList from "../chat/ChatList";
import ChatRoom from "../chat/ChatRoom";          // ← added

/* =========================================================
   COMPONENT
========================================================= */

const AgentTabs: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isDashboard =
    currentPath === "/agent" ||
    currentPath === "/agent/" ||
    currentPath === "/agent/dashboard";

  const isProperties = currentPath === "/agent/properties";
  const isAddProperty = currentPath === "/agent/add-property";
  const isBookings = currentPath === "/agent/bookings";
  const isChat = currentPath.startsWith("/agent/chat");   // ← improved
  const isSettings = currentPath === "/agent/settings";

  // Hide tab bar when inside a conversation
  const hideTabBar =
    currentPath.startsWith("/agent/chat/") && currentPath !== "/agent/chat";

  return (
    <IonTabs>
      {/* =====================================================
          AGENT ROUTER
      ===================================================== */}
      <IonRouterOutlet>
        <Route exact path="/agent/dashboard" component={Dashboard} />
        <Route exact path="/agent/properties" component={Properties} />
        <Route exact path="/agent/add-property" component={AddProperty} />
        <Route exact path="/agent/bookings" component={Bookings} />

        {/* Chat list */}
        <Route
          exact
          path="/agent/chat"
          render={() => <ChatList role="agent" basePath="/agent/chat" />}
        />

        {/* Individual conversation */}
        <Route
          path="/agent/chat/:id"
          render={() => <ChatRoom role="agent" />}
        />

        <Route exact path="/agent/settings" component={Settings} />

        {/* Default redirects */}
        <Route
          exact
          path="/agent"
          render={() => <Redirect to="/agent/dashboard" />}
        />
        <Route
          exact
          path="/agent/"
          render={() => <Redirect to="/agent/dashboard" />}
        />
      </IonRouterOutlet>

      {/* =====================================================
          AGENT TAB BAR
      ===================================================== */}
      <IonTabBar
        slot="bottom"
        translucent={false}
        className={`agent-tab-bar ${hideTabBar ? "hidden" : ""}`}
      >
        <IonTabButton
          tab="dashboard"
          href="/agent/dashboard"
          selected={isDashboard}
        >
          <IonIcon icon={homeOutline} />
          <IonLabel>Dashboard</IonLabel>
        </IonTabButton>

        <IonTabButton
          tab="properties"
          href="/agent/properties"
          selected={isProperties}
        >
          <IonIcon icon={businessOutline} />
          <IonLabel>Properties</IonLabel>
        </IonTabButton>

        <IonTabButton
          tab="add-property"
          href="/agent/add-property"
          selected={isAddProperty}
          className="add-property-tab"
        >
          <div className="add-property-icon">
            <IonIcon icon={addCircleOutline} />
          </div>
          <IonLabel>Add</IonLabel>
        </IonTabButton>

        <IonTabButton tab="chat" href="/agent/chat" selected={isChat}>
          <IonIcon icon={chatbubblesOutline} />
          <IonLabel>Messages</IonLabel>
        </IonTabButton>

        <IonTabButton
          tab="settings"
          href="/agent/settings"
          selected={isSettings}
        >
          <IonIcon icon={settingsOutline} />
          <IonLabel>Settings</IonLabel>
        </IonTabButton>
      </IonTabBar>

      <style>
        {`
          .agent-tab-bar {
            --background: #ffffff;
            --border: 1px solid #e5e7eb;
            border-top: 1px solid #e5e7eb;
            min-height: 62px;
            padding-bottom: env(safe-area-inset-bottom);
            transition: transform 0.25s ease, opacity 0.25s ease;
          }

          .agent-tab-bar.hidden {
            display: none;
          }

          .agent-tab-bar ion-tab-button {
            --color: #64748b;
            --color-selected: #2563eb;
            font-size: 11px;
            font-weight: 600;
          }

          .agent-tab-bar ion-tab-button ion-icon {
            font-size: 22px;
            margin-bottom: 3px;
          }

          .agent-tab-bar ion-tab-button ion-label {
            font-size: 11px;
            font-weight: 600;
          }

          .agent-tab-bar .add-property-tab {
            position: relative;
          }

          .agent-tab-bar .add-property-icon {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #2563eb;
            color: #ffffff;
            margin-top: -12px;
            margin-bottom: 2px;
            box-shadow: 0 5px 14px rgba(37, 99, 235, 0.28);
          }

          .agent-tab-bar .add-property-icon ion-icon {
            font-size: 27px;
            margin: 0;
            color: #ffffff;
          }

          .agent-tab-bar .add-property-tab ion-label {
            color: #2563eb;
          }

          @media (min-width: 768px) {
            .agent-tab-bar {
              min-height: 68px;
            }

            .agent-tab-bar ion-tab-button ion-icon {
              font-size: 23px;
            }

            .agent-tab-bar ion-tab-button ion-label {
              font-size: 12px;
            }
          }
        `}
      </style>
    </IonTabs>
  );
};

export default AgentTabs;