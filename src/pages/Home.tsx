
import React from "react";
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
  keyOutline,
  mapOutline,
  addCircleOutline,
  arrowForwardOutline,
  businessOutline,
} from "ionicons/icons";

export default function Home() {
  return (
    <IonPage>
      {/* ================= EMBEDDED STYLES ================= */}
      <style>{`

        /* ================= GLOBAL HOME STYLING ================= */

        .home-content {
          --background: #f4f7fc;
        }

        .home-toolbar {
          --background: #102f50;
          --color: #ffffff;
          --min-height: 65px;
        }

        .home-toolbar ion-title {
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        /* ================= HERO BANNER ================= */

        .hero-banner {
          width: 100%;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .hero-banner-image {
          width: 100%;
          height: 430px;
          display: block;
          object-fit: cover;
          object-position: center;
        }

        /* ================= HERO CONTENT ================= */

        .hero-banner-content {
          width: 100%;
          max-width: 1250px;
          margin: 0 auto;
          padding: 48px 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 35px;
        }

        .hero-text {
          flex: 1;
          max-width: 760px;
        }

        .hero-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #e6f1ff;
          color: #1769aa;
          padding: 8px 15px;
          border-radius: 30px;
          font-size: 0.85rem;
          font-weight: 700;
          margin-bottom: 18px;
        }

        .hero-text h1 {
          font-size: clamp(2rem, 5vw, 3.1rem);
          font-weight: 850;
          line-height: 1.17;
          color: #102f50;
          margin: 0 0 18px;
        }

        .hero-text h1 span {
          color: #e99a19;
        }

        .hero-text p {
          font-size: 1.08rem;
          line-height: 1.8;
          color: #64748b;
          max-width: 650px;
          margin: 0 0 28px;
        }

        .hero-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
        }

        .hero-buttons ion-button {
          --border-radius: 10px;
          font-weight: 700;
          min-height: 50px;
        }

        .hero-logo {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-logo img {
          width: 155px;
          max-width: 100%;
          height: auto;
          object-fit: contain;
          filter: drop-shadow(0 5px 12px rgba(16, 47, 80, 0.12));
        }

        /* ================= SERVICES SECTION ================= */

        .services-section {
          background: #f1f5fb;
          padding: 65px 0 75px;
        }

        .section-heading {
          text-align: center;
          margin-bottom: 42px;
          padding: 0 20px;
        }

        .section-heading span {
          color: #e99a19;
          font-size: 0.85rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .section-heading h2 {
          color: #102f50;
          font-size: clamp(1.7rem, 4vw, 2.3rem);
          font-weight: 800;
          margin: 12px 0;
        }

        .section-heading p {
          color: #718096;
          font-size: 1rem;
          line-height: 1.7;
          max-width: 600px;
          margin: 0 auto;
        }

        /* ================= SERVICE CARDS ================= */

        .service-card {
          height: calc(100% - 16px);
          margin: 8px;
          border-radius: 18px;
          overflow: hidden;
          background: #ffffff;
          box-shadow: 0 8px 30px rgba(16, 47, 80, 0.07);
          transition: transform 0.3s ease,
                      box-shadow 0.3s ease;
        }

        .service-card:hover {
          transform: translateY(-7px);
          box-shadow: 0 15px 35px rgba(16, 47, 80, 0.13);
        }

        .service-image {
          width: 100%;
          height: 205px;
          object-fit: cover;
          display: block;
        }

        .service-card-content {
          text-align: center;
          padding: 28px 22px 30px !important;
        }

        .service-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 68px;
          height: 68px;
          border-radius: 18px;
          background: #e8f2ff;
          color: #1769aa;
          font-size: 34px;
          margin-bottom: 14px;
        }

        .service-card h3 {
          font-size: 1.3rem;
          color: #102f50;
          font-weight: 800;
          margin: 5px 0 12px;
        }

        .service-card p {
          font-size: 0.96rem;
          line-height: 1.75;
          color: #718096;
          min-height: 75px;
          margin: 0 0 18px;
        }

        .service-card ion-button {
          font-weight: 700;
          --color: #1769aa;
        }

        /* ================= CALL TO ACTION ================= */

        .cta-section {
          position: relative;
          overflow: hidden;
          padding: 75px 20px;
          text-align: center;
          background: linear-gradient(
            135deg,
            #102f50 0%,
            #174d77 55%,
            #1769aa 100%
          );
        }

        .cta-section::before {
          content: "";
          position: absolute;
          width: 280px;
          height: 280px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          top: -130px;
          left: -80px;
        }

        .cta-section::after {
          content: "";
          position: absolute;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          bottom: -110px;
          right: -50px;
        }

        .cta-content {
          position: relative;
          z-index: 2;
          max-width: 800px;
          margin: 0 auto;
        }

        .cta-content h2 {
          color: #ffffff;
          font-size: clamp(1.7rem, 4vw, 2.4rem);
          font-weight: 850;
          line-height: 1.3;
          margin: 0 0 16px;
        }

        .cta-content p {
          color: #d7e7f7;
          font-size: 1.05rem;
          line-height: 1.8;
          margin: 0 0 30px;
        }

        .cta-buttons {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 14px;
        }

        .cta-buttons ion-button {
          --border-radius: 10px;
          font-weight: 700;
          min-height: 50px;
        }

        /* ================= FOOTER ================= */

        .home-footer {
          background: #0b223a;
          color: #b9c8d8;
          text-align: center;
          padding: 23px 15px;
          font-size: 0.88rem;
        }

        .home-footer strong {
          color: #ffffff;
        }

        /* ================= TABLET RESPONSIVENESS ================= */

        @media (max-width: 768px) {

          .hero-banner-image {
            height: 280px;
          }

          .hero-banner-content {
            flex-direction: column;
            text-align: center;
            padding: 38px 22px;
          }

          .hero-text {
            max-width: 100%;
          }

          .hero-text p {
            margin-left: auto;
            margin-right: auto;
          }

          .hero-buttons {
            justify-content: center;
          }

          .hero-logo img {
            width: 110px;
          }

          .services-section {
            padding: 50px 0;
          }

          .service-card {
            margin: 7px 0;
          }

          .service-image {
            height: 220px;
          }

          .service-card p {
            min-height: auto;
          }

          .cta-section {
            padding: 60px 20px;
          }
        }

        /* ================= SMALL MOBILE ================= */

        @media (max-width: 480px) {

          .home-toolbar {
            --min-height: 58px;
          }

          .home-toolbar ion-title {
            font-size: 1.15rem;
          }

          .hero-banner-image {
            height: 210px;
          }

          .hero-banner-content {
            padding: 30px 18px;
            gap: 22px;
          }

          .hero-text h1 {
            font-size: 1.9rem;
          }

          .hero-text p {
            font-size: 0.96rem;
          }

          .hero-buttons {
            flex-direction: column;
            width: 100%;
          }

          .hero-buttons ion-button {
            width: 100%;
            margin: 0;
          }

          .hero-logo img {
            width: 95px;
          }

          .section-heading h2 {
            font-size: 1.7rem;
          }

          .service-image {
            height: 190px;
          }

          .cta-buttons {
            flex-direction: column;
          }

          .cta-buttons ion-button {
            width: 100%;
            margin: 0;
          }
        }

      `}</style>

      {/* ================= HEADER ================= */}

      <IonHeader>
        <IonToolbar className="home-toolbar">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>

          <IonTitle>MaloHub</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="home-content">

        {/* ================= HERO SECTION ================= */}

        <section className="hero-banner">

          {/* Banner Image */}
          <img
            src="/assets/ban.png"
            alt="MaloHub real estate properties"
            className="hero-banner-image"
          />

          {/* Hero Content Below Image */}
          <div className="hero-banner-content">

            <div className="hero-text">

              <div className="hero-label">
                <IonIcon icon={businessOutline} />
                YOUR REAL ESTATE PARTNER
              </div>

              <h1>
                Find a Place You'll
                <br />
                <span>Love to Call Home.</span>
              </h1>

              <p>
                Discover your dream home, find the perfect rental,
                or explore land and investment opportunities.
                Buy, sell and rent properties with confidence
                through MaloHub.
              </p>

              <div className="hero-buttons">

                <IonButton
                  color="warning"
                  routerLink="/properties"
                  size="large"
                >
                  Browse Properties
                  <IonIcon
                    icon={arrowForwardOutline}
                    slot="end"
                  />
                </IonButton>

                <IonButton
                  fill="outline"
                  color="primary"
                  routerLink="/agent/add-property"
                  size="large"
                >
                  <IonIcon
                    icon={addCircleOutline}
                    slot="start"
                  />
                  List Your Property
                </IonButton>

              </div>
            </div>

            {/* MaloHub Logo */}
            <div className="hero-logo">
              <img
                src="/assets/malo.png"
                alt="MaloHub Logo"
              />
            </div>

          </div>
        </section>

        {/* ================= SERVICES SECTION ================= */}

        <section className="services-section">

          <div className="section-heading">

            <span>WHAT WE OFFER</span>

            <h2>Explore Our Property Services</h2>

            <p>
              Whether you are looking to buy, rent or invest,
              MaloHub helps you discover property opportunities
              that match your needs.
            </p>

          </div>

          <IonGrid className="ion-padding">

            <IonRow>

              {/* BUY PROPERTY */}

              <IonCol size="12" sizeMd="4">

                <IonCard className="service-card">

                  <img
                    src="/assets/buy.jpg"
                    alt="Buy residential property"
                    className="service-image"
                  />

                  <IonCardContent className="service-card-content">

                    <div className="service-icon">
                      <IonIcon icon={homeOutline} />
                    </div>

                    <h3>Buy Property</h3>

                    <p>
                      Discover houses, apartments and commercial
                      properties available for sale. Find a property
                      that suits your lifestyle and budget.
                    </p>

                    <IonButton
                      fill="clear"
                      routerLink="/properties"
                    >
                      Explore Properties
                      <IonIcon
                        icon={arrowForwardOutline}
                        slot="end"
                      />
                    </IonButton>

                  </IonCardContent>
                </IonCard>

              </IonCol>

              {/* RENT PROPERTY */}

              <IonCol size="12" sizeMd="4">

                <IonCard className="service-card">

                  <img
                    src="/assets/rent.jpg"
                    alt="Rental residential property"
                    className="service-image"
                  />

                  <IonCardContent className="service-card-content">

                    <div className="service-icon">
                      <IonIcon icon={keyOutline} />
                    </div>

                    <h3>Rent Property</h3>

                    <p>
                      Find rental homes, apartments, offices and
                      commercial spaces in locations that work
                      for you.
                    </p>

                    <IonButton
                      fill="clear"
                      routerLink="/properties"
                    >
                      Explore Rentals
                      <IonIcon
                        icon={arrowForwardOutline}
                        slot="end"
                      />
                    </IonButton>

                  </IonCardContent>
                </IonCard>

              </IonCol>

              {/* LAND SALES */}

              <IonCol size="12" sizeMd="4">

                <IonCard className="service-card">

                  <img
                    src="/assets/sale.jpg"
                    alt="Land for sale and property development"
                    className="service-image"
                  />

                  <IonCardContent className="service-card-content">

                    <div className="service-icon">
                      <IonIcon icon={mapOutline} />
                    </div>

                    <h3>Land Sales</h3>

                    <p>
                      Explore residential, agricultural and
                      commercial land opportunities for your
                      next development or investment.
                    </p>

                    <IonButton
                      fill="clear"
                      routerLink="/properties"
                    >
                      Explore Land
                      <IonIcon
                        icon={arrowForwardOutline}
                        slot="end"
                      />
                    </IonButton>

                  </IonCardContent>
                </IonCard>

              </IonCol>

            </IonRow>

          </IonGrid>

        </section>

        {/* ================= CALL TO ACTION ================= */}

        <section className="cta-section">

          <div className="cta-content">

            <h2>
              Ready to Find Your Next Property?
            </h2>

            <p>
              Start exploring property listings, discover
              available homes and connect with property
              opportunities through MaloHub.
            </p>

            <div className="cta-buttons">

              <IonButton
                color="warning"
                size="large"
                routerLink="/register"
              >
                Get Started
                <IonIcon
                  icon={arrowForwardOutline}
                  slot="end"
                />
              </IonButton>

              <IonButton
                fill="outline"
                color="light"
                size="large"
                routerLink="/login"
              >
                Login
              </IonButton>

            </div>

          </div>

        </section>

        {/* ================= FOOTER ================= */}

        <footer className="home-footer">
          <p>
            © {new Date().getFullYear()} <strong>MaloHub</strong>.
            All Rights Reserved.
          </p>
        </footer>

      </IonContent>
    </IonPage>
  );
}