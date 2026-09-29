import React, { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonInput,
  IonButton,
  IonItem,
  IonLabel,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  useIonRouter,
  useIonToast,
  IonMenu,
  IonMenuButton,
  IonButtons,
  IonList,
  IonIcon,
  IonMenuToggle,
  IonText,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonNote,
  IonAlert,
} from "@ionic/react";

import {
  homeOutline,
  addCircleOutline,
  listOutline,
  logOutOutline,
  personOutline,
  locateOutline,
  mapOutline,
  imageOutline,
  trashOutline,
  checkmarkCircleOutline,
  arrowBackOutline,
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
   CONFIGURATION
========================================================= */

const API_URL = "http://localhost:5001";

const DEFAULT_CENTER: [number, number] = [-13.9626, 33.7741];

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

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

type PropertyType =
  | "house"
  | "land"
  | "apartment"
  | "commercial";

type ListingType = "sale" | "rent";

interface PropertyForm {
  title: string;
  description: string;
  location: string;
  price: string;
  property_type: PropertyType;
  size: string;
  listing_type: ListingType;
  latitude: number | null;
  longitude: number | null;
}

/* =========================================================
   INITIAL FORM
========================================================= */

const INITIAL_FORM: PropertyForm = {
  title: "",
  description: "",
  location: "",
  price: "",
  property_type: "house",
  size: "",
  listing_type: "sale",
  latitude: null,
  longitude: null,
};

/* =========================================================
   MAP CENTER COMPONENT
========================================================= */

function MapCenter({
  position,
}: {
  position: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, {
        duration: 1,
      });
    }
  }, [position, map]);

  return null;
}

/* =========================================================
   MAP LOCATION PICKER
========================================================= */

function LocationPicker({
  position,
  setPosition,
}: {
  position: [number, number] | null;
  setPosition: (position: [number, number]) => void;
}) {
  useMapEvents({
    click(event) {
      setPosition([
        event.latlng.lat,
        event.latlng.lng,
      ]);
    },
  });

  if (!position) {
    return null;
  }

  return <Marker position={position} />;
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function AddProperty() {
  const router = useIonRouter();

  const [presentToast] = useIonToast();

  const [form, setForm] =
    useState<PropertyForm>(INITIAL_FORM);

  const [images, setImages] = useState<File[]>([]);

  const [imagePreviews, setImagePreviews] =
    useState<string[]>([]);

  const [mapPosition, setMapPosition] =
    useState<[number, number] | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isGettingLocation, setIsGettingLocation] =
    useState(false);

  const [showLeaveAlert, setShowLeaveAlert] =
    useState(false);

  /* =======================================================
     TOAST
  ======================================================= */

  const showToast = (
    message: string,
    color:
      | "success"
      | "danger"
      | "warning"
      | "medium" = "danger"
  ) => {
    presentToast({
      message,
      color,
      duration: 3000,
      position: "top",
    });
  };

  /* =======================================================
     CHECK AUTHENTICATION
  ======================================================= */

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      showToast(
        "Your session has expired. Please login again.",
        "warning"
      );

      router.push("/login", "root", "replace");
    }
  }, [router]);

  /* =======================================================
     SYNC MAP WITH FORM
  ======================================================= */

  useEffect(() => {
    if (!mapPosition) {
      return;
    }

    setForm((previous) => ({
      ...previous,
      latitude: mapPosition[0],
      longitude: mapPosition[1],
    }));
  }, [mapPosition]);

  /* =======================================================
     IMAGE PREVIEWS
  ======================================================= */

  useEffect(() => {
    const previews = images.map((file) =>
      URL.createObjectURL(file)
    );

    setImagePreviews(previews);

    return () => {
      previews.forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, [images]);

  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const handleChange = (
    field: keyof PropertyForm,
    value: string | null | undefined
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value ?? "",
    }));
  };

  /* =======================================================
     IMAGE SELECTION
  ======================================================= */

  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = event.target.files;

    if (!selectedFiles) {
      return;
    }

    const files = Array.from(selectedFiles);

    if (files.length > MAX_IMAGES) {
      showToast(
        `You can upload a maximum of ${MAX_IMAGES} images.`,
        "warning"
      );

      event.target.value = "";
      return;
    }

    const invalidType = files.find(
      (file) => !file.type.startsWith("image/")
    );

    if (invalidType) {
      showToast(
        "Only image files are allowed.",
        "danger"
      );

      event.target.value = "";
      return;
    }

    const oversizedFile = files.find(
      (file) => file.size > MAX_IMAGE_SIZE
    );

    if (oversizedFile) {
      showToast(
        "Each image must be 5MB or smaller.",
        "warning"
      );

      event.target.value = "";
      return;
    }

    setImages(files);

    showToast(
      `${files.length} image(s) selected.`,
      "success"
    );
  };

  /* =======================================================
     REMOVE IMAGE
  ======================================================= */

  const removeImage = (index: number) => {
    setImages((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== index)
    );
  };

  /* =======================================================
     CURRENT LOCATION
  ======================================================= */

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast(
        "Geolocation is not supported by this device.",
        "danger"
      );
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];

        setMapPosition(coordinates);

        setIsGettingLocation(false);

        showToast(
          "Your current location has been selected.",
          "success"
        );
      },
      (error) => {
        console.error(
          "Geolocation error:",
          error
        );

        setIsGettingLocation(false);

        let message =
          "Unable to determine your location.";

        if (error.code === 1) {
          message =
            "Location permission was denied.";
        }

        if (error.code === 2) {
          message =
            "Your location could not be determined.";
        }

        if (error.code === 3) {
          message =
            "Location request timed out.";
        }

        showToast(message, "warning");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  /* =======================================================
     FORM VALIDATION
  ======================================================= */

  const validateForm = (): boolean => {
    const title = form.title.trim();
    const location = form.location.trim();

    if (!title) {
      showToast(
        "Please enter a property title.",
        "warning"
      );
      return false;
    }

    if (title.length < 3) {
      showToast(
        "Property title must contain at least 3 characters.",
        "warning"
      );
      return false;
    }

    if (!location) {
      showToast(
        "Please enter the property address.",
        "warning"
      );
      return false;
    }

    const price = Number(form.price);

    if (
      !form.price ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      showToast(
        "Please enter a valid property price.",
        "warning"
      );
      return false;
    }

    const size = Number(form.size);

    if (
      !form.size ||
      !Number.isFinite(size) ||
      size <= 0
    ) {
      showToast(
        "Please enter a valid property size.",
        "warning"
      );
      return false;
    }

    if (images.length === 0) {
      showToast(
        "Please select at least one property image.",
        "warning"
      );
      return false;
    }

    if (!mapPosition) {
      showToast(
        "Please select the property location on the map.",
        "warning"
      );
      return false;
    }

    return true;
  };

  /* =======================================================
     CHECK WHETHER FORM HAS DATA
  ======================================================= */

  const hasUnsavedChanges = useMemo(() => {
    return (
      form.title.trim() !== "" ||
      form.description.trim() !== "" ||
      form.location.trim() !== "" ||
      form.price.trim() !== "" ||
      form.size.trim() !== "" ||
      images.length > 0 ||
      mapPosition !== null
    );
  }, [form, images, mapPosition]);

  /* =======================================================
     RESET FORM
  ======================================================= */

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setImages([]);
    setMapPosition(null);

    const fileInput =
      document.getElementById(
        "property-images"
      ) as HTMLInputElement | null;

    if (fileInput) {
      fileInput.value = "";
    }
  };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    router.push(
      "/login",
      "root",
      "replace"
    );
  };

  /* =======================================================
     SUBMIT PROPERTY
  ======================================================= */

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      showToast(
        "Your session has expired. Please login again.",
        "warning"
      );

      router.push(
        "/login",
        "root",
        "replace"
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      formData.append(
        "title",
        form.title.trim()
      );

      formData.append(
        "description",
        form.description.trim()
      );

      formData.append(
        "location",
        form.location.trim()
      );

      formData.append(
        "price",
        String(Number(form.price))
      );

      formData.append(
        "property_type",
        form.property_type
      );

      formData.append(
        "size",
        String(Number(form.size))
      );

      formData.append(
        "listing_type",
        form.listing_type
      );

      formData.append(
        "status",
        "available"
      );

      if (
        form.latitude !== null &&
        form.longitude !== null
      ) {
        formData.append(
          "latitude",
          String(form.latitude)
        );

        formData.append(
          "longitude",
          String(form.longitude)
        );
      }

      images.forEach((file) => {
        formData.append(
          "images",
          file
        );
      });

      console.log(
        "Submitting property..."
      );

      const response = await fetch(
        `${API_URL}/api/properties`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data =
        await response
          .json()
          .catch(() => ({}));

      console.log(
        "Property API response:",
        data
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");

        showToast(
          "Your session has expired. Please login again.",
          "warning"
        );

        router.push(
          "/login",
          "root",
          "replace"
        );

        return;
      }

      if (response.status === 403) {
        showToast(
          data.error ||
            data.message ||
            "You do not have permission to add properties.",
          "danger"
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to create property."
        );
      }

      showToast(
        "Property added successfully!",
        "success"
      );

      resetForm();

      setTimeout(() => {
        router.push(
          "/agent/properties",
          "root",
          "replace"
        );
      }, 1000);
    } catch (error) {
      console.error(
        "Property submission error:",
        error
      );

      if (
        error instanceof TypeError &&
        error.message.includes("fetch")
      ) {
        showToast(
          "Unable to connect to the server. Make sure the backend is running.",
          "danger"
        );
      } else {
        showToast(
          error instanceof Error
            ? error.message
            : "Unable to submit property.",
          "danger"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =======================================================
     BACK BUTTON
  ======================================================= */

  const handleBack = () => {
    if (isSubmitting) {
      return;
    }

    if (hasUnsavedChanges) {
      setShowLeaveAlert(true);
      return;
    }

    router.push(
      "/agent/properties",
      "back"
    );
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      {/* =====================================================
          AGENT SIDE MENU
      ===================================================== */}

      <IonMenu
        contentId="add-property-content"
        type="overlay"
      >
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>
              Agent Menu
            </IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <IonList>
            <IonMenuToggle autoHide>
              <IonItem
                button
                routerLink="/agent/dashboard"
                routerDirection="root"
                detail={false}
              >
                <IonIcon
                  slot="start"
                  icon={homeOutline}
                />

                <IonLabel>
                  Dashboard
                </IonLabel>
              </IonItem>
            </IonMenuToggle>

            <IonMenuToggle autoHide>
              <IonItem
                button
                routerLink="/agent/properties"
                routerDirection="root"
                detail={false}
              >
                <IonIcon
                  slot="start"
                  icon={listOutline}
                />

                <IonLabel>
                  My Properties
                </IonLabel>
              </IonItem>
            </IonMenuToggle>

            <IonMenuToggle autoHide>
              <IonItem
                button
                routerLink="/agent/add-property"
                routerDirection="forward"
                detail={false}
              >
                <IonIcon
                  slot="start"
                  icon={addCircleOutline}
                  color="primary"
                />

                <IonLabel color="primary">
                  Add Property
                </IonLabel>
              </IonItem>
            </IonMenuToggle>

            <IonMenuToggle autoHide>
              <IonItem
                button
                routerLink="/agent/profile"
                routerDirection="forward"
                detail={false}
              >
                <IonIcon
                  slot="start"
                  icon={personOutline}
                />

                <IonLabel>
                  My Profile
                </IonLabel>
              </IonItem>
            </IonMenuToggle>

            <IonItem
              button
              detail={false}
              lines="none"
              onClick={handleLogout}
            >
              <IonIcon
                slot="start"
                icon={logOutOutline}
                color="danger"
              />

              <IonLabel color="danger">
                Logout
              </IonLabel>
            </IonItem>
          </IonList>
        </IonContent>
      </IonMenu>

      {/* =====================================================
          MAIN PAGE
      ===================================================== */}

      <IonPage id="add-property-content">
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>

            <IonTitle>
              Add Property
            </IonTitle>

            <IonButtons slot="end">
              <IonButton
                onClick={handleBack}
                disabled={isSubmitting}
              >
                <IonIcon
                  slot="icon-only"
                  icon={arrowBackOutline}
                />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent
          fullscreen
          style={{
            "--background": "#f5f7fa",
          } as React.CSSProperties}
        >
          {/* =================================================
              PAGE INTRO
          ================================================= */}

          <div
            style={{
              padding: "20px 16px 5px",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: "24px",
                fontWeight: 700,
                color: "#172033",
              }}
            >
              List a Property
            </h1>

            <p
              style={{
                marginTop: "7px",
                marginBottom: 0,
                color: "#667085",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              Enter the property details, select its
              exact location and upload high-quality
              images.
            </p>
          </div>

          {/* =================================================
              PROPERTY DETAILS CARD
          ================================================= */}

          <IonCard
            style={{
              margin: "16px",
              borderRadius: "16px",
              boxShadow:
                "0 4px 20px rgba(0,0,0,0.06)",
            }}
          >
            <IonCardContent>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "14px",
                }}
              >
                <IonIcon
                  icon={homeOutline}
                  color="primary"
                  style={{
                    fontSize: "23px",
                  }}
                />

                <div>
                  <strong
                    style={{
                      fontSize: "17px",
                    }}
                  >
                    Property Details
                  </strong>

                  <div
                    style={{
                      color: "#777",
                      fontSize: "12px",
                      marginTop: "2px",
                    }}
                  >
                    Basic information about the property
                  </div>
                </div>
              </div>

              {/* TITLE */}

              <IonItem lines="full">
                <IonLabel position="stacked">
                  Property Title *
                </IonLabel>

                <IonInput
                  value={form.title}
                  placeholder="e.g. Luxury 4 Bedroom House"
                  maxlength={150}
                  onIonChange={(event) =>
                    handleChange(
                      "title",
                      event.detail.value
                    )
                  }
                />
              </IonItem>

              {/* DESCRIPTION */}

              <IonItem lines="full">
                <IonLabel position="stacked">
                  Description
                </IonLabel>

                <IonTextarea
                  value={form.description}
                  placeholder="Describe the property, features, nearby facilities, condition, etc."
                  rows={5}
                  maxlength={2000}
                  autoGrow
                  onIonChange={(event) =>
                    handleChange(
                      "description",
                      event.detail.value
                    )
                  }
                />
              </IonItem>

              {/* LOCATION */}

              <IonItem lines="full">
                <IonLabel position="stacked">
                  Address / Area *
                </IonLabel>

                <IonInput
                  value={form.location}
                  placeholder="e.g. Area 49, Lilongwe"
                  maxlength={255}
                  onIonChange={(event) =>
                    handleChange(
                      "location",
                      event.detail.value
                    )
                  }
                />
              </IonItem>

              {/* PRICE */}

              <IonItem lines="full">
                <IonLabel position="stacked">
                  Price (MWK) *
                </IonLabel>

                <IonInput
                  type="number"
                  inputmode="decimal"
                  min="0"
                  value={form.price}
                  placeholder="8500000"
                  onIonChange={(event) =>
                    handleChange(
                      "price",
                      event.detail.value
                    )
                  }
                />
              </IonItem>

              {/* LISTING TYPE */}

              <IonItem lines="full">
                <IonLabel position="stacked">
                  Listing Type *
                </IonLabel>

                <IonSelect
                  value={form.listing_type}
                  interface="popover"
                  onIonChange={(event) =>
                    handleChange(
                      "listing_type",
                      event.detail.value
                    )
                  }
                >
                  <IonSelectOption value="sale">
                    For Sale
                  </IonSelectOption>

                  <IonSelectOption value="rent">
                    For Rent
                  </IonSelectOption>
                </IonSelect>
              </IonItem>

              {/* PROPERTY TYPE */}

              <IonItem lines="full">
                <IonLabel position="stacked">
                  Property Type *
                </IonLabel>

                <IonSelect
                  value={form.property_type}
                  interface="popover"
                  onIonChange={(event) =>
                    handleChange(
                      "property_type",
                      event.detail.value
                    )
                  }
                >
                  <IonSelectOption value="house">
                    House
                  </IonSelectOption>

                  <IonSelectOption value="land">
                    Land
                  </IonSelectOption>

                  <IonSelectOption value="apartment">
                    Apartment
                  </IonSelectOption>

                  <IonSelectOption value="commercial">
                    Commercial
                  </IonSelectOption>
                </IonSelect>
              </IonItem>

              {/* SIZE */}

              <IonItem lines="none">
                <IonLabel position="stacked">
                  Size (sqm) *
                </IonLabel>

                <IonInput
                  type="number"
                  inputmode="decimal"
                  min="0"
                  value={form.size}
                  placeholder="450"
                  onIonChange={(event) =>
                    handleChange(
                      "size",
                      event.detail.value
                    )
                  }
                />
              </IonItem>
            </IonCardContent>
          </IonCard>

          {/* =================================================
              LOCATION CARD
          ================================================= */}

          <IonCard
            style={{
              margin: "16px",
              borderRadius: "16px",
              boxShadow:
                "0 4px 20px rgba(0,0,0,0.06)",
            }}
          >
            <IonCardContent>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "5px",
                }}
              >
                <IonIcon
                  icon={mapOutline}
                  color="primary"
                  style={{
                    fontSize: "23px",
                  }}
                />

                <div>
                  <strong
                    style={{
                      fontSize: "17px",
                    }}
                  >
                    Property Location
                  </strong>

                  <div
                    style={{
                      color: "#777",
                      fontSize: "12px",
                      marginTop: "2px",
                    }}
                  >
                    Select the exact location on the map
                  </div>
                </div>
              </div>

              <p
                style={{
                  color: "#667085",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                Tap anywhere on the map to place the
                property marker. You can also use your
                device's current location.
              </p>

              {/* CURRENT LOCATION */}

              <IonButton
                expand="block"
                fill="outline"
                onClick={useCurrentLocation}
                disabled={
                  isGettingLocation ||
                  isSubmitting
                }
              >
                {isGettingLocation ? (
                  <>
                    <IonSpinner
                      name="crescent"
                      style={{
                        marginRight: "8px",
                      }}
                    />

                    Finding Location...
                  </>
                ) : (
                  <>
                    <IonIcon
                      slot="start"
                      icon={locateOutline}
                    />

                    Use My Current Location
                  </>
                )}
              </IonButton>

              {/* MAP */}

              <div
                style={{
                  height: "320px",
                  width: "100%",
                  marginTop: "14px",
                  borderRadius: "14px",
                  overflow: "hidden",
                  border:
                    "1px solid #d9dee7",
                }}
              >
                <MapContainer
                  center={
                    mapPosition ||
                    DEFAULT_CENTER
                  }
                  zoom={13}
                  style={{
                    height: "100%",
                    width: "100%",
                  }}
                  scrollWheelZoom
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <LocationPicker
                    position={mapPosition}
                    setPosition={
                      setMapPosition
                    }
                  />

                  <MapCenter
                    position={mapPosition}
                  />
                </MapContainer>
              </div>

              {/* COORDINATES */}

              {mapPosition ? (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px 12px",
                    background: "#f0fdf4",
                    borderRadius: "10px",
                    border:
                      "1px solid #bbf7d0",
                  }}
                >
                  <IonText color="success">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                    >
                      <IonIcon
                        icon={
                          checkmarkCircleOutline
                        }
                      />

                      Location selected
                    </div>
                  </IonText>

                  <div
                    style={{
                      fontSize: "11px",
                      color: "#555",
                      marginTop: "5px",
                    }}
                  >
                    Latitude:{" "}
                    {mapPosition[0].toFixed(6)}
                    <br />
                    Longitude:{" "}
                    {mapPosition[1].toFixed(6)}
                  </div>
                </div>
              ) : (
                <IonNote
                  color="warning"
                  style={{
                    display: "block",
                    marginTop: "10px",
                  }}
                >
                  Please select the property location
                  on the map.
                </IonNote>
              )}
            </IonCardContent>
          </IonCard>

          {/* =================================================
              IMAGES CARD
          ================================================= */}

          <IonCard
            style={{
              margin: "16px",
              borderRadius: "16px",
              boxShadow:
                "0 4px 20px rgba(0,0,0,0.06)",
            }}
          >
            <IonCardContent>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "5px",
                }}
              >
                <IonIcon
                  icon={imageOutline}
                  color="primary"
                  style={{
                    fontSize: "23px",
                  }}
                />

                <div>
                  <strong
                    style={{
                      fontSize: "17px",
                    }}
                  >
                    Property Images
                  </strong>

                  <div
                    style={{
                      color: "#777",
                      fontSize: "12px",
                      marginTop: "2px",
                    }}
                  >
                    Add clear photos of the property
                  </div>
                </div>
              </div>

              <p
                style={{
                  color: "#667085",
                  fontSize: "13px",
                }}
              >
                Maximum {MAX_IMAGES} images.
                Each image must be 5MB or smaller.
              </p>

              {/* FILE INPUT */}

              <div
                style={{
                  padding: "16px",
                  border:
                    "2px dashed #cbd5e1",
                  borderRadius: "12px",
                  background: "#f8fafc",
                }}
              >
                <input
                  id="property-images"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    fontSize: "13px",
                  }}
                />
              </div>

              {/* IMAGE COUNT */}

              {images.length > 0 && (
                <IonChip
                  color="success"
                  style={{
                    marginTop: "12px",
                  }}
                >
                  <IonIcon
                    icon={checkmarkCircleOutline}
                  />

                  <IonLabel>
                    {images.length} image
                    {images.length !== 1
                      ? "s"
                      : ""}{" "}
                    selected
                  </IonLabel>
                </IonChip>
              )}

              {/* IMAGE PREVIEW GRID */}

              {images.length > 0 && (
                <IonGrid
                  style={{
                    padding: "10px 0 0",
                  }}
                >
                  <IonRow>
                    {images.map(
                      (file, index) => (
                        <IonCol
                          size="6"
                          sizeMd="4"
                          key={`${file.name}-${index}`}
                        >
                          <div
                            style={{
                              position:
                                "relative",
                              borderRadius:
                                "12px",
                              overflow:
                                "hidden",
                              background:
                                "#eee",
                              aspectRatio:
                                "1 / 1",
                            }}
                          >
                            <img
                              src={
                                imagePreviews[
                                  index
                                ]
                              }
                              alt={`Property preview ${
                                index + 1
                              }`}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit:
                                  "cover",
                                display:
                                  "block",
                              }}
                            />

                            <button
                              type="button"
                              onClick={() =>
                                removeImage(
                                  index
                                )
                              }
                              disabled={
                                isSubmitting
                              }
                              aria-label={`Remove image ${
                                index + 1
                              }`}
                              style={{
                                position:
                                  "absolute",
                                top: "7px",
                                right: "7px",
                                width: "32px",
                                height: "32px",
                                border: "none",
                                borderRadius:
                                  "50%",
                                background:
                                  "rgba(0,0,0,0.7)",
                                color:
                                  "#fff",
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                cursor:
                                  "pointer",
                              }}
                            >
                              <IonIcon
                                icon={
                                  trashOutline
                                }
                              />
                            </button>

                            <div
                              style={{
                                position:
                                  "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                padding:
                                  "7px",
                                background:
                                  "linear-gradient(transparent, rgba(0,0,0,.7))",
                                color:
                                  "#fff",
                                fontSize:
                                  "10px",
                                whiteSpace:
                                  "nowrap",
                                overflow:
                                  "hidden",
                                textOverflow:
                                  "ellipsis",
                              }}
                            >
                              {file.name}
                            </div>
                          </div>
                        </IonCol>
                      )
                    )}
                  </IonRow>
                </IonGrid>
              )}
            </IonCardContent>
          </IonCard>

          {/* =================================================
              SUBMIT CARD
          ================================================= */}

          <div
            style={{
              padding:
                "0 16px 30px",
            }}
          >
            <IonButton
              expand="block"
              size="large"
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                height: "54px",
                "--border-radius":
                  "12px",
                fontWeight: 700,
              } as React.CSSProperties}
            >
              {isSubmitting ? (
                <>
                  <IonSpinner
                    name="crescent"
                    style={{
                      marginRight: "10px",
                    }}
                  />

                  Publishing Property...
                </>
              ) : (
                <>
                  <IonIcon
                    slot="start"
                    icon={
                      checkmarkCircleOutline
                    }
                  />

                  Publish Property
                </>
              )}
            </IonButton>

            <IonText color="medium">
              <p
                style={{
                  textAlign: "center",
                  fontSize: "11px",
                  marginTop: "10px",
                  lineHeight: 1.5,
                }}
              >
                By publishing this property, you
                confirm that the information provided
                is accurate.
              </p>
            </IonText>
          </div>
        </IonContent>
      </IonPage>

      {/* =====================================================
          LEAVE PAGE ALERT
      ===================================================== */}

      <IonAlert
        isOpen={showLeaveAlert}
        header="Discard Changes?"
        message="You have entered property information that has not been submitted. Are you sure you want to leave?"
        buttons={[
          {
            text: "Stay",
            role: "cancel",
          },
          {
            text: "Leave",
            role: "destructive",
            handler: () => {
              router.push(
                "/agent/properties",
                "back"
              );
            },
          },
        ]}
        onDidDismiss={() =>
          setShowLeaveAlert(false)
        }
      />
    </>
  );
}