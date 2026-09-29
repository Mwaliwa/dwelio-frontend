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
} from "@ionic/react";

import {
  homeOutline,
  searchOutline,
  logInOutline,
  personAddOutline,
} from "ionicons/icons";

export default function PublicMenu() {
  return (
    <IonMenu contentId="main-content" menuId="public-menu" type="overlay">
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Dwelio</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonList>

          <IonItem
            routerLink="/"
            routerDirection="root"
            lines="none"
          >
            <IonIcon icon={homeOutline} slot="start" />
            <IonLabel>Home</IonLabel>
          </IonItem>

          <IonItem
            routerLink="/properties"
            routerDirection="forward"
            lines="none"
          >
            <IonIcon icon={searchOutline} slot="start" />
            <IonLabel>Browse Properties</IonLabel>
          </IonItem>

          <IonItem
            routerLink="/login"
            routerDirection="forward"
            lines="none"
          >
            <IonIcon icon={logInOutline} slot="start" />
            <IonLabel>Login</IonLabel>
          </IonItem>

          <IonItem
            routerLink="/register"
            routerDirection="forward"
            lines="none"
          >
            <IonIcon icon={personAddOutline} slot="start" />
            <IonLabel>Create Account</IonLabel>
          </IonItem>

        </IonList>
      </IonContent>
    </IonMenu>
  );
}