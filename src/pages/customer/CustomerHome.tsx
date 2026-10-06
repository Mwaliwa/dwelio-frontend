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

import {
  homeOutline,
  heartOutline,
  searchOutline,
  cashOutline,
  speedometerOutline,
  personCircleOutline,
} from "ionicons/icons";

export default function CustomerHome() {
  const userName = (() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.name || user.full_name || "there";
      }
    } catch {}
    return localStorage.getItem("name") || "there";
  })();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Welcome Back</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {/* ========== HERO ========== */}
        <div
          style={{
            position: "relative",
            padding: "48px 20px 50px",
            color: "white",
            overflow: "hidden",
            backgroundImage: "url('/assets/nice.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Dark overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.7))",
              zIndex: 1,
            }}
          />

          {/* Hero Content */}
          <div
            style={{
              position: "relative",
              zIndex: 2,
              maxWidth: "1100px",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "40px",
              flexWrap: "wrap",
            }}
            className="hero-content"
          >
            {/* Text + Buttons */}
            <div
              style={{
                flex: "1 1 420px",
                textAlign: "left",
              }}
              className="hero-text"
            >
              <h1
                style={{
                  fontSize: "clamp(1.8rem, 4vw, 2.3rem)",
                  margin: "0 0 12px",
                  fontWeight: 700,
                  textShadow: "0 2px 8px rgba(0,0,0,0.4)",
                }}
              >
                Hello, {userName}
              </h1>

              <p
                style={{
                  fontSize: "1.05rem",
                  opacity: 0.95,
                  maxWidth: "460px",
                  margin: "0 0 28px",
                  lineHeight: 1.5,
                  textShadow: "0 1px 4px rgba(0,0,0,0.3)",
                }}
              >
                Find your perfect home, save favorites, and manage everything in
                one place.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <IonButton
                  color="light"
                  routerLink="/customer/properties"
                  style={{ fontWeight: 600, minWidth: "150px" }}
                >
                  <IonIcon icon={searchOutline} slot="start" />
                  Browse Homes
                </IonButton>

                <IonButton
                  fill="outline"
                  color="light"
                  routerLink="/customer/favorites"
                  style={{ fontWeight: 600, minWidth: "140px" }}
                >
                  <IonIcon icon={heartOutline} slot="start" />
                  Favorites
                </IonButton>
              </div>
            </div>

            {/* Logo */}
            <div
              style={{
                flex: "0 0 auto",
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
              className="hero-logo"
            >
              <img
                src="/assets/malo.png"
                alt="MaloHub"
                style={{
                  height: "clamp(130px, 20vw, 200px)",
                  width: "auto",
                  maxWidth: "280px",
                  objectFit: "contain",
                  display: "block",
                  borderRadius: "16px",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
                  filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.3))",
                }}
              />
            </div>
          </div>
        </div>

        {/* ========== QUICK FEATURES ========== */}
        <IonGrid className="ion-padding">
          <IonRow>
            <IonCol size="12">
              <h2
                style={{
                  margin: "8px 0 16px",
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  color: "#1e293b",
                }}
              >
                What you can do
              </h2>
            </IonCol>

            {/* Smart Search */}
            <IonCol size="12" sizeMd="6">
              <IonCard
                style={{ borderRadius: "14px", margin: 0, height: "100%" }}
              >
                <IonCardContent style={{ padding: "22px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "#eff6ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "14px",
                    }}
                  >
                    <IonIcon
                      icon={searchOutline}
                      style={{ fontSize: "24px", color: "#2563eb" }}
                    />
                  </div>
                  <h3 style={{ margin: "0 0 6px", fontWeight: 600 }}>
                    Smart Search
                  </h3>
                  <p
                    style={{
                      margin: "0 0 16px",
                      color: "#64748b",
                      fontSize: "0.95rem",
                    }}
                  >
                    Find properties by location, price, or type in seconds.
                  </p>
                  <IonButton
                    size="small"
                    fill="outline"
                    routerLink="/customer/properties"
                  >
                    Start Searching
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </IonCol>

            {/* Saved Homes */}
            <IonCol size="12" sizeMd="6">
              <IonCard
                style={{ borderRadius: "14px", margin: 0, height: "100%" }}
              >
                <IonCardContent style={{ padding: "22px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "#fef2f2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "14px",
                    }}
                  >
                    <IonIcon
                      icon={heartOutline}
                      style={{ fontSize: "24px", color: "#e11d48" }}
                    />
                  </div>
                  <h3 style={{ margin: "0 0 6px", fontWeight: 600 }}>
                    Saved Homes
                  </h3>
                  <p
                    style={{
                      margin: "0 0 16px",
                      color: "#64748b",
                      fontSize: "0.95rem",
                    }}
                  >
                    Keep track of properties you love in your favorites list.
                  </p>
                  <IonButton
                    size="small"
                    fill="outline"
                    routerLink="/customer/favorites"
                  >
                    View Favorites
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </IonCol>

            {/* Verified Listings */}
            <IonCol size="12" sizeMd="6">
              <IonCard
                style={{ borderRadius: "14px", margin: 0, height: "100%" }}
              >
                <IonCardContent style={{ padding: "22px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "#f0fdf4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "14px",
                    }}
                  >
                    <IonIcon
                      icon={homeOutline}
                      style={{ fontSize: "24px", color: "#16a34a" }}
                    />
                  </div>
                  <h3 style={{ margin: "0 0 6px", fontWeight: 600 }}>
                    Verified Listings
                  </h3>
                  <p
                    style={{
                      margin: "0 0 16px",
                      color: "#64748b",
                      fontSize: "0.95rem",
                    }}
                  >
                    Only trusted and verified property listings from real
                    agents.
                  </p>
                </IonCardContent>
              </IonCard>
            </IonCol>

            {/* Best Prices */}
            <IonCol size="12" sizeMd="6">
              <IonCard
                style={{ borderRadius: "14px", margin: 0, height: "100%" }}
              >
                <IonCardContent style={{ padding: "22px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "#fff7ed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "14px",
                    }}
                  >
                    <IonIcon
                      icon={cashOutline}
                      style={{ fontSize: "24px", color: "#ea580c" }}
                    />
                  </div>
                  <h3 style={{ margin: "0 0 6px", fontWeight: 600 }}>
                    Best Prices
                  </h3>
                  <p
                    style={{
                      margin: "0 0 16px",
                      color: "#64748b",
                      fontSize: "0.95rem",
                    }}
                  >
                    Compare prices and find the best deals across Malawi.
                  </p>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          {/* ========== ACCOUNT SECTION ========== */}
          <IonRow className="ion-margin-top">
            <IonCol size="12">
              <IonCard
                style={{
                  borderRadius: "16px",
                  margin: 0,
                  background:
                    "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                }}
              >
                <IonCardContent
                  style={{ padding: "28px 22px", textAlign: "center" }}
                >
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "16px",
                      background: "#eff6ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px",
                    }}
                  >
                    <IonIcon
                      icon={speedometerOutline}
                      style={{ fontSize: "28px", color: "#2563eb" }}
                    />
                  </div>

                  <h2 style={{ margin: "0 0 8px", fontWeight: 600 }}>
                    Manage Your Account
                  </h2>
                  <p
                    style={{
                      margin: "0 0 22px",
                      color: "#64748b",
                      maxWidth: "360px",
                      marginLeft: "auto",
                      marginRight: "auto",
                    }}
                  >
                    Access your dashboard to view saved homes, activity,
                    inquiries, and reviews.
                  </p>

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      justifyContent: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <IonButton
                      color="primary"
                      routerLink="/customer/dashboard"
                      style={{ minWidth: "160px" }}
                    >
                      Open Dashboard
                    </IonButton>

                    <IonButton fill="outline" routerLink="/customer/profile">
                      <IonIcon icon={personCircleOutline} slot="start" />
                      Profile
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* ========== CTA ========== */}
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            background: "#f8fafc",
            marginTop: "8px",
          }}
        >
          <h2 style={{ margin: "0 0 8px", fontWeight: 600 }}>
            Ready to find your dream home?
          </h2>
          <p style={{ margin: "0 0 24px", color: "#64748b" }}>
            Start exploring thousands of listings today.
          </p>

          <IonButton
            color="success"
            size="large"
            routerLink="/customer/properties"
          >
            Explore Properties
          </IonButton>
        </div>
      </IonContent>

      {/* Mobile styles */}
      <style>
        {`
          @media (max-width: 768px) {
            .hero-content {
              flex-direction: column-reverse !important; /* logo comes first (on top) */
              align-items: flex-end !important;          /* stick to the right */
            }

            .hero-logo {
              align-self: flex-end !important;
              margin-bottom: 24px;
              width: 100%;
              display: flex;
              justify-content: flex-end;
            }

            .hero-text {
              width: 100%;
              text-align: left !important;
            }
          }
        `}
      </style>
    </IonPage>
  );
}