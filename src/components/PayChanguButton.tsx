import React, { useState } from "react";
import {
  IonButton,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonText,
  IonSpinner,
  IonNote,
  useIonToast,
} from "@ionic/react";
import { flashOutline, closeOutline, phonePortraitOutline } from "ionicons/icons";

interface PayChanguButtonProps {
  amount: number;
  currency?: string;
  description: string;
  propertyId?: string;
  bookingId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  onSuccess?: (reference: string) => void;
  onError?: (error: string) => void;
  expand?: "block" | "full" | undefined;
  size?: "small" | "default" | "large";
}

const PayChanguButton: React.FC<PayChanguButtonProps> = ({
  amount,
  currency = "MWK",
  description,
  propertyId,
  bookingId,
  customerName = "",
  customerEmail = "",
  customerPhone = "",
  onSuccess,
  onError,
  expand = "block",
  size = "default",
}) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState(customerPhone);
  const [provider, setProvider] = useState<"airtel" | "tnm">("airtel");
  const [present] = useIonToast();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-MW", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(value);

  const handlePay = async () => {
    if (!phone || phone.length < 9) {
      present({
        message: "Please enter a valid phone number",
        duration: 2500,
        color: "danger",
      });
      return;
    }

    setLoading(true);

    try {
      // ============================================
      // TODO: Replace this with your real PayChangu API call
      // ============================================
      // Example:
      // const response = await fetch("https://your-backend.com/api/paychangu/initiate", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     amount,
      //     currency,
      //     description,
      //     phone,
      //     provider,           // "airtel" or "tnm"
      //     propertyId,
      //     bookingId,
      //     customerName,
      //     customerEmail,
      //   }),
      // });
      // const data = await response.json();

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1800));

      // Mock successful response
      const mockReference = `PCG-${Math.floor(1000000 + Math.random() * 9000000)}`;

      present({
        message: `Payment initiated! Reference: ${mockReference}`,
        duration: 3500,
        color: "success",
      });

      setShowModal(false);
      onSuccess?.(mockReference);
    } catch (err: any) {
      const message = err?.message || "Payment failed. Please try again.";
      present({
        message,
        duration: 3000,
        color: "danger",
      });
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <IonButton
        expand={expand}
        size={size}
        color="success"
        onClick={() => setShowModal(true)}
        style={{ fontWeight: 600 }}
      >
        <IonIcon icon={flashOutline} slot="start" />
        Pay with PayChangu • {formatCurrency(amount)}
      </IonButton>

      {/* Payment Modal */}
      <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Pay with PayChangu</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowModal(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          {/* Amount Summary */}
          <div
            style={{
              textAlign: "center",
              padding: "24px 16px",
              background: "linear-gradient(135deg, #0f766e, #14b8a6)",
              borderRadius: 14,
              color: "white",
              marginBottom: 24,
            }}
          >
            <p style={{ margin: 0, opacity: 0.9, fontSize: 14 }}>Amount to Pay</p>
            <h1 style={{ margin: "8px 0", fontSize: "2rem", fontWeight: 700 }}>
              {formatCurrency(amount)}
            </h1>
            <p style={{ margin: 0, opacity: 0.85, fontSize: 14 }}>{description}</p>
          </div>

          {/* Mobile Money Provider */}
          <IonItem lines="full" style={{ marginBottom: 12, borderRadius: 10 }}>
            <IonLabel position="stacked">Mobile Money Provider</IonLabel>
            <IonSelect
              value={provider}
              onIonChange={(e) => setProvider(e.detail.value)}
              interface="action-sheet"
            >
              <IonSelectOption value="airtel">Airtel Money</IonSelectOption>
              <IonSelectOption value="tnm">TNM Mpamba</IonSelectOption>
            </IonSelect>
          </IonItem>

          {/* Phone Number */}
          <IonItem lines="full" style={{ marginBottom: 8, borderRadius: 10 }}>
            <IonIcon icon={phonePortraitOutline} slot="start" color="medium" />
            <IonLabel position="stacked">Phone Number</IonLabel>
            <IonInput
              type="tel"
              placeholder="e.g. 0991 234 567"
              value={phone}
              onIonInput={(e) => setPhone(e.detail.value!)}
            />
          </IonItem>

          <IonNote style={{ display: "block", margin: "4px 0 20px 12px", fontSize: 13 }}>
            Enter the number registered with {provider === "airtel" ? "Airtel Money" : "TNM Mpamba"}
          </IonNote>

          {/* Pay Button */}
          <IonButton
            expand="block"
            size="large"
            color="success"
            onClick={handlePay}
            disabled={loading}
            style={{ fontWeight: 600, marginTop: 8 }}
          >
            {loading ? (
              <>
                <IonSpinner name="crescent" style={{ marginRight: 10 }} />
                Processing...
              </>
            ) : (
              <>
                <IonIcon icon={flashOutline} slot="start" />
                Pay {formatCurrency(amount)}
              </>
            )}
          </IonButton>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <IonText color="medium">
              <p style={{ fontSize: 13, margin: 0 }}>
                Secured by <strong>PayChangu</strong>
              </p>
            </IonText>
          </div>
        </IonContent>
      </IonModal>
    </>
  );
};

export default PayChanguButton;