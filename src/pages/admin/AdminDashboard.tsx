import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonText,
  IonSpinner,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonButtons,
  IonIcon,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonToast,
  IonAlert,
  IonNote,
  IonSearchbar,
  IonChip,
  IonAvatar,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonSkeletonText,
  RefresherEventDetail,
} from "@ionic/react";

import {
  addOutline,
  createOutline,
  trashOutline,
  closeOutline,
  peopleOutline,
  homeOutline,
  briefcaseOutline,
  refreshOutline,
  searchOutline,
  locationOutline,
  cashOutline,
  imageOutline,
  checkmarkCircleOutline,
  businessOutline,
  mapOutline,
  locateOutline,
} from "ionicons/icons";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

/* =========================================================
   LEAFLET DEFAULT ICON
========================================================= */

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

/* =========================================================
   TYPES
========================================================= */

interface Property {
  id: number;
  title: string;
  location: string;
  price: number | string;
  image?: string | null;
  imageUrl?: string | null;
  photo?: string | null;
  thumbnail?: string | null;
  picture?: string | null;
  description?: string | null;
  type?: string;
  property_type?: string;
  status?: string;
  listing_type?: string;
  size?: number | string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string;
}

interface Stats {
  users: number;
  properties: number;
  agents: number;
}

type PropertyType = "house" | "land" | "apartment" | "commercial";
type ListingType = "sale" | "rent";

interface PropertyForm {
  title: string;
  description: string;
  location: string;
  price: string;
  property_type: PropertyType;
  size: string;
  listing_type: ListingType;
  status: string;
  latitude: number | null;
  longitude: number | null;
}

type ToastColor = "success" | "danger" | "warning" | "primary" | "medium";

/* =========================================================
   CONFIG
========================================================= */

const API_BASE = "http://localhost:5001/api";
const STATIC_BASE = "http://localhost:5001";
const DEFAULT_CENTER: [number, number] = [-13.9626, 33.7741]; // Lilongwe
const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const emptyForm: PropertyForm = {
  title: "",
  description: "",
  location: "",
  price: "",
  property_type: "house",
  size: "",
  listing_type: "sale",
  status: "Available",
  latitude: null,
  longitude: null,
};

/* =========================================================
   HELPERS
========================================================= */

function getToken(): string | null {
  return localStorage.getItem("token");
}

function getAuthHeaders(isFormData = false): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  if (!isFormData) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }
  return headers;
}

function formatPrice(price: number | string): string {
  const numeric = Number(price);
  if (!Number.isFinite(numeric)) return "MWK 0";

  return new Intl.NumberFormat("en-MW", {
    style: "currency",
    currency: "MWK",
    maximumFractionDigits: 0,
  }).format(numeric);
}

function getPropertyImageUrl(property: Property): string | null {
  const candidates = [
    property.image,
    property.imageUrl,
    property.photo,
    property.thumbnail,
    property.picture,
  ];

  for (const raw of candidates) {
    if (!raw || typeof raw !== "string") continue;
    const url = raw.trim();
    if (!url) continue;

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    if (url.startsWith("/")) {
      return `${STATIC_BASE}${url}`;
    }
    if (!url.includes("://") && !url.startsWith("data:")) {
      return `${STATIC_BASE}/uploads/${url}`;
    }
  }
  return null;
}

function normalizeStats(raw: any): Stats {
  const data = raw?.data ?? raw?.stats ?? raw?.result ?? raw ?? {};
  return {
    users: Number(data.users ?? data.totalUsers ?? data.userCount ?? data.Users ?? 0),
    properties: Number(
      data.properties ?? data.totalProperties ?? data.propertyCount ?? data.Properties ?? 0
    ),
    agents: Number(data.agents ?? data.totalAgents ?? data.agentCount ?? data.Agents ?? 0),
  };
}

function normalizeProperties(raw: any): Property[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.properties)) return raw.properties;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.results)) return raw.results;
  return [];
}

function getStatusColor(status?: string): string {
  switch ((status || "Available").toLowerCase()) {
    case "available":
      return "success";
    case "sold":
      return "danger";
    case "rented":
      return "warning";
    case "pending":
      return "medium";
    default:
      return "primary";
  }
}

/* =========================================================
   MAP HELPERS
========================================================= */

function MapCenter({ position }: { position: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { duration: 1 });
    }
  }, [position, map]);

  return null;
}

function LocationPicker({
  position,
  setPosition,
}: {
  position: [number, number] | null;
  setPosition: (position: [number, number]) => void;
}) {
  useMapEvents({
    click(event) {
      setPosition([event.latlng.lat, event.latlng.lng]);
    },
  });

  if (!position) return null;
  return <Marker position={position} />;
}

/* =========================================================
   SUB-COMPONENTS
========================================================= */

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: string;
  iconBg: string;
  iconColor: string;
}> = ({ label, value, icon, iconBg, iconColor }) => (
  <IonCard
    style={{
      margin: "0 0 14px",
      borderRadius: 18,
      boxShadow: "0 6px 20px rgba(15,23,42,0.07)",
    }}
  >
    <IonCardContent style={{ padding: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <IonNote>{label}</IonNote>
          <h2
            style={{
              fontSize: 30,
              fontWeight: 800,
              margin: "6px 0 0",
              color: "#111827",
            }}
          >
            {value}
          </h2>
        </div>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 15,
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IonIcon icon={icon} style={{ fontSize: 27, color: iconColor }} />
        </div>
      </div>
    </IonCardContent>
  </IonCard>
);

const PropertyImage: React.FC<{ property: Property }> = ({ property }) => {
  const [failed, setFailed] = useState(false);
  const imageUrl = getPropertyImageUrl(property);

  if (!imageUrl || failed) {
    return (
      <div
        style={{
          height: 190,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #e9eef5 0%, #d8dee8 100%)",
          color: "#687386",
        }}
      >
        <IonIcon
          icon={imageOutline}
          style={{ fontSize: 42, marginBottom: 8, opacity: 0.7 }}
        />
        <div style={{ fontSize: 13, fontWeight: 600 }}>No Image</div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={property.title || "Property"}
      loading="lazy"
      style={{
        width: "100%",
        height: 190,
        objectFit: "cover",
        display: "block",
        background: "#f1f5f9",
      }}
      onError={() => setFailed(true)}
    />
  );
};

const PropertyCard: React.FC<{
  property: Property;
  deletingId: number | null;
  onEdit: (p: Property) => void;
  onDelete: (p: Property) => void;
}> = ({ property, deletingId, onEdit, onDelete }) => (
  <IonCard
    style={{
      margin: "0 0 18px",
      borderRadius: 20,
      overflow: "hidden",
      boxShadow: "0 7px 22px rgba(15,23,42,0.08)",
      height: "100%",
    }}
  >
    <div style={{ position: "relative" }}>
      <PropertyImage property={property} />
      <div style={{ position: "absolute", top: 12, right: 12 }}>
        <IonChip
          color={getStatusColor(property.status)}
          style={{ margin: 0, fontWeight: 700 }}
        >
          {property.status || "Available"}
        </IonChip>
      </div>
    </div>

    <IonCardContent style={{ padding: 17 }}>
      <IonCardTitle
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: "#111827",
          marginBottom: 9,
        }}
      >
        {property.title}
      </IonCardTitle>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: "#64748b",
          fontSize: 13,
          marginBottom: 10,
        }}
      >
        <IonIcon icon={locationOutline} />
        <span>{property.location}</span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: "#111827",
          fontWeight: 800,
          fontSize: 16,
          marginBottom: 10,
        }}
      >
        <IonIcon icon={cashOutline} color="success" />
        {formatPrice(property.price)}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 15,
        }}
      >
        {(property.property_type || property.type) && (
          <IonBadge color="light">
            {property.property_type || property.type}
          </IonBadge>
        )}
        {property.size != null && (
          <IonBadge color="light">{property.size} sqm</IonBadge>
        )}
        {property.listing_type && (
          <IonBadge color="light">{property.listing_type}</IonBadge>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
        }}
      >
        <IonButton
          fill="outline"
          size="small"
          onClick={() => onEdit(property)}
          style={{ margin: 0 }}
        >
          <IonIcon slot="start" icon={createOutline} />
          Edit
        </IonButton>

        <IonButton
          fill="outline"
          color="danger"
          size="small"
          onClick={() => onDelete(property)}
          disabled={deletingId === property.id}
          style={{ margin: 0 }}
        >
          {deletingId === property.id ? (
            <IonSpinner name="crescent" />
          ) : (
            <>
              <IonIcon slot="start" icon={trashOutline} />
              Delete
            </>
          )}
        </IonButton>
      </div>
    </IonCardContent>
  </IonCard>
);

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    users: 0,
    properties: 0,
    agents: 0,
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState<PropertyForm>(emptyForm);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    color?: ToastColor;
  } | null>(null);
  const [deleteAlert, setDeleteAlert] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const showToast = useCallback(
    (message: string, color: ToastColor = "primary") => {
      setToast({ message, color });
    },
    []
  );

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("token");
    showToast("Your session has expired. Please log in again.", "danger");
    setTimeout(() => {
      window.location.href = "/login";
    }, 1200);
  }, [showToast]);

  /* ---------- FETCH ---------- */

  const fetchData = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) setLoading(true);

      try {
        const token = getToken();
        if (!token) {
          handleUnauthorized();
          return;
        }

        const [statsRes, propsRes] = await Promise.all([
          fetch(`${API_BASE}/admin/stats`, {
            method: "GET",
            headers: getAuthHeaders(),
          }),
          fetch(`${API_BASE}/properties`, {
            method: "GET",
            headers: getAuthHeaders(),
          }),
        ]);

        if (
          statsRes.status === 401 ||
          statsRes.status === 403 ||
          propsRes.status === 401 ||
          propsRes.status === 403
        ) {
          handleUnauthorized();
          return;
        }

        if (!statsRes.ok) {
          throw new Error(`Unable to load statistics (${statsRes.status})`);
        }
        if (!propsRes.ok) {
          throw new Error(`Unable to load properties (${propsRes.status})`);
        }

        const statsRaw = await statsRes.json();
        const propsRaw = await propsRes.json();

        const normalizedStats = normalizeStats(statsRaw);
        const normalizedProps = normalizeProperties(propsRaw);

        setStats({
          ...normalizedStats,
          properties: normalizedStats.properties || normalizedProps.length,
        });
        setProperties(normalizedProps);
      } catch (error) {
        console.error("Admin dashboard error:", error);
        showToast(
          error instanceof Error ? error.message : "Failed to load dashboard",
          "danger"
        );
      } finally {
        setLoading(false);
      }
    },
    [handleUnauthorized, showToast]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchData(false);
    event.detail.complete();
  };

  /* ---------- FILTER ---------- */

  const filteredProperties = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return properties.filter((p) => {
      const matchesSearch =
        !search ||
        p.title?.toLowerCase().includes(search) ||
        p.location?.toLowerCase().includes(search) ||
        (p.property_type || p.type)?.toLowerCase().includes(search);

      const matchesStatus =
        filterStatus === "All" ||
        (p.status || "Available") === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [properties, searchTerm, filterStatus]);

  /* ---------- IMAGE PREVIEWS ---------- */

  useEffect(() => {
    const previews = images.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);

    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  /* ---------- SYNC MAP → FORM ---------- */

  useEffect(() => {
    if (!mapPosition) return;

    setForm((prev) => ({
      ...prev,
      latitude: mapPosition[0],
      longitude: mapPosition[1],
    }));
  }, [mapPosition]);

  /* ---------- FORM HELPERS ---------- */

  const updateForm = (
    field: keyof PropertyForm,
    value: string | number | null | undefined
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value ?? "",
    }));
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const files = Array.from(selectedFiles);

    if (files.length > MAX_IMAGES) {
      showToast(`You can upload a maximum of ${MAX_IMAGES} images.`, "warning");
      event.target.value = "";
      return;
    }

    if (files.some((f) => !f.type.startsWith("image/"))) {
      showToast("Only image files are allowed.", "danger");
      event.target.value = "";
      return;
    }

    if (files.some((f) => f.size > MAX_IMAGE_SIZE)) {
      showToast("Each image must be 5MB or smaller.", "warning");
      event.target.value = "";
      return;
    }

    setImages(files);
    showToast(`${files.length} image(s) selected.`, "success");
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by this device.", "danger");
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        setMapPosition(coords);
        setIsGettingLocation(false);
        showToast("Your current location has been selected.", "success");
      },
      (error) => {
        setIsGettingLocation(false);

        let message = "Unable to determine your location.";
        if (error.code === 1) message = "Location permission was denied.";
        if (error.code === 2)
          message = "Your location could not be determined.";
        if (error.code === 3) message = "Location request timed out.";

        showToast(message, "warning");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const validateForm = (): boolean => {
    const title = form.title.trim();
    const location = form.location.trim();
    const price = Number(form.price);
    const size = Number(form.size);

    if (!title) {
      showToast("Please enter a property title.", "warning");
      return false;
    }
    if (title.length < 3) {
      showToast("Property title must contain at least 3 characters.", "warning");
      return false;
    }
    if (!location) {
      showToast("Please enter the property address.", "warning");
      return false;
    }
    if (!form.price || !Number.isFinite(price) || price <= 0) {
      showToast("Please enter a valid property price.", "warning");
      return false;
    }
    if (!form.size || !Number.isFinite(size) || size <= 0) {
      showToast("Please enter a valid property size.", "warning");
      return false;
    }
    if (editingId === null && images.length === 0) {
      showToast("Please select at least one property image.", "warning");
      return false;
    }
    if (!mapPosition) {
      showToast("Please select the property location on the map.", "warning");
      return false;
    }

    return true;
  };

  const resetFormState = () => {
    setForm({ ...emptyForm });
    setImages([]);
    setMapPosition(null);
    setEditingId(null);

    const fileInput = document.getElementById(
      "admin-property-images"
    ) as HTMLInputElement | null;
    if (fileInput) fileInput.value = "";
  };

  const openAdd = () => {
    resetFormState();
    setShowModal(true);
  };

  const openEdit = (property: Property) => {
    setEditingId(property.id);

    setForm({
      title: property.title || "",
      description: property.description || "",
      location: property.location || "",
      price: String(property.price ?? ""),
      property_type: (property.property_type || property.type || "house")
        .toLowerCase() as PropertyType,
      size: property.size != null ? String(property.size) : "",
      listing_type: (property.listing_type || "sale").toLowerCase() as ListingType,
      status: property.status || "Available",
      latitude: property.latitude ?? null,
      longitude: property.longitude ?? null,
    });

    setImages([]);

    if (property.latitude != null && property.longitude != null) {
      setMapPosition([
        Number(property.latitude),
        Number(property.longitude),
      ]);
    } else {
      setMapPosition(null);
    }

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    resetFormState();
  };

  const saveProperty = async () => {
    if (!validateForm()) return;

    const token = getToken();
    if (!token) {
      handleUnauthorized();
      return;
    }

    setSaving(true);

    try {
      const isEditing = editingId !== null;
      const url = isEditing
        ? `${API_BASE}/properties/${editingId}`
        : `${API_BASE}/properties`;
      const method = isEditing ? "PUT" : "POST";

      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("location", form.location.trim());
      formData.append("price", String(Number(form.price)));
      formData.append("property_type", form.property_type);
      formData.append("size", String(Number(form.size)));
      formData.append("listing_type", form.listing_type);
      formData.append("status", form.status.toLowerCase());

      if (form.latitude !== null && form.longitude !== null) {
        formData.append("latitude", String(form.latitude));
        formData.append("longitude", String(form.longitude));
      }

      images.forEach((file) => {
        formData.append("images", file);
      });

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(true),
        body: formData,
      });

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          body?.message ||
            body?.error ||
            `Unable to save property (${response.status})`
        );
      }

      showToast(
        isEditing
          ? "Property updated successfully."
          : "Property added successfully.",
        "success"
      );

      closeModal();
      await fetchData(false);
    } catch (error) {
      console.error("Save property error:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to save property.",
        "danger"
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (property: Property) => {
    setDeleteAlert({ id: property.id, title: property.title });
  };

  const deleteProperty = async (id: number) => {
    const token = getToken();
    if (!token) {
      handleUnauthorized();
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`${API_BASE}/properties/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          body?.message || `Unable to delete property (${response.status})`
        );
      }

      showToast("Property deleted successfully.", "success");
      await fetchData(false);
    } catch (error) {
      console.error("Delete property error:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to delete property.",
        "danger"
      );
    } finally {
      setDeletingId(null);
      setDeleteAlert(null);
    }
  };

  /* ---------- RENDER ---------- */

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar
          style={
            {
              "--background": "#111827",
              "--color": "#ffffff",
            } as React.CSSProperties
          }
        >
          <IonTitle>
            <div style={{ fontWeight: 800, letterSpacing: "-0.3px" }}>
              Admin Dashboard
            </div>
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => fetchData()} disabled={loading}>
              <IonIcon slot="icon-only" icon={refreshOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{ "--background": "#f4f7fb" } as React.CSSProperties}
      >
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "18px 14px 40px",
          }}
        >
          {/* Welcome banner */}
          <div
            style={{
              background:
                "linear-gradient(135deg, #111827 0%, #1f2937 55%, #374151 100%)",
              borderRadius: 20,
              padding: "24px 20px",
              marginBottom: 20,
              color: "#ffffff",
              boxShadow: "0 12px 30px rgba(15, 23, 42, 0.16)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <IonAvatar
                style={{
                  width: 54,
                  height: 54,
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IonIcon
                  icon={businessOutline}
                  style={{ fontSize: 28, color: "#111827" }}
                />
              </IonAvatar>
              <div>
                <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 3 }}>
                  Administration
                </div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 25,
                    fontWeight: 800,
                  }}
                >
                  Property Management
                </h1>
              </div>
            </div>
            <p
              style={{
                margin: "15px 0 0",
                opacity: 0.8,
                lineHeight: 1.5,
                fontSize: 14,
              }}
            >
              Manage users, agents and properties from one central control
              panel.
            </p>
          </div>

          {loading ? (
            <IonGrid style={{ padding: 0 }}>
              <IonRow>
                {[1, 2, 3].map((i) => (
                  <IonCol key={i} size="12" sizeSm="6" sizeLg="4">
                    <IonCard style={{ margin: "0 0 14px", borderRadius: 18 }}>
                      <IonCardContent style={{ padding: 20 }}>
                        <IonSkeletonText
                          animated
                          style={{ width: "40%", height: 14 }}
                        />
                        <IonSkeletonText
                          animated
                          style={{
                            width: "30%",
                            height: 32,
                            marginTop: 10,
                          }}
                        />
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>
          ) : (
            <>
              {/* Stats */}
              <IonGrid style={{ padding: 0 }}>
                <IonRow>
                  <IonCol size="12" sizeSm="6" sizeLg="4">
                    <StatCard
                      label="Total Users"
                      value={stats.users}
                      icon={peopleOutline}
                      iconBg="#e8f0ff"
                      iconColor="#2563eb"
                    />
                  </IonCol>
                  <IonCol size="12" sizeSm="6" sizeLg="4">
                    <StatCard
                      label="Properties"
                      value={stats.properties}
                      icon={homeOutline}
                      iconBg="#eaf8f0"
                      iconColor="#16a34a"
                    />
                  </IonCol>
                  <IonCol size="12" sizeSm="6" sizeLg="4">
                    <StatCard
                      label="Agents"
                      value={stats.agents}
                      icon={briefcaseOutline}
                      iconBg="#fff7e6"
                      iconColor="#d97706"
                    />
                  </IonCol>
                </IonRow>
              </IonGrid>

              {/* Header + Add */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  marginTop: 12,
                  marginBottom: 12,
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 21,
                      fontWeight: 800,
                      color: "#111827",
                    }}
                  >
                    Manage Properties
                  </h2>
                  <p
                    style={{
                      margin: "5px 0 0",
                      color: "#64748b",
                      fontSize: 13,
                    }}
                  >
                    Add, edit and manage property listings.
                  </p>
                </div>
                <IonButton onClick={openAdd} shape="round">
                  <IonIcon slot="start" icon={addOutline} />
                  Add Property
                </IonButton>
              </div>

              {/* Search + Filter */}
              <IonCard
                style={{
                  margin: "0 0 18px",
                  borderRadius: 18,
                  boxShadow: "0 5px 18px rgba(15,23,42,0.06)",
                }}
              >
                <IonCardContent style={{ padding: 12 }}>
                  <IonGrid style={{ padding: 0 }}>
                    <IonRow>
                      <IonCol size="12" sizeMd="8">
                        <IonSearchbar
                          value={searchTerm}
                          placeholder="Search by title, location or type..."
                          onIonInput={(e) =>
                            setSearchTerm(e.detail.value || "")
                          }
                          style={{ padding: "0 0 5px" }}
                        />
                      </IonCol>
                      <IonCol size="12" sizeMd="4">
                        <IonItem
                          lines="none"
                          style={
                            {
                              "--background": "#f8fafc",
                              "--border-radius": "12px",
                            } as React.CSSProperties
                          }
                        >
                          <IonLabel>Status</IonLabel>
                          <IonSelect
                            value={filterStatus}
                            interface="popover"
                            onIonChange={(e) =>
                              setFilterStatus(e.detail.value)
                            }
                          >
                            <IonSelectOption value="All">All</IonSelectOption>
                            <IonSelectOption value="Available">
                              Available
                            </IonSelectOption>
                            <IonSelectOption value="Pending">
                              Pending
                            </IonSelectOption>
                            <IonSelectOption value="Rented">
                              Rented
                            </IonSelectOption>
                            <IonSelectOption value="Sold">Sold</IonSelectOption>
                          </IonSelect>
                        </IonItem>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </IonCardContent>
              </IonCard>

              {/* Results count */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <IonText color="medium">
                  Showing <strong>{filteredProperties.length}</strong> of{" "}
                  {properties.length} properties
                </IonText>
                {searchTerm && (
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={() => setSearchTerm("")}
                  >
                    Clear search
                  </IonButton>
                )}
              </div>

              {/* Empty / Grid */}
              {filteredProperties.length === 0 ? (
                <IonCard
                  style={{
                    margin: 0,
                    borderRadius: 20,
                    boxShadow: "0 5px 18px rgba(15,23,42,0.05)",
                  }}
                >
                  <IonCardContent
                    style={{ textAlign: "center", padding: "50px 20px" }}
                  >
                    <div
                      style={{
                        width: 75,
                        height: 75,
                        borderRadius: "50%",
                        margin: "0 auto 18px",
                        background: "#eef2f7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IonIcon
                        icon={searchTerm ? searchOutline : homeOutline}
                        style={{ fontSize: 35, color: "#64748b" }}
                      />
                    </div>
                    <h3 style={{ margin: 0, fontWeight: 800 }}>
                      {searchTerm
                        ? "No matching properties"
                        : "No properties yet"}
                    </h3>
                    <p
                      style={{
                        color: "#64748b",
                        maxWidth: 420,
                        margin: "8px auto 20px",
                        lineHeight: 1.5,
                      }}
                    >
                      {searchTerm
                        ? "Try changing your search or filter."
                        : "Start building your property listings by adding your first property."}
                    </p>
                    {!searchTerm && (
                      <IonButton onClick={openAdd}>
                        <IonIcon slot="start" icon={addOutline} />
                        Add First Property
                      </IonButton>
                    )}
                  </IonCardContent>
                </IonCard>
              ) : (
                <IonGrid style={{ padding: 0 }}>
                  <IonRow>
                    {filteredProperties.map((property) => (
                      <IonCol
                        key={property.id}
                        size="12"
                        sizeSm="6"
                        sizeLg="4"
                        sizeXl="3"
                      >
                        <PropertyCard
                          property={property}
                          deletingId={deletingId}
                          onEdit={openEdit}
                          onDelete={confirmDelete}
                        />
                      </IonCol>
                    ))}
                  </IonRow>
                </IonGrid>
              )}
            </>
          )}
        </div>

        {/* ========== ADD / EDIT MODAL ========== */}
        <IonModal isOpen={showModal} onDidDismiss={closeModal}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>
                {editingId !== null ? "Edit Property" : "Add Property"}
              </IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={closeModal} disabled={saving}>
                  <IonIcon slot="icon-only" icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent
            style={{ "--background": "#f8fafc" } as React.CSSProperties}
          >
            <div
              style={{
                padding: 16,
                maxWidth: 800,
                margin: "0 auto",
              }}
            >
              {/* Property Details */}
              <IonCard
                style={{
                  marginBottom: 16,
                  borderRadius: 16,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                }}
              >
                <IonCardContent>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 14,
                    }}
                  >
                    <IonIcon
                      icon={homeOutline}
                      color="primary"
                      style={{ fontSize: 23 }}
                    />
                    <div>
                      <strong style={{ fontSize: 17 }}>Property Details</strong>
                      <div
                        style={{
                          color: "#777",
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        Basic information about the property
                      </div>
                    </div>
                  </div>

                  <IonItem lines="full">
                    <IonLabel position="stacked">Property Title *</IonLabel>
                    <IonInput
                      value={form.title}
                      placeholder="e.g. Luxury 4 Bedroom House"
                      maxlength={150}
                      onIonChange={(e) =>
                        updateForm("title", e.detail.value)
                      }
                    />
                  </IonItem>

                  <IonItem lines="full">
                    <IonLabel position="stacked">Description</IonLabel>
                    <IonTextarea
                      value={form.description}
                      placeholder="Describe the property, features, nearby facilities, condition, etc."
                      rows={5}
                      maxlength={2000}
                      autoGrow
                      onIonChange={(e) =>
                        updateForm("description", e.detail.value)
                      }
                    />
                  </IonItem>

                  <IonItem lines="full">
                    <IonLabel position="stacked">Address / Area *</IonLabel>
                    <IonInput
                      value={form.location}
                      placeholder="e.g. Area 49, Lilongwe"
                      maxlength={255}
                      onIonChange={(e) =>
                        updateForm("location", e.detail.value)
                      }
                    />
                  </IonItem>

                  <IonItem lines="full">
                    <IonLabel position="stacked">Price (MWK) *</IonLabel>
                    <IonInput
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={form.price}
                      placeholder="8500000"
                      onIonChange={(e) =>
                        updateForm("price", e.detail.value)
                      }
                    />
                  </IonItem>

                  <IonItem lines="full">
                    <IonLabel position="stacked">Listing Type *</IonLabel>
                    <IonSelect
                      value={form.listing_type}
                      interface="popover"
                      onIonChange={(e) =>
                        updateForm("listing_type", e.detail.value)
                      }
                    >
                      <IonSelectOption value="sale">For Sale</IonSelectOption>
                      <IonSelectOption value="rent">For Rent</IonSelectOption>
                    </IonSelect>
                  </IonItem>

                  <IonItem lines="full">
                    <IonLabel position="stacked">Property Type *</IonLabel>
                    <IonSelect
                      value={form.property_type}
                      interface="popover"
                      onIonChange={(e) =>
                        updateForm("property_type", e.detail.value)
                      }
                    >
                      <IonSelectOption value="house">House</IonSelectOption>
                      <IonSelectOption value="land">Land</IonSelectOption>
                      <IonSelectOption value="apartment">
                        Apartment
                      </IonSelectOption>
                      <IonSelectOption value="commercial">
                        Commercial
                      </IonSelectOption>
                    </IonSelect>
                  </IonItem>

                  <IonItem lines="full">
                    <IonLabel position="stacked">Size (sqm) *</IonLabel>
                    <IonInput
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={form.size}
                      placeholder="450"
                      onIonChange={(e) =>
                        updateForm("size", e.detail.value)
                      }
                    />
                  </IonItem>

                  <IonItem lines="none">
                    <IonLabel position="stacked">Status</IonLabel>
                    <IonSelect
                      value={form.status}
                      interface="popover"
                      onIonChange={(e) =>
                        updateForm("status", e.detail.value)
                      }
                    >
                      <IonSelectOption value="Available">
                        Available
                      </IonSelectOption>
                      <IonSelectOption value="Pending">Pending</IonSelectOption>
                      <IonSelectOption value="Rented">Rented</IonSelectOption>
                      <IonSelectOption value="Sold">Sold</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                </IonCardContent>
              </IonCard>

              {/* Location Card */}
              <IonCard
                style={{
                  marginBottom: 16,
                  borderRadius: 16,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                }}
              >
                <IonCardContent>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 5,
                    }}
                  >
                    <IonIcon
                      icon={mapOutline}
                      color="primary"
                      style={{ fontSize: 23 }}
                    />
                    <div>
                      <strong style={{ fontSize: 17 }}>
                        Property Location
                      </strong>
                      <div
                        style={{
                          color: "#777",
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        Select the exact location on the map
                      </div>
                    </div>
                  </div>

                  <p
                    style={{
                      color: "#667085",
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    Tap anywhere on the map to place the property marker. You
                    can also use your device&apos;s current location.
                  </p>

                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={useCurrentLocation}
                    disabled={isGettingLocation || saving}
                  >
                    {isGettingLocation ? (
                      <>
                        <IonSpinner
                          name="crescent"
                          style={{ marginRight: 8 }}
                        />
                        Finding Location...
                      </>
                    ) : (
                      <>
                        <IonIcon slot="start" icon={locateOutline} />
                        Use My Current Location
                      </>
                    )}
                  </IonButton>

                  {/* Only render map when modal is open to avoid Leaflet issues */}
                  {showModal && (
                    <div
                      style={{
                        height: 320,
                        width: "100%",
                        marginTop: 14,
                        borderRadius: 14,
                        overflow: "hidden",
                        border: "1px solid #d9dee7",
                      }}
                    >
                      <MapContainer
                        center={mapPosition || DEFAULT_CENTER}
                        zoom={13}
                        style={{ height: "100%", width: "100%" }}
                        scrollWheelZoom
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationPicker
                          position={mapPosition}
                          setPosition={setMapPosition}
                        />
                        <MapCenter position={mapPosition} />
                      </MapContainer>
                    </div>
                  )}

                  {mapPosition ? (
                    <div
                      style={{
                        marginTop: 12,
                        padding: "10px 12px",
                        background: "#f0fdf4",
                        borderRadius: 10,
                        border: "1px solid #bbf7d0",
                      }}
                    >
                      <IonText color="success">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          <IonIcon icon={checkmarkCircleOutline} />
                          Location selected
                        </div>
                      </IonText>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#555",
                          marginTop: 5,
                        }}
                      >
                        Latitude: {mapPosition[0].toFixed(6)}
                        <br />
                        Longitude: {mapPosition[1].toFixed(6)}
                      </div>
                    </div>
                  ) : (
                    <IonNote
                      color="warning"
                      style={{ display: "block", marginTop: 10 }}
                    >
                      Please select the property location on the map.
                    </IonNote>
                  )}
                </IonCardContent>
              </IonCard>

              {/* Images Card */}
              <IonCard
                style={{
                  marginBottom: 16,
                  borderRadius: 16,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                }}
              >
                <IonCardContent>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 5,
                    }}
                  >
                    <IonIcon
                      icon={imageOutline}
                      color="primary"
                      style={{ fontSize: 23 }}
                    />
                    <div>
                      <strong style={{ fontSize: 17 }}>Property Images</strong>
                      <div
                        style={{
                          color: "#777",
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        {editingId
                          ? "Upload new images (optional – existing ones stay)"
                          : "Add clear photos of the property"}
                      </div>
                    </div>
                  </div>

                  <p style={{ color: "#667085", fontSize: 13 }}>
                    Maximum {MAX_IMAGES} images. Each image must be 5MB or
                    smaller.
                  </p>

                  <div
                    style={{
                      padding: 16,
                      border: "2px dashed #cbd5e1",
                      borderRadius: 12,
                      background: "#f8fafc",
                    }}
                  >
                    <input
                      id="admin-property-images"
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageChange}
                      disabled={saving}
                      style={{ width: "100%", fontSize: 13 }}
                    />
                  </div>

                  {images.length > 0 && (
                    <IonChip color="success" style={{ marginTop: 12 }}>
                      <IonIcon icon={checkmarkCircleOutline} />
                      <IonLabel>
                        {images.length} image
                        {images.length !== 1 ? "s" : ""} selected
                      </IonLabel>
                    </IonChip>
                  )}

                  {images.length > 0 && (
                    <IonGrid style={{ padding: "10px 0 0" }}>
                      <IonRow>
                        {images.map((file, index) => (
                          <IonCol
                            size="6"
                            sizeMd="4"
                            key={`${file.name}-${index}`}
                          >
                            <div
                              style={{
                                position: "relative",
                                borderRadius: 12,
                                overflow: "hidden",
                                background: "#eee",
                                aspectRatio: "1 / 1",
                              }}
                            >
                              <img
                                src={imagePreviews[index]}
                                alt={`Preview ${index + 1}`}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  display: "block",
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                disabled={saving}
                                aria-label={`Remove image ${index + 1}`}
                                style={{
                                  position: "absolute",
                                  top: 7,
                                  right: 7,
                                  width: 32,
                                  height: 32,
                                  border: "none",
                                  borderRadius: "50%",
                                  background: "rgba(0,0,0,0.7)",
                                  color: "#fff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                }}
                              >
                                <IonIcon icon={trashOutline} />
                              </button>
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  padding: 7,
                                  background:
                                    "linear-gradient(transparent, rgba(0,0,0,.7))",
                                  color: "#fff",
                                  fontSize: 10,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {file.name}
                              </div>
                            </div>
                          </IonCol>
                        ))}
                      </IonRow>
                    </IonGrid>
                  )}
                </IonCardContent>
              </IonCard>

              {/* Submit */}
              <IonButton
                expand="block"
                size="large"
                onClick={saveProperty}
                disabled={saving}
                style={{ marginTop: 8 }}
              >
                {saving ? (
                  <>
                    <IonSpinner
                      name="crescent"
                      style={{ marginRight: 10 }}
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <IonIcon slot="start" icon={checkmarkCircleOutline} />
                    {editingId !== null
                      ? "Update Property"
                      : "Publish Property"}
                  </>
                )}
              </IonButton>

              <IonButton
                expand="block"
                fill="clear"
                color="medium"
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Delete confirmation – FIXED (no icon prop) */}
        <IonAlert
          isOpen={!!deleteAlert}
          header="Delete Property"
          message={
            deleteAlert
              ? `Are you sure you want to permanently delete "${deleteAlert.title}"? This action cannot be undone.`
              : ""
          }
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
              handler: () => setDeleteAlert(null),
            },
            {
              text: "Delete",
              role: "destructive",
              handler: () => {
                if (deleteAlert) deleteProperty(deleteAlert.id);
              },
            },
          ]}
          onDidDismiss={() => setDeleteAlert(null)}
        />

        {/* Toast */}
        <IonToast
          isOpen={!!toast}
          message={toast?.message || ""}
          color={toast?.color || "primary"}
          duration={3000}
          position="top"
          onDidDismiss={() => setToast(null)}
        />
      </IonContent>
    </IonPage>
  );
}