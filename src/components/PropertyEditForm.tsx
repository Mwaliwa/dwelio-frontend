import {
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonImg,
} from "@ionic/react";

interface EditForm {
  title: string;
  description: string;
  location: string;
  price: string;
  listing_type: "sale" | "rent";
  property_type: string;
  size_value: string;
  images?: File[];
}

interface Props {
  value: EditForm;
  onChange: (key: keyof EditForm, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function PropertyEditForm({
  value,
  onChange,
  onSave,
  onCancel,
}: Props) {
  return (
    <>
      {/* TITLE */}
      <IonItem>
        <IonLabel position="stacked">Title</IonLabel>
        <IonInput
          value={value.title}
          onIonChange={(e) =>
            onChange("title", e.detail.value ?? "")
          }
        />
      </IonItem>

      {/* LOCATION */}
      <IonItem>
        <IonLabel position="stacked">Location</IonLabel>
        <IonInput
          value={value.location}
          onIonChange={(e) =>
            onChange("location", e.detail.value ?? "")
          }
        />
      </IonItem>

      {/* PRICE */}
      <IonItem>
        <IonLabel position="stacked">Price</IonLabel>
        <IonInput
          type="number"
          value={value.price}
          onIonChange={(e) =>
            onChange("price", e.detail.value ?? "")
          }
        />
      </IonItem>

      {/* LISTING TYPE */}
      <IonItem>
        <IonLabel position="stacked">Listing Type</IonLabel>
        <IonSelect
          value={value.listing_type}
          onIonChange={(e) =>
            onChange("listing_type", e.detail.value ?? "sale")
          }
        >
          <IonSelectOption value="sale">Sale</IonSelectOption>
          <IonSelectOption value="rent">Rent</IonSelectOption>
        </IonSelect>
      </IonItem>

      {/* PROPERTY TYPE */}
      <IonItem>
        <IonLabel position="stacked">Property Type</IonLabel>
        <IonSelect
          value={value.property_type}
          onIonChange={(e) =>
            onChange("property_type", e.detail.value ?? "")
          }
        >
          <IonSelectOption value="house">House</IonSelectOption>
          <IonSelectOption value="land">Land</IonSelectOption>
          <IonSelectOption value="apartment">Apartment</IonSelectOption>
          <IonSelectOption value="commercial">
            Commercial
          </IonSelectOption>
        </IonSelect>
      </IonItem>

      {/* SIZE */}
      <IonItem>
        <IonLabel position="stacked">Size (sqm)</IonLabel>
        <IonInput
          type="number"
          value={value.size_value}
          onIonChange={(e) =>
            onChange("size_value", e.detail.value ?? "")
          }
        />
      </IonItem>

      {/* DESCRIPTION */}
      <IonItem>
        <IonLabel position="stacked">Description</IonLabel>
        <IonTextarea
          value={value.description}
          onIonChange={(e) =>
            onChange("description", e.detail.value ?? "")
          }
        />
      </IonItem>

      {/* =========================
          IMAGE UPLOAD (UPGRADED)
      ========================= */}
      <IonItem>
        <IonLabel position="stacked">
          Update Images (Optional)
        </IonLabel>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              onChange("images", Array.from(files));
            }
          }}
          style={{
            marginTop: "10px",
            width: "100%",
          }}
        />
      </IonItem>

      {/* =========================
          IMAGE PREVIEW (NEW FEATURE)
      ========================= */}
      {value.images && value.images.length > 0 && (
        <div style={{ margin: "10px 0" }}>
          <p style={{ color: "green", fontWeight: "bold" }}>
            {value.images.length} image(s) selected
          </p>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {value.images.map((file, index) => (
              <IonImg
                key={index}
                src={URL.createObjectURL(file)}
                style={{
                  width: "80px",
                  height: "80px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ACTION BUTTONS */}
      <IonButton expand="block" onClick={onSave}>
        Save Changes
      </IonButton>

      <IonButton expand="block" color="medium" onClick={onCancel}>
        Cancel
      </IonButton>
    </>
  );
}