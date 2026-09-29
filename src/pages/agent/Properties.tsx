import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonButton,
  IonBadge,
  IonSpinner,
  IonImg,
  IonText,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonMenu,
  IonMenuButton,
  IonList,
  IonItem,
  IonIcon,
  IonButtons,
  IonMenuToggle,
} from "@ionic/react";
import {
  homeOutline,
  addCircleOutline,
  listOutline,
  logOutOutline,
  personOutline,
} from "ionicons/icons";
import { useEffect, useState, useMemo } from "react";
import { useIonRouter } from "@ionic/react";

interface Property {
  id: number;
  title: string;
  description?: string;
  location: string;
  price: number | string;
  listing_type: "sale" | "rent";
  property_type?: string;
  size?: number | string;
  status?: string;
  image?: string;
  images?: string[];
}

const API_URL = "http://localhost:5001";

type FilterType = "all" | "sale" | "rent";

export default function AgentProperties() {
  const router = useIonRouter();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      if (!token) {
        setError("You must be logged in");
        setLoading(false);
        return;
      }

      // ← Changed to the agent-only endpoint
      const res = await fetch(`${API_URL}/api/properties/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load your properties");
      }

      const data = await res.json();
      setProperties(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to fetch properties:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (id: number) => {
    router.push(`/agent/properties/${id}`);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login", "root", "replace");
  };

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `${API_URL}/uploads/${imagePath}`;
  };

  const getFirstImage = (property: Property): string => {
    if (property.images && property.images.length > 0) {
      return property.images[0];
    }
    if (property.image) {
      return property.image.split(",")[0].trim();
    }
    return "";
  };

  const filteredProperties = useMemo(() => {
    if (filter === "all") return properties;
    return properties.filter((p) => p.listing_type === filter);
  }, [properties, filter]);

  const saleCount = properties.filter((p) => p.listing_type === "sale").length;
  const rentCount = properties.filter((p) => p.listing_type === "rent").length;

  return (
    <>
      {/* ========== SIDE MENU ========== */}
      <IonMenu contentId="agent-properties-content" type="overlay">
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Agent Menu</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList>
            <IonMenuToggle autoHide={true}>
              <IonItem
                button
                routerLink="/agent/properties"
                routerDirection="root"
                detail={false}
              >
                <IonIcon slot="start" icon={listOutline} />
                <IonLabel>My Properties</IonLabel>
              </IonItem>
            </IonMenuToggle>

            <IonMenuToggle autoHide={true}>
              <IonItem
                button
                routerLink="/agent/add-property"
                routerDirection="forward"
                detail={false}
              >
                <IonIcon slot="start" icon={addCircleOutline} />
                <IonLabel>Add Property</IonLabel>
              </IonItem>
            </IonMenuToggle>

            <IonMenuToggle autoHide={true}>
              <IonItem
                button
                routerLink="/agent/profile"
                routerDirection="forward"
                detail={false}
              >
                <IonIcon slot="start" icon={personOutline} />
                <IonLabel>My Profile</IonLabel>
              </IonItem>
            </IonMenuToggle>

            <IonMenuToggle autoHide={true}>
              <IonItem
                button
                routerLink="/agent/dashboard"
                routerDirection="root"
                detail={false}
              >
                <IonIcon slot="start" icon={homeOutline} />
                <IonLabel>Dashboard</IonLabel>
              </IonItem>
            </IonMenuToggle>

            <IonItem button onClick={handleLogout} detail={false} lines="none">
              <IonIcon slot="start" icon={logOutOutline} color="danger" />
              <IonLabel color="danger">Logout</IonLabel>
            </IonItem>
          </IonList>
        </IonContent>
      </IonMenu>

      {/* ========== MAIN PAGE ========== */}
      <IonPage id="agent-properties-content">
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>My Properties</IonTitle>
          </IonToolbar>

          {/* Filter Segment */}
          <IonToolbar>
            <IonSegment
              value={filter}
              onIonChange={(e) => setFilter(e.detail.value as FilterType)}
            >
              <IonSegmentButton value="all">
                <IonLabel>All ({properties.length})</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="sale">
                <IonLabel>For Sale ({saleCount})</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="rent">
                <IonLabel>For Rent ({rentCount})</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          {loading && (
            <div style={{ textAlign: "center", marginTop: "60px" }}>
              <IonSpinner name="crescent" />
              <p>Loading your properties...</p>
            </div>
          )}

          {error && !loading && (
            <IonCard>
              <IonCardContent style={{ textAlign: "center" }}>
                <IonText color="danger">
                  <h3>Error</h3>
                  <p>{error}</p>
                </IonText>
                <IonButton expand="block" onClick={fetchProperties}>
                  Try Again
                </IonButton>
              </IonCardContent>
            </IonCard>
          )}

          {!loading && !error && filteredProperties.length === 0 && (
            <IonCard>
              <IonCardContent style={{ textAlign: "center" }}>
                <h3>
                  {filter === "all"
                    ? "No properties yet"
                    : filter === "sale"
                    ? "No properties for sale"
                    : "No properties for rent"}
                </h3>
                <p>
                  {filter === "all"
                    ? "Start adding your properties."
                    : "Try switching filters or add a new property."}
                </p>
                <IonButton
                  expand="block"
                  onClick={() => router.push("/agent/add-property")}
                >
                  Add New Property
                </IonButton>
              </IonCardContent>
            </IonCard>
          )}

          {!loading &&
            filteredProperties.map((property) => {
              const firstImage = getFirstImage(property);
              const imageUrl = getImageUrl(firstImage);

              return (
                <IonCard
                  key={property.id}
                  button
                  onClick={() => handleViewDetails(property.id)}
                  style={{ marginBottom: "16px" }}
                >
                  {imageUrl ? (
                    <IonImg
                      src={imageUrl}
                      alt={property.title}
                      style={{
                        width: "100%",
                        height: "200px",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        height: "160px",
                        background: "#f0f0f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#999",
                      }}
                    >
                      No Image
                    </div>
                  )}

                  <IonCardContent>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "8px",
                      }}
                    >
                      <h3 style={{ margin: "0 0 6px 0", flex: 1 }}>
                        {property.title}
                      </h3>
                      <IonBadge
                        color={
                          property.listing_type === "rent"
                            ? "warning"
                            : "success"
                        }
                      >
                        {property.listing_type === "rent"
                          ? "For Rent"
                          : "For Sale"}
                      </IonBadge>
                    </div>

                    <p style={{ margin: "4px 0", color: "#666" }}>
                      {property.location}
                    </p>

                    <p
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: "bold",
                        color: "var(--ion-color-primary)",
                        margin: "8px 0",
                      }}
                    >
                      K {Number(property.price).toLocaleString()}
                      {property.listing_type === "rent" && (
                        <span
                          style={{
                            fontSize: "0.9rem",
                            fontWeight: "normal",
                          }}
                        >
                          {" "}/ month
                        </span>
                      )}
                    </p>

                    {property.size && (
                      <p
                        style={{
                          fontSize: "0.9rem",
                          color: "#666",
                          margin: 0,
                        }}
                      >
                        Size: {property.size} sqm
                      </p>
                    )}

                    <IonButton
                      expand="block"
                      fill="outline"
                      size="small"
                      className="ion-margin-top"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(property.id);
                      }}
                    >
                      View Details
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              );
            })}

          {!loading && properties.length > 0 && (
            <IonButton
              expand="block"
              color="primary"
              className="ion-margin-top"
              onClick={() => router.push("/agent/add-property")}
            >
              + Add New Property
            </IonButton>
          )}
        </IonContent>
      </IonPage>
    </>
  );
}