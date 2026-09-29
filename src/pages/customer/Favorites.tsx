import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonBadge,
  IonSpinner,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonText,
  IonChip,
  IonButtons,
  IonBackButton,
  IonRefresher,
  IonRefresherContent,
  IonToast,
  RefresherEventDetail,
} from "@ionic/react";
import { useIonRouter } from "@ionic/react";
import {
  heart,
  heartOutline,
  eyeOutline,
  trashOutline,
  locationOutline,
  refreshOutline,
  imageOutline,
  homeOutline,
} from "ionicons/icons";

/* =========================================================
   TYPES
========================================================= */

interface FavoriteProperty {
  id: number;
  title: string;
  location: string;
  price: number | string;
  listing_type: "sale" | "rent";
  image?: string | null;
  property_type?: string;
  size_value?: string | number;
}

/* =========================================================
   CONFIG
========================================================= */

const API_BASE = "http://localhost:5001";

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='180'%3E%3Crect fill='%23e5e7eb' width='240' height='180'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

/* =========================================================
   HELPERS
========================================================= */

const getImageUrl = (image?: string | null): string => {
  if (!image) return PLACEHOLDER;

  if (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("data:")) {
    return image;
  }

  if (image.startsWith("/uploads") || image.startsWith("uploads/")) {
    return `${API_BASE}${image.startsWith("/") ? "" : "/"}${image}`;
  }

  if (image.startsWith("houses/") || image.startsWith("properties/")) {
    return `${API_BASE}/uploads/${image}`;
  }

  return `${API_BASE}/uploads/houses/${image}`;
};

const formatPrice = (price: number | string): string => {
  const num = Number(price);
  if (isNaN(num)) return "—";
  return `K ${num.toLocaleString()}`;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function Favorites() {
  const router = useIonRouter();

  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  /* -------------------------------------------------------
     FETCH
  ------------------------------------------------------- */

  const fetchFavorites = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please log in to view your favorites.");
        setFavorites([]);
        return;
      }

      const res = await fetch(`${API_BASE}/api/favorites`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Failed to load favorites");
      }

      setFavorites(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Favorites Error:", err);
      setError(err?.message || "Unable to load favorites.");
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  /* -------------------------------------------------------
     PULL TO REFRESH
  ------------------------------------------------------- */

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchFavorites(false);
    event.detail.complete();
  };

  /* -------------------------------------------------------
     REMOVE
  ------------------------------------------------------- */

  const removeFavorite = async (propertyId: number) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setToastMessage("Please log in again.");
      return;
    }

    if (removingId === propertyId) return;

    const previous = favorites;
    // Optimistic update
    setFavorites((prev) => prev.filter((item) => item.id !== propertyId));
    setRemovingId(propertyId);

    try {
      const res = await fetch(`${API_BASE}/api/favorites/${propertyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Failed to remove favorite");
      }

      setToastMessage("Removed from favorites");
    } catch (err: any) {
      console.error(err);
      // Rollback
      setFavorites(previous);
      setToastMessage(err?.message || "Failed to remove favorite");
    } finally {
      setRemovingId(null);
    }
  };

  /* -------------------------------------------------------
     NAVIGATION
  ------------------------------------------------------- */

  const goToProperty = (id: number) => {
    router.push(`/property/${id}`, "forward");
  };

  /* -------------------------------------------------------
     FILTER
  ------------------------------------------------------- */

  const filteredFavorites = useMemo(() => {
    if (!searchTerm.trim()) return favorites;

    const term = searchTerm.toLowerCase().trim();

    return favorites.filter((property) =>
      [property.title, property.location, property.property_type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [favorites, searchTerm]);

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/customer" />
          </IonButtons>

          <IonTitle>
            Favorites
            {favorites.length > 0 && (
              <IonBadge
                color="light"
                style={{
                  marginLeft: 10,
                  verticalAlign: "middle",
                  fontSize: 12,
                }}
              >
                {favorites.length}
              </IonBadge>
            )}
          </IonTitle>

          <IonButtons slot="end">
            <IonButton onClick={() => fetchFavorites()} title="Refresh">
              <IonIcon icon={refreshOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div style={{ padding: "12px 16px 0" }}>
          <IonSearchbar
            value={searchTerm}
            placeholder="Search by title, location or type..."
            onIonInput={(e) => setSearchTerm(e.detail.value || "")}
            debounce={250}
            showClearButton="focus"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div
            style={{
              minHeight: "50vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <IonSpinner name="crescent" />
            <IonText color="medium">
              <p style={{ margin: 0 }}>Loading your favorites...</p>
            </IonText>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ padding: 16 }}>
            <IonCard style={{ borderRadius: 14 }}>
              <IonCardContent style={{ textAlign: "center", padding: "32px 20px" }}>
                <IonIcon
                  icon={heartOutline}
                  style={{ fontSize: 48, opacity: 0.45, marginBottom: 12 }}
                />
                <IonText color="danger">
                  <p style={{ margin: "0 0 16px", fontSize: 15 }}>{error}</p>
                </IonText>
                <IonButton expand="block" onClick={() => fetchFavorites()}>
                  Try Again
                </IonButton>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredFavorites.length === 0 && (
          <div style={{ padding: 16 }}>
            <IonCard style={{ borderRadius: 14 }}>
              <IonCardContent style={{ textAlign: "center", padding: "40px 24px" }}>
                <IonIcon
                  icon={heartOutline}
                  style={{
                    fontSize: 64,
                    color: "var(--ion-color-medium)",
                    marginBottom: 12,
                  }}
                />
                <h2 style={{ margin: "0 0 8px", fontWeight: 700 }}>
                  {searchTerm.trim() ? "No matches found" : "No favorites yet"}
                </h2>
                <p style={{ margin: "0 0 20px", color: "var(--ion-color-medium)" }}>
                  {searchTerm.trim()
                    ? "Try a different search term."
                    : "Save properties you love and they’ll appear here."}
                </p>
                {!searchTerm.trim() && (
                  <IonButton routerLink="/properties" expand="block">
                    Browse Properties
                  </IonButton>
                )}
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* List */}
        {!loading && !error && filteredFavorites.length > 0 && (
          <div style={{ padding: "8px 16px 24px" }}>
            {filteredFavorites.map((property) => {
              const imageUrl = getImageUrl(property.image);

              return (
                <IonCard
                  key={property.id}
                  style={{
                    borderRadius: 16,
                    marginBottom: 14,
                    overflow: "hidden",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  }}
                >
                  <IonCardContent style={{ padding: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 14,
                        alignItems: "flex-start",
                      }}
                    >
                      {/* Thumbnail */}
                      <div
                        style={{
                          width: 112,
                          height: 96,
                          borderRadius: 12,
                          overflow: "hidden",
                          flexShrink: 0,
                          background: "var(--ion-color-light)",
                          position: "relative",
                        }}
                      >
                        <img
                          src={imageUrl}
                          alt={property.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== PLACEHOLDER) {
                              target.src = PLACEHOLDER;
                            }
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h2
                          style={{
                            margin: "0 0 6px",
                            fontSize: "1.05rem",
                            fontWeight: 700,
                            lineHeight: 1.3,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {property.title}
                        </h2>

                        <p
                          style={{
                            margin: "0 0 6px",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            color: "var(--ion-color-medium)",
                            fontSize: 13,
                          }}
                        >
                          <IonIcon icon={locationOutline} style={{ fontSize: 15 }} />
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {property.location}
                          </span>
                        </p>

                        <div
                          style={{
                            fontSize: "1.15rem",
                            fontWeight: 700,
                            color: "var(--ion-color-primary)",
                            marginBottom: 8,
                          }}
                        >
                          {formatPrice(property.price)}
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          <IonChip
                            color={
                              property.listing_type === "sale" ? "success" : "warning"
                            }
                            style={{ height: 26, fontSize: 11, margin: 0 }}
                          >
                            {property.listing_type === "sale" ? "FOR SALE" : "FOR RENT"}
                          </IonChip>

                          {property.property_type && (
                            <IonChip
                              outline
                              color="medium"
                              style={{ height: 26, fontSize: 11, margin: 0 }}
                            >
                              {property.property_type}
                            </IonChip>
                          )}
                        </div>

                        {property.size_value && (
                          <p
                            style={{
                              margin: "8px 0 0",
                              fontSize: 12,
                              color: "var(--ion-color-medium)",
                            }}
                          >
                            Size: {property.size_value}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div
                      style={{
                        marginTop: 14,
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <IonButton
                        size="small"
                        onClick={() => goToProperty(property.id)}
                        style={{ flex: 1, minWidth: 120 }}
                      >
                        <IonIcon icon={eyeOutline} slot="start" />
                        View
                      </IonButton>

                      <IonButton
                        size="small"
                        color="danger"
                        fill="outline"
                        disabled={removingId === property.id}
                        onClick={() => removeFavorite(property.id)}
                        style={{ flex: 1, minWidth: 120 }}
                      >
                        {removingId === property.id ? (
                          <IonSpinner name="dots" style={{ width: 18, height: 18 }} />
                        ) : (
                          <>
                            <IonIcon icon={trashOutline} slot="start" />
                            Remove
                          </>
                        )}
                      </IonButton>
                    </div>
                  </IonCardContent>
                </IonCard>
              );
            })}
          </div>
        )}

        <IonToast
          isOpen={Boolean(toastMessage)}
          message={toastMessage}
          duration={2500}
          position="bottom"
          onDidDismiss={() => setToastMessage("")}
        />
      </IonContent>
    </IonPage>
  );
}