import React, { useCallback, useEffect, useState } from "react";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonButton,
  IonButtons,
  IonMenuButton,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonText,
  useIonRouter,
  useIonToast,
} from "@ionic/react";

import {
  addCircleOutline,
  arrowForwardOutline,
  businessOutline,
  calendarOutline,
  checkmarkCircleOutline,
  chevronForwardOutline,
  closeCircleOutline,
  homeOutline,
  listOutline,
  logOutOutline,
  refreshOutline,
  settingsOutline,
  timeOutline,
} from "ionicons/icons";

/* =========================================================
   CONFIG
========================================================= */

const API_URL = "http://localhost:5001";
const LOGO_URL = "/assets/malo.png";
const HERO_BG_URL = "/assets/nice.jpg";

/* =========================================================
   TYPES
========================================================= */

interface User {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
}

interface DashboardStats {
  properties: number;
  activeProperties: number;
  bookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  rejectedBookings: number;
}

interface RecentBooking {
  id: number;
  customer_name?: string;
  customer_email?: string;
  property_title?: string;
  status?: string;
  created_at?: string;
}

interface RecentProperty {
  id: number;
  title?: string;
  location?: string;
  price?: number | string;
  status?: string;
  created_at?: string;
}

interface DashboardResponse {
  success?: boolean;
  stats?: Partial<DashboardStats>;
  recentBookings?: RecentBooking[];
  recentProperties?: RecentProperty[];
  error?: string;
  message?: string;
}

/* =========================================================
   DEFAULTS & HELPERS
========================================================= */

const DEFAULT_STATS: DashboardStats = {
  properties: 0,
  activeProperties: 0,
  bookings: 0,
  pendingBookings: 0,
  confirmedBookings: 0,
  rejectedBookings: 0,
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat().format(value);

const formatDate = (dateValue?: string) => {
  if (!dateValue) return "Recently";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatPrice = (value?: number | string) => {
  if (value === undefined || value === null || value === "") {
    return "Price unavailable";
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return `MWK ${new Intl.NumberFormat().format(numeric)}`;
};

const getStatusColor = (
  status?: string
): "success" | "warning" | "danger" | "medium" => {
  const s = status?.toLowerCase();
  if (s === "confirmed" || s === "approved" || s === "active") return "success";
  if (s === "pending" || s === "processing") return "warning";
  if (s === "rejected" || s === "cancelled" || s === "inactive") return "danger";
  return "medium";
};

const formatStatus = (status?: string) => {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getInitials = (name?: string) => {
  if (!name) return "A";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/* =========================================================
   COMPONENT
========================================================= */

export default function Dashboard() {
  const router = useIonRouter();
  const [presentToast] = useIonToast();

  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [recentProperties, setRecentProperties] = useState<RecentProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const showToast = useCallback(
    async (
      message: string,
      color: "success" | "danger" | "warning" | "medium" = "medium"
    ) => {
      await presentToast({
        message,
        color,
        duration: 2800,
        position: "bottom",
      });
    },
    [presentToast]
  );

  /* ---------- LOAD USER ---------- */

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedRole = localStorage.getItem("role");

    if (!storedUser || !token) {
      router.push("/login", "root", "replace");
      return;
    }

    if (storedRole !== "agent" && storedRole !== "landlord") {
      router.push("/login", "root", "replace");
      return;
    }

    try {
      const parsed: User = JSON.parse(storedUser);
      setUser({
        ...parsed,
        role: parsed.role || storedRole,
      });
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("token");
      router.push("/login", "root", "replace");
    }
  }, [router, token]);

  /* ---------- FETCH DASHBOARD ---------- */

  const fetchDashboard = useCallback(
    async (showLoader = true) => {
      if (!token) {
        router.push("/login", "root", "replace");
        return;
      }

      try {
        setError("");
        if (showLoader) setLoading(true);

        const response = await fetch(`${API_URL}/api/agent/dashboard`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("role");
          await showToast(
            "Your session has expired. Please login again.",
            "danger"
          );
          router.push("/login", "root", "replace");
          return;
        }

        let data: DashboardResponse;
        try {
          data = await response.json();
        } catch {
          throw new Error("The server returned an invalid response.");
        }

        if (!response.ok || data.success === false) {
          throw new Error(
            data.error || data.message || "Unable to load dashboard."
          );
        }

        const serverStats = data.stats || {};

        setStats({
          properties: Number(serverStats.properties) || 0,
          activeProperties: Number(serverStats.activeProperties) || 0,
          bookings: Number(serverStats.bookings) || 0,
          pendingBookings: Number(serverStats.pendingBookings) || 0,
          confirmedBookings: Number(serverStats.confirmedBookings) || 0,
          rejectedBookings: Number(serverStats.rejectedBookings) || 0,
        });

        setRecentBookings(
          Array.isArray(data.recentBookings) ? data.recentBookings : []
        );
        setRecentProperties(
          Array.isArray(data.recentProperties) ? data.recentProperties : []
        );
      } catch (err: any) {
        console.error("DASHBOARD ERROR:", err);
        setError(err?.message || "Unable to load dashboard information.");
      } finally {
        setLoading(false);
      }
    },
    [router, showToast, token]
  );

  useEffect(() => {
    fetchDashboard(true);
  }, [fetchDashboard]);

  /* ---------- REFRESH ---------- */

  const handleRefresh = async (event: CustomEvent) => {
    setRefreshing(true);
    try {
      await fetchDashboard(false);
    } finally {
      setRefreshing(false);
      event.detail.complete();
    }
  };

  /* ---------- LOGOUT ---------- */

  const logout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    await showToast("You have been logged out.", "success");
    router.push("/login", "root", "replace");
  };

  const goTo = (path: string) => router.push(path);

  const roleName =
    user?.role === "landlord" ? "Landlord Portal" : "Agent Portal";

  /* ---------- RENDER ---------- */

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton color="light" />
          </IonButtons>
          <IonTitle>Dashboard</IonTitle>
          <IonButtons slot="end">
            <IonButton
              color="light"
              fill="clear"
              onClick={() => fetchDashboard(true)}
              disabled={loading || refreshing}
            >
              <IonIcon icon={refreshOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingText="Pull to refresh"
            refreshingText="Refreshing dashboard..."
          />
        </IonRefresher>

        {/* ========== HERO BANNER ========== */}
        <div className="welcome-banner">
          <div className="welcome-overlay" />

          <div className="welcome-inner">
            {/* Left side */}
            <div className="welcome-text">
              <div className="welcome-avatar">
                <div className="avatar-fallback">
                  {getInitials(user?.name)}
                </div>
              </div>

              <div>
                <div className="welcome-role">{roleName}</div>
                <h2 className="welcome-title">
                  Welcome back{user?.name ? `, ${user.name}` : ""}
                </h2>
                <p className="welcome-subtitle">
                  Manage your properties, bookings and customer activity from
                  one place.
                </p>

                <div className="welcome-actions">
                  <IonButton
                    color="light"
                    size="small"
                    onClick={() => goTo("/agent/add-property")}
                  >
                    <IonIcon icon={addCircleOutline} slot="start" />
                    Add Property
                  </IonButton>
                  <IonButton
                    color="light"
                    fill="outline"
                    size="small"
                    onClick={logout}
                  >
                    <IonIcon icon={logOutOutline} slot="start" />
                    Logout
                  </IonButton>
                </div>
              </div>
            </div>

            {/* Right side - Logo */}
            <img
              src={LOGO_URL}
              alt="MaloHub"
              className="welcome-logo"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        </div>

        {/* ========== CONTENT ========== */}
        <div className="dashboard-content">
          {/* Error */}
          {error && (
            <IonCard className="error-card">
              <IonCardContent>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <IonIcon
                    icon={closeCircleOutline}
                    style={{ fontSize: 24, color: "#dc2626" }}
                  />
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: "#991b1b" }}>
                      Unable to load dashboard
                    </strong>
                    <p
                      style={{
                        margin: "5px 0 12px",
                        color: "#7f1d1d",
                        fontSize: 13,
                      }}
                    >
                      {error}
                    </p>
                    <IonButton
                      size="small"
                      fill="outline"
                      color="danger"
                      onClick={() => fetchDashboard(true)}
                    >
                      Try Again
                    </IonButton>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {loading ? (
            <div className="loading-block">
              <IonSpinner name="crescent" />
              <IonText color="medium">Loading dashboard...</IonText>
            </div>
          ) : (
            <>
              {/* Stats */}
              <h2 className="section-title">Overview</h2>
              <IonGrid className="stats-grid">
                <IonRow>
                  <IonCol size="6" sizeMd="3">
                    <StatCard
                      icon={businessOutline}
                      iconBg="#eff6ff"
                      iconColor="#2563eb"
                      value={stats.properties}
                      label="Properties"
                    />
                  </IonCol>
                  <IonCol size="6" sizeMd="3">
                    <StatCard
                      icon={checkmarkCircleOutline}
                      iconBg="#ecfdf5"
                      iconColor="#059669"
                      value={stats.activeProperties}
                      label="Active Listings"
                    />
                  </IonCol>
                  <IonCol size="6" sizeMd="3">
                    <StatCard
                      icon={calendarOutline}
                      iconBg="#f5f3ff"
                      iconColor="#7c3aed"
                      value={stats.bookings}
                      label="Total Bookings"
                    />
                  </IonCol>
                  <IonCol size="6" sizeMd="3">
                    <StatCard
                      icon={timeOutline}
                      iconBg="#fffbeb"
                      iconColor="#d97706"
                      value={stats.pendingBookings}
                      label="Pending"
                    />
                  </IonCol>
                </IonRow>
              </IonGrid>

              {/* Quick Actions */}
              <h2 className="section-title">Quick Actions</h2>
              <IonGrid className="actions-grid">
                <IonRow>
                  <IonCol size="12" sizeSm="6">
                    <ActionCard
                      icon={addCircleOutline}
                      iconBg="#eff6ff"
                      iconColor="#2563eb"
                      title="Add Property"
                      description="Create a new listing"
                      onClick={() => goTo("/agent/add-property")}
                    />
                  </IonCol>
                  <IonCol size="12" sizeSm="6">
                    <ActionCard
                      icon={homeOutline}
                      iconBg="#ecfdf5"
                      iconColor="#059669"
                      title="My Properties"
                      description="Manage your listings"
                      onClick={() => goTo("/agent/properties")}
                    />
                  </IonCol>
                  <IonCol size="12" sizeSm="6">
                    <ActionCard
                      icon={listOutline}
                      iconBg="#f5f3ff"
                      iconColor="#7c3aed"
                      title="Bookings"
                      description="Manage customer bookings"
                      onClick={() => goTo("/agent/bookings")}
                    />
                  </IonCol>
                  <IonCol size="12" sizeSm="6">
                    <ActionCard
                      icon={settingsOutline}
                      iconBg="#f1f5f9"
                      iconColor="#475569"
                      title="Settings"
                      description="Manage your account"
                      onClick={() => goTo("/agent/settings")}
                    />
                  </IonCol>
                </IonRow>
              </IonGrid>

              {/* Recent Bookings */}
              <SectionHeader
                title="Recent Bookings"
                onViewAll={() => goTo("/agent/bookings")}
              />

              <IonCard className="section-card">
                {recentBookings.length === 0 ? (
                  <EmptyState
                    icon={calendarOutline}
                    message="No recent bookings."
                  />
                ) : (
                  <IonList lines="full">
                    {recentBookings.slice(0, 5).map((booking) => (
                      <IonItem key={booking.id}>
                        <IonIcon
                          icon={calendarOutline}
                          slot="start"
                          color="primary"
                        />
                        <IonLabel>
                          <h3>{booking.customer_name || "Customer"}</h3>
                          <p>{booking.property_title || "Property"}</p>
                          <p style={{ fontSize: 11 }}>
                            {formatDate(booking.created_at)}
                          </p>
                        </IonLabel>
                        <IonBadge
                          slot="end"
                          color={getStatusColor(booking.status)}
                        >
                          {formatStatus(booking.status)}
                        </IonBadge>
                      </IonItem>
                    ))}
                  </IonList>
                )}
              </IonCard>

              {/* Recent Properties */}
              <SectionHeader
                title="Recent Properties"
                onViewAll={() => goTo("/agent/properties")}
              />

              <IonCard className="section-card" style={{ marginBottom: 30 }}>
                {recentProperties.length === 0 ? (
                  <EmptyState
                    icon={businessOutline}
                    message="You haven't added any properties yet."
                    actionLabel="Add Property"
                    onAction={() => goTo("/agent/add-property")}
                  />
                ) : (
                  <IonList lines="full">
                    {recentProperties.slice(0, 5).map((property) => (
                      <IonItem
                        key={property.id}
                        button
                        onClick={() => goTo("/agent/properties")}
                      >
                        <IonIcon
                          icon={homeOutline}
                          slot="start"
                          color="primary"
                        />
                        <IonLabel>
                          <h3>{property.title || "Property"}</h3>
                          <p>{property.location || "Location unavailable"}</p>
                          <p>{formatPrice(property.price)}</p>
                        </IonLabel>
                        <IonBadge
                          slot="end"
                          color={getStatusColor(property.status)}
                        >
                          {formatStatus(property.status)}
                        </IonBadge>
                      </IonItem>
                    ))}
                  </IonList>
                )}
              </IonCard>
            </>
          )}
        </div>
      </IonContent>

      {/* ========== STYLES ========== */}
      <style>{`
        /* ========== Welcome Banner ========== */
        .welcome-banner {
          position: relative;
          min-height: 300px;
          padding: 48px 24px 56px;
          color: #fff;
          overflow: hidden;
          background-image: url('${HERO_BG_URL}');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          display: flex;
          align-items: center;
        }

        .welcome-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.50),
            rgba(0, 0, 0, 0.68)
          );
          z-index: 1;
        }

        .welcome-inner {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          width: 100%;
        }

        .welcome-text {
          display: flex;
          align-items: flex-start;
          gap: 18px;
          flex: 1;
          min-width: 0;
        }

        .welcome-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          border: 3px solid rgba(255, 255, 255, 0.38);
          flex-shrink: 0;
          overflow: hidden;
        }

        .avatar-fallback {
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 700;
        }

        .welcome-role {
          font-size: 13px;
          opacity: 0.9;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .welcome-title {
          margin: 0 0 6px;
          font-size: 1.55rem;
          font-weight: 700;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
          line-height: 1.25;
        }

        .welcome-subtitle {
          margin: 0 0 16px;
          opacity: 0.95;
          font-size: 1rem;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
        }

        .welcome-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .welcome-logo {
          height: 105px;
          width: auto;
          max-width: 300px;
          object-fit: contain;
          border-radius: 16px;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
          flex-shrink: 0;
        }

        /* ========== Content ========== */
        .dashboard-content {
          padding: 20px 16px 40px;
          background: #f5f7fb;
        }

        .section-title {
          margin: 18px 0 12px;
          font-size: 18px;
          font-weight: 750;
          color: #111827;
        }

        .stats-grid,
        .actions-grid {
          padding: 0;
        }

        .error-card {
          margin: 0 0 16px;
          border-radius: 16px;
          border: 1px solid #fecaca;
          background: #fff7f7;
        }

        .loading-block {
          min-height: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 12px;
        }

        .section-card {
          margin: 0 0 8px;
          border-radius: 17px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
        }

        /* ========== Desktop ========== */
        @media (min-width: 768px) {
          .welcome-banner {
            min-height: 360px;
            padding: 64px 24px 72px;
          }

          .welcome-logo {
            height: 130px;
            max-width: 340px;
          }

          .welcome-title {
            font-size: 1.8rem;
          }

          .welcome-avatar {
            width: 80px;
            height: 80px;
          }

          .dashboard-content {
            max-width: 960px;
            margin: 0 auto;
          }
        }

        /* ========== Mobile ========== */
        @media (max-width: 600px) {
          .welcome-banner {
            min-height: 260px;
            padding: 36px 18px 44px;
          }

          .welcome-inner {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
          }

          .welcome-logo {
            height: 82px;
            max-width: 200px;
            align-self: flex-end;
          }

          .welcome-title {
            font-size: 1.3rem;
          }

          .welcome-subtitle {
            font-size: 0.92rem;
          }

          .welcome-avatar {
            width: 60px;
            height: 60px;
          }
        }
      `}</style>
    </IonPage>
  );
}

/* =========================================================
   SMALL REUSABLE COMPONENTS
========================================================= */

const StatCard: React.FC<{
  icon: string;
  iconBg: string;
  iconColor: string;
  value: number;
  label: string;
}> = ({ icon, iconBg, iconColor, value, label }) => (
  <IonCard
    style={{
      margin: 6,
      borderRadius: 17,
      boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
    }}
  >
    <IonCardContent style={{ padding: "17px 13px" }}>
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IonIcon icon={icon} style={{ fontSize: 22, color: iconColor }} />
      </div>
      <h2 style={{ margin: "13px 0 3px", fontSize: 24, fontWeight: 800 }}>
        {formatNumber(value)}
      </h2>
      <p style={{ margin: 0, color: "#6b7280", fontSize: 12 }}>{label}</p>
    </IonCardContent>
  </IonCard>
);

const ActionCard: React.FC<{
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  onClick: () => void;
}> = ({ icon, iconBg, iconColor, title, description, onClick }) => (
  <IonCard button onClick={onClick} style={{ margin: 6, borderRadius: 17 }}>
    <IonCardContent>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IonIcon icon={icon} style={{ fontSize: 25, color: iconColor }} />
        </div>
        <div style={{ flex: 1 }}>
          <strong>{title}</strong>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 12 }}>
            {description}
          </p>
        </div>
        <IonIcon icon={chevronForwardOutline} color="medium" />
      </div>
    </IonCardContent>
  </IonCard>
);

const SectionHeader: React.FC<{
  title: string;
  onViewAll: () => void;
}> = ({ title, onViewAll }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      margin: "18px 0 12px",
    }}
  >
    <h2
      style={{
        margin: 0,
        fontSize: 18,
        fontWeight: 750,
        color: "#111827",
      }}
    >
      {title}
    </h2>
    <IonButton fill="clear" size="small" onClick={onViewAll}>
      View All
      <IonIcon icon={arrowForwardOutline} slot="end" />
    </IonButton>
  </div>
);

const EmptyState: React.FC<{
  icon: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ icon, message, actionLabel, onAction }) => (
  <IonCardContent style={{ textAlign: "center", padding: "30px 20px" }}>
    <IonIcon icon={icon} style={{ fontSize: 38, color: "#94a3b8" }} />
    <p style={{ margin: "10px 0 15px", color: "#64748b" }}>{message}</p>
    {actionLabel && onAction && (
      <IonButton size="small" onClick={onAction}>
        <IonIcon icon={addCircleOutline} slot="start" />
        {actionLabel}
      </IonButton>
    )}
  </IonCardContent>
);