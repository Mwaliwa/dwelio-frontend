import React, { useCallback, useEffect, useState } from "react";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonText,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonNote,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonButtons,
  IonMenuButton,
  RefresherEventDetail,
} from "@ionic/react";
import {
  heartOutline,
  timeOutline,
  chatbubbleOutline,
  starOutline,
  personOutline,
  settingsOutline,
  homeOutline,
  chevronForwardOutline,
} from "ionicons/icons";

/* =========================================================
   TYPES
========================================================= */

interface Review {
  id: number;
  property_title: string;
  property_image?: string;
  rating: number;
  comment: string;
  created_at?: string;
}

interface Stats {
  saved: number;
  viewed: number;
  inquiries: number;
}

interface UserData {
  id: string | number | null;
  name: string;
  email: string;
}

/* =========================================================
   CONFIG
========================================================= */

const API_URL = "http://localhost:5001";

/* =========================================================
   HELPERS
========================================================= */

const getToken = (): string | null => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt") ||
    null
  );
};

const getUserData = (): UserData => {
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return {
        id: user.id || user._id || null,
        name: user.name || user.full_name || "Customer",
        email: user.email || "",
      };
    }
  } catch {
    // ignore parse errors
  }

  const rawId = localStorage.getItem("userId");
  return {
    id: rawId && rawId !== "null" && rawId !== "undefined" ? rawId : null,
    name: localStorage.getItem("name") || "Customer",
    email: localStorage.getItem("email") || "",
  };
};

const renderStars = (rating: number): string =>
  "★".repeat(Math.max(0, Math.min(5, Math.round(rating)))) +
  "☆".repeat(Math.max(0, 5 - Math.round(rating)));

/* =========================================================
   COMPONENT
========================================================= */

const CustomerDashboard: React.FC = () => {
  const user = getUserData();
  const userId = user.id;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats>({
    saved: 0,
    viewed: 0,
    inquiries: 0,
  });
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* -------------------------------------------------------
     FETCH DATA
  ------------------------------------------------------- */

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoadingReviews(false);
      setLoadingStats(false);
      setError("Please log in to view your dashboard.");
      return;
    }

    const token = getToken();

    if (!token) {
      setLoadingReviews(false);
      setLoadingStats(false);
      setError("Authentication token missing. Please log in again.");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      setLoadingReviews(true);
      setLoadingStats(true);
      setError(null);

      const [reviewsRes, favoritesRes, viewsRes, inquiriesRes] =
        await Promise.all([
          fetch(`${API_URL}/api/reviews/user/${userId}`, { headers }),
          fetch(`${API_URL}/api/favorites/count/${userId}`, { headers }),
          fetch(`${API_URL}/api/views/count/${userId}`, { headers }),
          fetch(`${API_URL}/api/inquiries/count/${userId}`, { headers }),
        ]);

      // ---------- Reviews ----------
      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        const list = Array.isArray(data)
          ? data
          : data?.data || data?.reviews || [];
        setReviews(list);
      } else {
        console.warn("Reviews failed:", reviewsRes.status);
        setReviews([]);
      }

      // ---------- Stats helper ----------
      const getCount = async (res: Response): Promise<number> => {
        if (!res.ok) {
          console.warn(`Count request failed: ${res.status} ${res.url}`);
          return 0;
        }
        const json = await res.json();
        return Number(json.count ?? 0);
      };

      const [saved, viewed, inquiries] = await Promise.all([
        getCount(favoritesRes),
        getCount(viewsRes),
        getCount(inquiriesRes),
      ]);

      setStats({ saved, viewed, inquiries });
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setReviews([]);
      setStats({ saved: 0, viewed: 0, inquiries: 0 });
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoadingReviews(false);
      setLoadingStats(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchData();
    event.detail.complete();
  };

  /* -------------------------------------------------------
     SKELETON
  ------------------------------------------------------- */

  const StatSkeleton = () => (
    <IonCard className="stat-card">
      <IonCardContent className="stat-content">
        <IonSkeletonText
          animated
          style={{ width: 28, height: 28, margin: "0 auto 8px" }}
        />
        <IonSkeletonText
          animated
          style={{ width: 40, height: 24, margin: "0 auto 4px" }}
        />
        <IonSkeletonText
          animated
          style={{ width: 50, height: 14, margin: "0 auto" }}
        />
      </IonCardContent>
    </IonCard>
  );

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <IonPage>
      <IonHeader className="dashboard-header">
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>My Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* ========== WELCOME ========== */}
        <div className="welcome-banner">
          <div className="welcome-inner">
            <IonAvatar className="welcome-avatar">
              <div className="avatar-fallback">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </IonAvatar>

            <div>
              <h2 className="welcome-title">Welcome back, {user.name}</h2>
              <p className="welcome-subtitle">
                Manage your activity, saved homes & reviews
              </p>
            </div>
          </div>
        </div>

        <IonGrid className="ion-padding dashboard-grid">
          {/* Error banner */}
          {error && (
            <IonRow>
              <IonCol size="12">
                <div className="error-banner">
                  <IonText color="danger">{error}</IonText>
                </div>
              </IonCol>
            </IonRow>
          )}

          {/* ========== STATS ========== */}
          <IonRow>
            <IonCol size="6" sizeMd="3">
              {loadingStats ? (
                <StatSkeleton />
              ) : (
                <IonCard className="stat-card">
                  <IonCardContent className="stat-content">
                    <IonIcon
                      icon={heartOutline}
                      className="stat-icon"
                      style={{ color: "#e11d48" }}
                    />
                    <h2 className="stat-value">{stats.saved}</h2>
                    <IonText color="medium" className="stat-label">
                      Saved
                    </IonText>
                  </IonCardContent>
                </IonCard>
              )}
            </IonCol>

            <IonCol size="6" sizeMd="3">
              {loadingStats ? (
                <StatSkeleton />
              ) : (
                <IonCard className="stat-card">
                  <IonCardContent className="stat-content">
                    <IonIcon
                      icon={timeOutline}
                      className="stat-icon"
                      style={{ color: "#2563eb" }}
                    />
                    <h2 className="stat-value">{stats.viewed}</h2>
                    <IonText color="medium" className="stat-label">
                      Viewed
                    </IonText>
                  </IonCardContent>
                </IonCard>
              )}
            </IonCol>

            <IonCol size="6" sizeMd="3">
              {loadingStats ? (
                <StatSkeleton />
              ) : (
                <IonCard className="stat-card">
                  <IonCardContent className="stat-content">
                    <IonIcon
                      icon={chatbubbleOutline}
                      className="stat-icon"
                      style={{ color: "#7c3aed" }}
                    />
                    <h2 className="stat-value">{stats.inquiries}</h2>
                    <IonText color="medium" className="stat-label">
                      Inquiries
                    </IonText>
                  </IonCardContent>
                </IonCard>
              )}
            </IonCol>

            <IonCol size="6" sizeMd="3">
              {loadingStats ? (
                <StatSkeleton />
              ) : (
                <IonCard className="stat-card">
                  <IonCardContent className="stat-content">
                    <IonIcon
                      icon={starOutline}
                      className="stat-icon"
                      style={{ color: "#f59e0b" }}
                    />
                    <h2 className="stat-value">{reviews.length}</h2>
                    <IonText color="medium" className="stat-label">
                      Reviews
                    </IonText>
                  </IonCardContent>
                </IonCard>
              )}
            </IonCol>
          </IonRow>

          {/* ========== QUICK ACTIONS ========== */}
          <IonRow className="ion-margin-top">
            <IonCol size="12">
              <h3 className="section-title">Quick Actions</h3>
            </IonCol>

            <IonCol size="6">
              <IonButton
                expand="block"
                fill="outline"
                routerLink="/customer/properties"
                className="action-btn"
              >
                <IonIcon icon={homeOutline} slot="start" />
                Browse Homes
              </IonButton>
            </IonCol>

            <IonCol size="6">
              <IonButton
                expand="block"
                fill="outline"
                routerLink="/customer/favorites"
                className="action-btn"
              >
                <IonIcon icon={heartOutline} slot="start" />
                My Favorites
              </IonButton>
            </IonCol>
          </IonRow>

          {/* ========== MY REVIEWS ========== */}
          <IonRow className="ion-margin-top">
            <IonCol size="12">
              <IonCard className="section-card">
                <IonCardContent>
                  <div className="section-header">
                    <h3 className="section-title" style={{ margin: 0 }}>
                      My Reviews
                    </h3>

                    {reviews.length > 3 && (
                      <IonButton
                        fill="clear"
                        size="small"
                        routerLink="/customer/reviews"
                      >
                        View All
                        <IonIcon icon={chevronForwardOutline} slot="end" />
                      </IonButton>
                    )}
                  </div>

                  {loadingReviews ? (
                    <div className="review-skeleton-list">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="review-skeleton">
                          <IonSkeletonText
                            animated
                            style={{ width: "70%", height: 16 }}
                          />
                          <IonSkeletonText
                            animated
                            style={{
                              width: "40%",
                              height: 14,
                              marginTop: 8,
                            }}
                          />
                          <IonSkeletonText
                            animated
                            style={{
                              width: "90%",
                              height: 14,
                              marginTop: 8,
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : !userId ? (
                    <div className="empty-block">
                      <IonText color="medium">
                        Please log in to view your reviews.
                      </IonText>
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="empty-block">
                      <IonIcon icon={starOutline} className="empty-icon" />
                      <p>You haven’t written any reviews yet.</p>
                      <IonButton size="small" routerLink="/customer/properties">
                        Browse Properties
                      </IonButton>
                    </div>
                  ) : (
                    <IonList lines="none" className="review-list">
                      {reviews.slice(0, 3).map((review) => (
                        <IonItem key={review.id} className="review-item">
                          <IonLabel>
                            <h3 className="review-title">
                              {review.property_title || "Property"}
                            </h3>
                            <p className="review-stars">
                              {renderStars(review.rating)}
                            </p>
                            <p className="review-comment">
                              {review.comment
                                ? review.comment.length > 80
                                  ? `${review.comment.slice(0, 80)}…`
                                  : review.comment
                                : "No comment"}
                            </p>
                            {review.created_at && (
                              <IonNote className="review-date">
                                {new Date(
                                  review.created_at
                                ).toLocaleDateString()}
                              </IonNote>
                            )}
                          </IonLabel>
                        </IonItem>
                      ))}
                    </IonList>
                  )}
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          {/* ========== ACCOUNT ========== */}
          <IonRow className="ion-margin-top">
            <IonCol size="12">
              <IonCard className="section-card">
                <IonCardContent>
                  <div className="account-row">
                    <div className="account-icon-wrap">
                      <IonIcon
                        icon={personOutline}
                        className="account-icon"
                      />
                    </div>

                    <div className="account-text">
                      <h3>Account Settings</h3>
                      <p>Manage your profile and preferences</p>
                    </div>
                  </div>

                  <div className="account-actions">
                    <IonButton
                      expand="block"
                      fill="outline"
                      routerLink="/customer/profile"
                    >
                      Edit Profile
                    </IonButton>

                    <IonButton
                      expand="block"
                      fill="clear"
                      routerLink="/customer/settings"
                    >
                      <IonIcon icon={settingsOutline} slot="icon-only" />
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          <div style={{ height: 24 }} />
        </IonGrid>
      </IonContent>

      <style>{`
        .dashboard-header {
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        }

        /* Welcome */
        .welcome-banner {
          padding: 28px 20px 32px;
          background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
          color: #fff;
        }

        .welcome-inner {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .welcome-avatar {
          width: 64px;
          height: 64px;
          border: 3px solid rgba(255, 255, 255, 0.3);
        }

        .avatar-fallback {
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 600;
        }

        .welcome-title {
          margin: 0 0 4px;
          font-size: 1.45rem;
          font-weight: 600;
        }

        .welcome-subtitle {
          margin: 0;
          opacity: 0.9;
          font-size: 0.95rem;
        }

        /* Error */
        .error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 8px;
          text-align: center;
        }

        /* Stats */
        .stat-card {
          margin: 0;
          border-radius: 14px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .stat-content {
          text-align: center;
          padding: 16px 8px;
        }

        .stat-icon {
          font-size: 28px;
        }

        .stat-value {
          margin: 8px 0 2px;
          font-size: 1.55rem;
          font-weight: 700;
        }

        .stat-label {
          font-size: 0.85rem;
        }

        /* Sections */
        .section-title {
          margin: 8px 0 12px;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .section-card {
          border-radius: 14px;
          margin: 0;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .action-btn {
          height: 48px;
        }

        /* Reviews */
        .review-list {
          background: transparent;
        }

        .review-item {
          --background: #f8fafc;
          border-radius: 10px;
          margin-bottom: 10px;
        }

        .review-title {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .review-stars {
          color: #f59e0b;
          font-size: 0.95rem;
          margin: 0 0 4px;
        }

        .review-comment {
          color: #475569;
          font-size: 0.9rem;
          margin: 0;
        }

        .review-date {
          font-size: 0.8rem;
          margin-top: 4px;
          display: block;
        }

        .review-skeleton-list {
          padding: 4px 0;
        }

        .review-skeleton {
          background: #f8fafc;
          border-radius: 10px;
          padding: 14px;
          margin-bottom: 10px;
        }

        .empty-block {
          text-align: center;
          padding: 24px 0;
        }

        .empty-block p {
          color: #64748b;
          margin: 0 0 16px;
        }

        .empty-icon {
          font-size: 42px;
          color: #cbd5e1;
          margin-bottom: 8px;
        }

        /* Account */
        .account-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .account-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #eff6ff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .account-icon {
          font-size: 24px;
          color: #2563eb;
        }

        .account-text h3 {
          margin: 0 0 2px;
          font-weight: 600;
        }

        .account-text p {
          margin: 0;
          color: #64748b;
          font-size: 0.9rem;
        }

        .account-actions {
          display: flex;
          gap: 10px;
          margin-top: 18px;
        }

        /* Desktop */
        @media (min-width: 768px) {
          .dashboard-grid {
            max-width: 900px;
            margin: 0 auto;
          }

          .welcome-banner {
            padding-left: calc((100% - 900px) / 2 + 20px);
            padding-right: calc((100% - 900px) / 2 + 20px);
          }
        }
      `}</style>
    </IonPage>
  );
};

export default CustomerDashboard;