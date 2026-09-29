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
  IonIcon,
  IonAlert,
  IonTextarea,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonLabel,
} from "@ionic/react";

import { useEffect, useState } from "react";
import { useIonRouter } from "@ionic/react";
import { useParams } from "react-router-dom";
import { arrowBack, createOutline, trashOutline } from "ionicons/icons";

interface Property {
  id: number;
  title: string;
  description: string;
  location: string;
  price: number | string;
  listing_type: "sale" | "rent";
  image?: string;
  size_value?: number;
  property_type: string;
  status?: string;
}

export default function PropertyDetail() {
  const router = useIonRouter();
  const { id } = useParams<{ id: string }>();

  const [property, setProperty] = useState<Property | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [editedProperty, setEditedProperty] = useState<Property | null>(null);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/properties/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setProperty(data);
      setEditedProperty(data);

      if (data.image) {
        const imgList = data.image.split(",").map((img: string) => 
          img.startsWith("/") ? img : `/${img}`
        );
        setImages(imgList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedProperty) return;

    try {
      const res = await fetch(`http://localhost:5001/api/properties/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedProperty),
      });

      if (res.ok) {
        setProperty(editedProperty);
        setIsEditing(false);
        alert("Property updated successfully!");
      } else {
        alert("Failed to update property");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/properties/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Property deleted successfully");
        router.push("/agent/properties");
      } else {
        alert("Failed to delete property");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  if (loading) return <div style={{ textAlign: "center", marginTop: 100 }}><IonSpinner /></div>;

  if (!property) return <h2>Property not found</h2>;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButton slot="start" fill="clear" onClick={() => router.goBack()}>
            <IonIcon icon={arrowBack} />
          </IonButton>
          <IonTitle>Property Details</IonTitle>
          
          {!isEditing && (
            <IonButton slot="end" fill="clear" onClick={() => setIsEditing(true)}>
              <IonIcon icon={createOutline} />
            </IonButton>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Images */}
        {images.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            {images.map((img, index) => (
              <IonImg
                key={index}
                src={`http://localhost:5001${img}`}
                style={{
                  width: "100%",
                  height: index === 0 ? "260px" : "160px",
                  objectFit: "cover",
                  borderRadius: "12px",
                  marginBottom: "10px",
                }}
              />
            ))}
          </div>
        )}

        <IonCard>
          <IonCardContent>
            {isEditing ? (
              // ==================== EDIT MODE ====================
              <>
                <IonInput
                  label="Title"
                  value={editedProperty?.title}
                  onIonChange={(e) => setEditedProperty(prev => prev ? {...prev, title: e.detail.value!} : null)}
                />
                <IonTextarea
                  label="Description"
                  value={editedProperty?.description}
                  onIonChange={(e) => setEditedProperty(prev => prev ? {...prev, description: e.detail.value!} : null)}
                />
                <IonInput
                  label="Location"
                  value={editedProperty?.location}
                  onIonChange={(e) => setEditedProperty(prev => prev ? {...prev, location: e.detail.value!} : null)}
                />
                <IonInput
                  label="Price"
                  type="number"
                  value={editedProperty?.price}
                  onIonChange={(e) => setEditedProperty(prev => prev ? {...prev, price: e.detail.value!} : null)}
                />
                <IonSelect
                  label="Listing Type"
                  value={editedProperty?.listing_type}
                  onIonChange={(e) => setEditedProperty(prev => prev ? {...prev, listing_type: e.detail.value as "sale" | "rent"} : null)}
                >
                  <IonSelectOption value="sale">For Sale</IonSelectOption>
                  <IonSelectOption value="rent">For Rent</IonSelectOption>
                </IonSelect>

                <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                  <IonButton expand="block" onClick={handleSave}>Save Changes</IonButton>
                  <IonButton expand="block" color="medium" onClick={() => { setIsEditing(false); setEditedProperty(property); }}>
                    Cancel
                  </IonButton>
                </div>
              </>
            ) : (
              // ==================== VIEW MODE ====================
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h1>{property.title}</h1>
                  <IonBadge color={property.listing_type === "rent" ? "warning" : "success"}>
                    {property.listing_type.toUpperCase()}
                  </IonBadge>
                </div>

                <p style={{ fontSize: "1.5em", fontWeight: "bold", color: "#3880ff" }}>
                  K {parseFloat(String(property.price)).toLocaleString()}
                </p>

                <p><strong>Location:</strong> {property.location}</p>
                <p><strong>Type:</strong> {property.property_type}</p>
                {property.size_value && <p><strong>Size:</strong> {property.size_value} sqm</p>}

                <h3 style={{ marginTop: "20px" }}>Description</h3>
                <p style={{ lineHeight: "1.7" }}>{property.description || "No description available."}</p>

                <div style={{ marginTop: "30px", display: "flex", gap: "12px" }}>
                  <IonButton 
                    expand="block" 
                    color="danger" 
                    onClick={() => setShowDeleteAlert(true)}
                  >
                    <IonIcon icon={trashOutline} slot="start" />
                    Delete Property
                  </IonButton>
                </div>
              </>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>

      {/* Delete Confirmation */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Delete Property"
        message="Are you sure you want to delete this property? This action cannot be undone."
        buttons={[
          { text: "Cancel", role: "cancel" },
          { text: "Delete", role: "destructive", handler: handleDelete }
        ]}
      />
    </IonPage>
  );
}