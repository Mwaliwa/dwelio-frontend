import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonButtons,
  IonMenuButton,
} from "@ionic/react";
import { home, key, map, addCircle } from "ionicons/icons";

export default function Home() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          {/* Menu Button */}
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>

          <IonTitle>Dwelio</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {/* Hero Section */}
        <div
          style={{
            padding: "50px 20px",
            textAlign: "center",
            background: "linear-gradient(135deg, #3880ff 0%, #3dc2ff 100%)",
            color: "white",
          }}
        >
          <h1 style={{ fontSize: "2rem", marginBottom: "12px" }}>
            🏡 Welcome to Dwelio
          </h1>
          <p
            style={{
              fontSize: "1.1rem",
              opacity: 0.95,
              maxWidth: "500px",
              margin: "0 auto 24px",
            }}
          >
            Find your dream home, rent properties, or invest in land with
            confidence.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {/* Browse Properties - Public */}
            <IonButton
              color="light"
              routerLink="/properties"
              style={{ fontWeight: "600" }}
            >
              Browse Properties
            </IonButton>

            {/* List Property - Goes to the real protected route */}
            <IonButton
              fill="outline"
              color="light"
              routerLink="/agent/add-property"
              style={{ fontWeight: "600" }}
            >
              <IonIcon icon={addCircle} slot="start" />
              List Your Property
            </IonButton>
          </div>
        </div>

        {/* Services Section */}
        <IonGrid className="ion-padding">
          <IonRow>
            <IonCol size="12" sizeMd="4">
              <IonCard style={{ height: "100%" }}>
                <IonCardContent style={{ textAlign: "center" }}>
                  <IonIcon
                    icon={home}
                    style={{
                      fontSize: "40px",
                      color: "#3880ff",
                      marginBottom: "12px",
                    }}
                  />
                  <h2>Buy Property</h2>
                  <p>
                    Browse houses, apartments, and commercial properties for
                    sale.
                  </p>
                  <IonButton
                    fill="clear"
                    size="small"
                    routerLink="/properties"
                  >
                    View Listings
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol size="12" sizeMd="4">
              <IonCard style={{ height: "100%" }}>
                <IonCardContent style={{ textAlign: "center" }}>
                  <IonIcon
                    icon={key}
                    style={{
                      fontSize: "40px",
                      color: "#3880ff",
                      marginBottom: "12px",
                    }}
                  />
                  <h2>Rent Property</h2>
                  <p>
                    Find rental homes, apartments, offices, and business spaces.
                  </p>
                  <IonButton
                    fill="clear"
                    size="small"
                    routerLink="/properties"
                  >
                    View Rentals
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol size="12" sizeMd="4">
              <IonCard style={{ height: "100%" }}>
                <IonCardContent style={{ textAlign: "center" }}>
                  <IonIcon
                    icon={map}
                    style={{
                      fontSize: "40px",
                      color: "#3880ff",
                      marginBottom: "12px",
                    }}
                  />
                  <h2>Land Sales</h2>
                  <p>
                    Explore residential, agricultural, and commercial land
                    listings.
                  </p>
                  <IonButton
                    fill="clear"
                    size="small"
                    routerLink="/properties"
                  >
                    View Land
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Call to Action */}
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            background: "#f4f7fc",
          }}
        >
          <h2 style={{ marginBottom: "10px" }}>
            Ready to Find Your Next Property?
          </h2>
          <p style={{ marginBottom: "24px", color: "#666" }}>
            Thousands of verified property listings are available on Dwelio.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <IonButton color="primary" routerLink="/register">
              Get Started
            </IonButton>

            <IonButton fill="outline" color="primary" routerLink="/login">
              Login
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}