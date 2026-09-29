import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
} from "@ionic/react";

import {
  peopleOutline,
  homeOutline,
  businessOutline,
  documentTextOutline,
  settingsOutline,
} from "ionicons/icons";

import { Route, Redirect } from "react-router-dom";

import AdminDashboard from "./AdminDashboard";
import AdminUsers from "./AdminUsers";
import AdminProperties from "./AdminProperties";
import AdminAgents from "./AdminAgents";
import AdminSettings from "./AdminSettings";

export default function AdminTabs() {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/admin/dashboard">
          <AdminDashboard />
        </Route>

        <Route exact path="/admin/users">
          <AdminUsers />
        </Route>

        <Route exact path="/admin/properties">
          <AdminProperties />
        </Route>

        <Route exact path="/admin/agents">
          <AdminAgents />
        </Route>

        <Route exact path="/admin/settings">
          <AdminSettings />
        </Route>

        <Route exact path="/admin">
          <Redirect to="/admin/dashboard" />
        </Route>
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
        <IonTabButton tab="dashboard" href="/admin/dashboard">
          <IonIcon icon={homeOutline} />
          <IonLabel>Dashboard</IonLabel>
        </IonTabButton>

        <IonTabButton tab="users" href="/admin/users">
          <IonIcon icon={peopleOutline} />
          <IonLabel>Users</IonLabel>
        </IonTabButton>

        <IonTabButton tab="properties" href="/admin/properties">
          <IonIcon icon={businessOutline} />
          <IonLabel>Properties</IonLabel>
        </IonTabButton>

        <IonTabButton tab="agents" href="/admin/agents">
          <IonIcon icon={documentTextOutline} />
          <IonLabel>Agents</IonLabel>
        </IonTabButton>

        <IonTabButton tab="settings" href="/admin/settings">
          <IonIcon icon={settingsOutline} />
          <IonLabel>Settings</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}