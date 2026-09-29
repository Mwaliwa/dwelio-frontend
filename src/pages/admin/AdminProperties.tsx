import React, { useCallback, useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonThumbnail,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonRefresher,
  IonRefresherContent,
  IonLoading,
  IonChip,
  IonText,
  IonButtons,
  useIonToast,
  useIonAlert,
  useIonRouter,
} from "@ionic/react";
import {
  homeOutline,
  locationOutline,
  cashOutline,
  trashOutline,
  eyeOutline,
  refreshOutline,
} from "ionicons/icons";

const API_URL = "http://localhost:5001";

interface Property {
  id: number;
  title: string;
  location?: string;
  price?: number;
  status?: string;
  property_type?: string;
  type?: string;
  image?: string;
  images?: string[];
  agent_name?: string;
  user_id?: number;
  created_at?: string;
}

export default function AdminProperties() {
  const router = useIonRouter();
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const token = localStorage.getItem("token");

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────
  const showError = useCallback(
    (message: string) => {
      presentToast({
        message,
        color: "danger",
        duration: 3200,
        position: "top",
      });
    },
    [presentToast]
  );

  const showSuccess = useCallback(
    (message: string) => {
      presentToast({
        message,
        color: "success",
        duration: 2500,
        position: "top",
      });
    },
    [presentToast]
  );

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "available":
        return "success";
      case "sold":
      case "rented":
        return "primary";
      case "pending":
        return "warning";
      case "unavailable":
        return "medium";
      default:
        return "medium";
    }
  };

  const formatPrice = (price?: number) => {
    if (price == null) return "N/A";
    return new Intl.NumberFormat("en-MW", {
      style: "currency",
      currency: "MWK",
      maximumFractionDigits: 0,
    }).format(price);
  };

  /** Build a usable image URL from backend storage paths */
  const getImageUrl = (property: Property): string | null => {
    // Prefer the parsed images array from the upgraded backend
    const first =
      (Array.isArray(property.images) && property.images[0]) ||
      property.image;

    if (!first) return null;

    // Already absolute
    if (first.startsWith("http://") || first.startsWith("https://")) {
      return first;
    }

    // Backend stores paths like "houses/filename.jpg"
    // Serve them from /uploads/...
    const clean = first.startsWith("/") ? first.slice(1) : first;
    return `${API_URL}/uploads/${clean}`;
  };

  // ─────────────────────────────────────────────
  // FETCH – uses public GET /api/properties
  // (admin can see everything; ownership is enforced on mutations)
  // ─────────────────────────────────────────────
  const fetchProperties = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        showError("Not authenticated. Please log in again.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        // Use the existing public list endpoint
        const res = await fetch(`${API_URL}/api/properties`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        const text = await res.text();
        let data: any = null;

        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          // server returned HTML or plain text
        }

        if (!res.ok) {
          const msg =
            data?.message ||
            data?.error ||
            `Request failed (${res.status})`;
          throw new Error(msg);
        }

        // Support both plain array and wrapped responses
        const list: Property[] = Array.isArray(data)
          ? data
          : data?.properties || data?.data || [];

        setProperties(list);
      } catch (err: any) {
        console.error("[AdminProperties] fetch error:", err);
        showError(err.message || "Failed to load properties");
        setProperties([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, showError]
  );

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // ─────────────────────────────────────────────
  // DELETE – uses DELETE /api/properties/:id
  // (owner OR admin – already handled by upgraded backend)
  // ─────────────────────────────────────────────
  const handleDelete = (property: Property) => {
    presentAlert({
      header: "Delete Property",
      message: `Are you sure you want to permanently delete "${property.title}"? This cannot be undone.`,
      buttons: [
        { text: "Cancel", role: "cancel" },
        {
          text: "Delete",
          role: "destructive",
          handler: async () => {
            try {
              const res = await fetch(
                `${API_URL}/api/properties/${property.id}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                  },
                }
              );

              const text = await res.text();
              let data: any = null;
              try {
                data = text ? JSON.parse(text) : null;
              } catch {
                // ignore parse errors
              }

              if (!res.ok) {
                throw new Error(
                  data?.message || data?.error || "Failed to delete property"
                );
              }

              showSuccess("Property deleted successfully");
              // Optimistic update
              setProperties((prev) =>
                prev.filter((p) => p.id !== property.id)
              );
            } catch (err: any) {
              showError(err.message || "Failed to delete property");
            }
          },
        },
      ],
    });
  };

  // ─────────────────────────────────────────────
  // TOGGLE STATUS – uses PUT /api/properties/:id
  // (sends only the status field; backend uses COALESCE)
  // ─────────────────────────────────────────────
  const handleToggleStatus = async (property: Property) => {
    const newStatus =
      property.status === "available" ? "unavailable" : "available";

    try {
      // Backend PUT expects multipart when files are present,
      // but for a simple status change JSON is fine (no files).
      const res = await fetch(`${API_URL}/api/properties/${property.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        // ignore
      }

      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || "Failed to update status"
        );
      }

      showSuccess(`Property marked as ${newStatus}`);

      // Optimistic update
      setProperties((prev) =>
        prev.map((p) =>
          p.id === property.id ? { ...p, status: newStatus } : p
        )
      );
    } catch (err: any) {
      showError(err.message || "Failed to update status");
    }
  };

  // ─────────────────────────────────────────────
  // Client-side filter (search + status)
  // ─────────────────────────────────────────────
  const filteredProperties = properties.filter((p) => {
    // Status filter
    if (statusFilter && p.status?.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }

    // Search filter
    const q = search.toLowerCase().trim();
    if (!q) return true;

    return (
      p.title?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q) ||
      p.agent_name?.toLowerCase().includes(q)
    );
  });

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Manage Properties</IonTitle>
          <IonButtons slot="end">
            <IonButton
              onClick={() => fetchProperties()}
              disabled={loading || refreshing}
            >
              <IonIcon icon={refreshOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>

        <IonToolbar>
          <IonSearchbar
            value={search}
            onIonInput={(e) => setSearch(e.detail.value || "")}
            placeholder="Search title, location or agent..."
            debounce={300}
            showClearButton="focus"
          />
        </IonToolbar>

        <IonToolbar>
          <div style={{ padding: "0 12px 10px" }}>
            <IonSelect
              value={statusFilter}
              placeholder="Filter by status"
              interface="popover"
              onIonChange={(e) => setStatusFilter(e.detail.value)}
            >
              <IonSelectOption value="">All Statuses</IonSelectOption>
              <IonSelectOption value="available">Available</IonSelectOption>
              <IonSelectOption value="pending">Pending</IonSelectOption>
              <IonSelectOption value="sold">Sold</IonSelectOption>
              <IonSelectOption value="rented">Rented</IonSelectOption>
              <IonSelectOption value="unavailable">Unavailable</IonSelectOption>
            </IonSelect>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher
          slot="fixed"
          onIonRefresh={async (e) => {
            await fetchProperties(true);
            e.detail.complete();
          }}
        >
          <IonRefresherContent />
        </IonRefresher>

        <IonLoading
          isOpen={loading && !refreshing}
          message="Loading properties..."
        />

        {!loading && filteredProperties.length === 0 && (
          <div
            style={{
              textAlign: "center",
              marginTop: 90,
              color: "var(--ion-color-medium)",
              padding: "0 24px",
            }}
          >
            <IonIcon
              icon={homeOutline}
              style={{ fontSize: 64, opacity: 0.5 }}
            />
            <p style={{ marginTop: 16, fontSize: 16 }}>
              {search || statusFilter
                ? "No properties match your filters"
                : "No properties found"}
            </p>
            {(search || statusFilter) && (
              <IonButton
                fill="outline"
                size="small"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                }}
                style={{ marginTop: 12 }}
              >
                Clear filters
              </IonButton>
            )}
          </div>
        )}

        {!loading && filteredProperties.length > 0 && (
          <IonList>
            {filteredProperties.map((property) => {
              const imgUrl = getImageUrl(property);

              return (
                <IonItem key={property.id} lines="full">
                  <IonThumbnail
                    slot="start"
                    style={{ width: 72, height: 72, marginRight: 12 }}
                  >
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={property.title}
                        style={{
                          objectFit: "cover",
                          borderRadius: 8,
                          width: "100%",
                          height: "100%",
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "var(--ion-color-light)",
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IonIcon
                          icon={homeOutline}
                          style={{ fontSize: 28, color: "#999" }}
                        />
                      </div>
                    )}
                  </IonThumbnail>

                  <IonLabel>
                    <h2
                      style={{
                        fontWeight: 600,
                        marginBottom: 4,
                        fontSize: 16,
                      }}
                    >
                      {property.title}
                    </h2>

                    {property.location && (
                      <p
                        style={{
                          margin: "2px 0",
                          fontSize: 13,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <IonIcon icon={locationOutline} />
                        {property.location}
                      </p>
                    )}

                    <p
                      style={{
                        margin: "2px 0",
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <IonIcon icon={cashOutline} />
                      {formatPrice(property.price)}
                    </p>

                    <div
                      style={{
                        marginTop: 8,
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <IonChip
                        color={getStatusColor(property.status)}
                        style={{ height: 26, cursor: "pointer" }}
                        onClick={() => handleToggleStatus(property)}
                      >
                        <IonLabel style={{ textTransform: "capitalize" }}>
                          {property.status || "Unknown"}
                        </IonLabel>
                      </IonChip>

                      {property.agent_name && (
                        <IonText color="medium" style={{ fontSize: 12 }}>
                          by {property.agent_name}
                        </IonText>
                      )}
                    </div>
                  </IonLabel>

                  <div
                    slot="end"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <IonButton
                      fill="clear"
                      size="small"
                      color="primary"
                      onClick={() =>
                        router.push(`/property/${property.id}`, "forward")
                      }
                    >
                      <IonIcon slot="icon-only" icon={eyeOutline} />
                    </IonButton>

                    <IonButton
                      fill="clear"
                      size="small"
                      color="danger"
                      onClick={() => handleDelete(property)}
                    >
                      <IonIcon slot="icon-only" icon={trashOutline} />
                    </IonButton>
                  </div>
                </IonItem>
              );
            })}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
}
