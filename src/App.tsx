// src/App.tsx

import React from "react";
import { Redirect, Route } from "react-router-dom";
import {
  IonApp,
  IonRouterOutlet,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";

/* =========================================================
   PAGES – Public
========================================================= */
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PublicProperties from "./pages/Properties";
import PropertyDetails from "./pages/PropertyDetails";

/* =========================================================
   PAGES – Customer
========================================================= */
import CustomerTabs from "./pages/customer/CustomerTabs";
import BecomeAgent from "./pages/customer/BecomeAgent";

/* =========================================================
   PAGES – Agent / Landlord
========================================================= */
import AgentTabs from "./pages/agent/AgentTabs";

/* =========================================================
   PAGES – Chat
========================================================= */
import ChatList from "./pages/chat/ChatList";
import ChatRoom from "./pages/chat/ChatRoom";

/* =========================================================
   PAGES – Admin
========================================================= */
import AdminTabs from "./pages/admin/AdminTabs";
import AdminAgentRequests from "./pages/admin/AdminAgentRequests";
import AdminSettings from "./pages/admin/AdminSettings";
import ChangePassword from "./pages/admin/ChangePassword";

/* =========================================================
   SHARED
========================================================= */
import ProtectedRoute from "./routes/ProtectedRoute";
import Menu from "./components/Menu";

/* =========================================================
   SETUP
========================================================= */
setupIonicReact();

/* =========================================================
   CHAT ROUTE WRAPPERS
========================================================= */

const CustomerChatRoom: React.FC = () => <ChatRoom role="customer" />;
const AgentChatRoom: React.FC = () => <ChatRoom role="agent" />;

const AgentChatList: React.FC = () => (
  <ChatList role="agent" basePath="/agent/chat" />
);

/* =========================================================
   APP
========================================================= */

const App: React.FC = () => {
  return (
    <IonApp>
      <IonReactRouter>
        <Menu />

        <IonRouterOutlet id="main-content">
          {/* ===================== PUBLIC ===================== */}
          <Route exact path="/" component={Home} />
          <Route exact path="/login" component={Login} />
          <Route exact path="/register" component={Register} />
          <Route exact path="/properties" component={PublicProperties} />
          <Route exact path="/property/:id" component={PropertyDetails} />

          {/* ===================== CUSTOMER ===================== */}
          {/* Specific routes MUST come before the catch-all /customer */}

          <ProtectedRoute
            exact
            path="/customer/become-agent"
            component={BecomeAgent}
            allowedRoles={["customer"]}
          />

          {/* Chat Room (full page) */}
          <ProtectedRoute
            exact
            path="/customer/chat/:id"
            component={CustomerChatRoom}
            allowedRoles={["customer"]}
          />

          {/* CustomerTabs (contains Home, Search, Favorites, Messages, Profile) */}
          <ProtectedRoute
            path="/customer"
            component={CustomerTabs}
            allowedRoles={["customer"]}
          />

          {/* ===================== AGENT / LANDLORD ===================== */}
          <ProtectedRoute
            exact
            path="/agent/chat/:id"
            component={AgentChatRoom}
            allowedRoles={["agent", "landlord"]}
          />

      

          <ProtectedRoute
            exact
            path="/agent/properties/:id"
            component={PropertyDetails}
            allowedRoles={["agent", "landlord"]}
          />

          <ProtectedRoute
            path="/agent"
            component={AgentTabs}
            allowedRoles={["agent", "landlord"]}
          />

          {/* ===================== ADMIN ===================== */}
          <ProtectedRoute
            exact
            path="/admin/agent-requests"
            component={AdminAgentRequests}
            allowedRoles={["admin"]}
          />

          <ProtectedRoute
            exact
            path="/admin/settings"
            component={AdminSettings}
            allowedRoles={["admin"]}
          />

          <ProtectedRoute
            exact
            path="/admin/change-password"
            component={ChangePassword}
            allowedRoles={["admin"]}
          />

          <ProtectedRoute
            path="/admin"
            component={AdminTabs}
            allowedRoles={["admin"]}
          />

          {/* ===================== FALLBACK ===================== */}
          <Route render={() => <Redirect to="/login" />} />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;