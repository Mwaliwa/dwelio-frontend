import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonIcon,
  IonText,
  IonButton,
} from "@ionic/react";
import { cardOutline, constructOutline } from "ionicons/icons";
import { useIonRouter } from "@ionic/react";

export default function Checkout() {
  const router = useIonRouter();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Checkout</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div
          style={{
            minHeight: "70vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "20px",
              background: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            <IonIcon
              icon={constructOutline}
              style={{ fontSize: "40px", color: "#64748b" }}
            />
          </div>

          <h2 style={{ margin: "0 0 10px", fontWeight: 700 }}>
            Payments Coming Soon
          </h2>

          <IonText color="medium">
            <p style={{ maxWidth: "320px", lineHeight: 1.6 }}>
              Online payments are not available yet.  
              You can still browse properties and contact agents.
            </p>
          </IonText>

          <IonButton
            color="primary"
            style={{ marginTop: "24px" }}
            onClick={() => router.goBack()}
          >
            Go Back
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
}