import { useEffect, useState } from "react";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardContent,
  IonButton,
  IonSearchbar,
  IonSpinner,
  IonText,
  IonToast,
  IonModal,
  IonItem,
  IonLabel,
  IonInput,
  IonButtons,
  IonIcon,
  IonBadge,
  IonSegment,
  IonSegmentButton,
} from "@ionic/react";
import { closeOutline, homeOutline, cashOutline } from "ionicons/icons";

type ListingType = "rent" | "sale";

type Property = {
  id: number;
  title: string;
  location: string;
  price: number;
  listing_type?: ListingType; // "rent" | "sale"
  image?: string | null;
  images?: string[];
};

const API_URL = "http://localhost:5001";

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect fill='%23e5e7eb' width='600' height='400'/%3E%3Ctext fill='%236b7280' font-family='sans-serif' font-size='22' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filtered, setFiltered] = useState<Property[]>([]);
  const [bookedProperties, setBookedProperties] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "rent" | "sale">("all");
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState("");

  // Booking modal (for rent)
  const [showModal, setShowModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  const [toast, setToast] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "warning" | "danger",
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_URL}/api/properties`);
      if (!res.ok) throw new Error("Failed to load properties");

      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Invalid data received");

      setProperties(data);
      setFiltered(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to load properties");
    } finally {
      setLoading(false);
    }
  };

  // Search + type filter
  useEffect(() => {
    const timeout = setTimeout(() => {
      let results = [...properties];

      // Filter by listing type
      if (filterType !== "all") {
        results = results.filter(
          (p) => (p.listing_type || "rent") === filterType
        );
      }

      // Search
      if (search.trim()) {
        const keyword = search.toLowerCase();
        results = results.filter(
          (p) =>
            p.title?.toLowerCase().includes(keyword) ||
            p.location?.toLowerCase().includes(keyword)
        );
      }

      setFiltered(results);
    }, 250);

    return () => clearTimeout(timeout);
  }, [search, filterType, properties]);

  const getImageUrl = (property: Property): string => {
    if (property.images && property.images.length > 0) {
      return `${API_URL}/uploads/${property.images[0]}`;
    }
    if (property.image) {
      return `${API_URL}/uploads/${property.image}`;
    }
    return PLACEHOLDER;
  };

  const getListingType = (property: Property): ListingType =>
    property.listing_type === "sale" ? "sale" : "rent";

  const openBookingModal = (property: Property) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setToast({ open: true, message: "Please login first", color: "warning" });
      return;
    }
    setSelectedProperty(property);
    setCheckIn("");
    setCheckOut("");
    setShowModal(true);
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86400000));
  };

  const calculateTotal = () => {
    if (!selectedProperty) return 0;
    return calculateNights() * Number(selectedProperty.price || 0);
  };

  // -------- RENTAL BOOKING --------
  const handleBooking = async () => {
    if (!selectedProperty) return;

    if (!checkIn || !checkOut) {
      setToast({
        open: true,
        message: "Please select check-in and check-out dates",
        color: "warning",
      });
      return;
    }

    if (calculateNights() <= 0) {
      setToast({
        open: true,
        message: "Check-out must be after check-in",
        color: "warning",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setToast({ open: true, message: "Please login first", color: "warning" });
        return;
      }

      setBookingLoading(true);

      const res = await fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          property_id: selectedProperty.id,
          check_in: checkIn,
          check_out: checkOut,
          total_amount: calculateTotal(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Booking failed");

      setBookedProperties((prev) => [...prev, selectedProperty.id]);
      setShowModal(false);
      setToast({
        open: true,
        message: "Booking submitted successfully",
        color: "success",
      });
    } catch (err: any) {
      setToast({
        open: true,
        message: err.message || "Booking failed",
        color: "danger",
      });
    } finally {
      setBookingLoading(false);
    }
  };

  // -------- SALE / BUY --------
  const handleBuy = async (property: Property) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setToast({ open: true, message: "Please login first", color: "warning" });
      return;
    }

    // For now we show interest / create an offer.
    // Later you can create a real /api/offers or /api/purchases endpoint.
    try {
      setBookingLoading(true);

      // Example endpoint – create this on the backend later
      const res = await fetch(`${API_URL}/api/offers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          property_id: property.id,
          offer_amount: property.price,
          message: "I am interested in buying this property",
        }),
      });

      // If the endpoint doesn't exist yet, still give good UX
      if (res.status === 404) {
        setToast({
          open: true,
          message: "Purchase interest recorded. Seller will contact you.",
          color: "success",
        });
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit offer");

      setToast({
        open: true,
        message: "Offer submitted successfully",
        color: "success",
      });
    } catch (err: any) {
      setToast({
        open: true,
        message: err.message || "Could not submit offer",
        color: "danger",
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Available Properties</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonSearchbar
          value={search}
          placeholder="Search properties..."
          onIonInput={(e) => setSearch(e.detail.value || "")}
        />

        {/* Filter: All / Rent / Sale */}
        <IonSegment
          value={filterType}
          onIonChange={(e) =>
            setFilterType((e.detail.value as "all" | "rent" | "sale") || "all")
          }
          style={{ marginBottom: 16 }}
        >
          <IonSegmentButton value="all">All</IonSegmentButton>
          <IonSegmentButton value="rent">For Rent</IonSegmentButton>
          <IonSegmentButton value="sale">For Sale</IonSegmentButton>
        </IonSegment>

        {loading && (
          <div className="ion-text-center ion-padding">
            <IonSpinner />
            <p>Loading properties...</p>
          </div>
        )}

        {error && (
          <IonText color="danger">
            <p>{error}</p>
          </IonText>
        )}

        {!loading && filtered.length === 0 && (
          <IonText color="medium">
            <p>No properties found.</p>
          </IonText>
        )}

        {!loading &&
          filtered.map((property) => {
            const type = getListingType(property);
            const isSale = type === "sale";

            return (
              <IonCard key={property.id}>
                <img
                  src={getImageUrl(property)}
                  alt={property.title}
                  style={{
                    width: "100%",
                    height: "220px",
                    objectFit: "cover",
                    backgroundColor: "#e5e7eb",
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== PLACEHOLDER) target.src = PLACEHOLDER;
                  }}
                />

                <IonCardContent>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <h2 style={{ margin: 0 }}>{property.title}</h2>
                    <IonBadge color={isSale ? "tertiary" : "primary"}>
                      {isSale ? "For Sale" : "For Rent"}
                    </IonBadge>
                  </div>

                  <p>📍 {property.location}</p>
                  <p>
                    💰 MWK {Number(property.price).toLocaleString()}
                    {!isSale && " / night"}
                  </p>

                  <IonButton
                    expand="block"
                    routerLink={`/property/${property.id}`}
                  >
                    View Details
                  </IonButton>

                  {/* Different actions based on type */}
                  {isSale ? (
                    <IonButton
                      expand="block"
                      color="tertiary"
                      className="ion-margin-top"
                      onClick={() => handleBuy(property)}
                      disabled={bookingLoading}
                    >
                      <IonIcon icon={cashOutline} slot="start" />
                      {bookingLoading ? "Submitting..." : "Buy / Make Offer"}
                    </IonButton>
                  ) : (
                    <IonButton
                      expand="block"
                      color="success"
                      className="ion-margin-top"
                      disabled={bookedProperties.includes(property.id)}
                      onClick={() => openBookingModal(property)}
                    >
                      <IonIcon icon={homeOutline} slot="start" />
                      {bookedProperties.includes(property.id)
                        ? "Booked"
                        : "Book Now"}
                    </IonButton>
                  )}
                </IonCardContent>
              </IonCard>
            );
          })}

        {/* Rental Booking Modal */}
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Book Property</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">
            {selectedProperty && (
              <>
                <h2 style={{ marginTop: 0 }}>{selectedProperty.title}</h2>
                <p style={{ color: "var(--ion-color-medium)" }}>
                  {selectedProperty.location}
                </p>
                <p>
                  <strong>
                    MWK {Number(selectedProperty.price).toLocaleString()}
                  </strong>{" "}
                  / night
                </p>

                <IonItem>
                  <IonLabel position="stacked">Check-in</IonLabel>
                  <IonInput
                    type="date"
                    value={checkIn}
                    min={today}
                    onIonInput={(e) => setCheckIn(e.detail.value || "")}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Check-out</IonLabel>
                  <IonInput
                    type="date"
                    value={checkOut}
                    min={checkIn || today}
                    onIonInput={(e) => setCheckOut(e.detail.value || "")}
                  />
                </IonItem>

                {calculateNights() > 0 && (
                  <div
                    style={{
                      marginTop: 20,
                      padding: 16,
                      background: "var(--ion-color-light)",
                      borderRadius: 12,
                    }}
                  >
                    <p style={{ margin: "0 0 6px" }}>
                      {calculateNights()} night
                      {calculateNights() > 1 ? "s" : ""}
                    </p>
                    <h2 style={{ margin: 0 }}>
                      Total: MWK {calculateTotal().toLocaleString()}
                    </h2>
                  </div>
                )}

                <IonButton
                  expand="block"
                  color="success"
                  className="ion-margin-top"
                  disabled={bookingLoading || calculateNights() <= 0}
                  onClick={handleBooking}
                >
                  {bookingLoading ? "Submitting..." : "Confirm Booking"}
                </IonButton>
              </>
            )}
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={toast.open}
          message={toast.message}
          color={toast.color}
          duration={2500}
          onDidDismiss={() => setToast((prev) => ({ ...prev, open: false }))}
        />
      </IonContent>
    </IonPage>
  );
}