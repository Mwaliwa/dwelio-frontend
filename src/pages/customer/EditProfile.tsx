import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonAvatar,
  IonIcon,
  IonSpinner,
  IonText,
  IonCard,
  IonCardContent,
  useIonToast,
  useIonRouter,
} from "@ionic/react";

import {
  cameraOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
} from "ionicons/icons";

/* =========================================================
   CONFIG
========================================================= */

const API_URL = "http://localhost:5001";

/* =========================================================
   TYPES
========================================================= */

interface User {
  id?: number | string;
  userId?: number | string;
  user_id?: number | string;

  name?: string;
  full_name?: string;

  email?: string;

  phone?: string;
  phone_number?: string;

  avatar?: string;
  profile_image?: string;

  role?: string;
}

interface ApiResponse {
  success?: boolean;
  message?: string;
  error?: string;
  avatar?: string;
  user?: User;
  data?: {
    user?: User;
  };
}

/* =========================================================
   HELPERS
========================================================= */

const getStoredUser = (): User => {
  try {
    const userString = localStorage.getItem("user");
    if (!userString) return {};
    const parsed = JSON.parse(userString);
    return parsed || {};
  } catch (error) {
    console.error("Failed to parse stored user:", error);
    return {};
  }
};

const getToken = (): string | null => {
  return localStorage.getItem("token");
};

/* =========================================================
   COMPONENT
========================================================= */

const EditProfile: React.FC = () => {
  const router = useIonRouter();
  const [presentToast] = useIonToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* =====================================================
     STATE
  ===================================================== */

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState(
    "https://i.pravatar.cc/150?u=default"
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  /* =====================================================
     LOAD USER
  ===================================================== */

  useEffect(() => {
    try {
      const user = getStoredUser();

      setName(
        user.name ||
          user.full_name ||
          localStorage.getItem("name") ||
          ""
      );

      setEmail(
        user.email || localStorage.getItem("email") || ""
      );

      setPhone(
        user.phone ||
          user.phone_number ||
          localStorage.getItem("phone") ||
          ""
      );

      const storedAvatar =
        user.avatar ||
        user.profile_image ||
        localStorage.getItem("avatar");

      if (storedAvatar) {
        setAvatar(storedAvatar);
      }
    } catch (error) {
      console.error("LOAD USER ERROR:", error);
      setErrorMessage("Unable to load your profile.");
    } finally {
      setInitialLoading(false);
    }
  }, []);

  /* =====================================================
     CHANGE PHOTO
  ===================================================== */

  const handleChangePhoto = () => {
    if (loading) return;
    fileInputRef.current?.click();
  };

  /* =====================================================
     FILE CHANGE
  ===================================================== */

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      presentToast({
        message: "Please select a valid image.",
        duration: 2500,
        color: "warning",
      });
      event.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      presentToast({
        message: "Image is too large. Maximum size is 5MB.",
        duration: 2500,
        color: "warning",
      });
      event.target.value = "";
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatar(reader.result);
      }
    };
    reader.onerror = () => {
      presentToast({
        message: "Unable to preview the selected image.",
        duration: 2500,
        color: "danger",
      });
    };
    reader.readAsDataURL(file);
  };

  /* =====================================================
     VALIDATE FORM
  ===================================================== */

  const validateForm = (): boolean => {
    setErrorMessage("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setErrorMessage("Full name is required.");
      presentToast({
        message: "Full name is required.",
        duration: 2500,
        color: "warning",
      });
      return false;
    }

    if (trimmedName.length < 2) {
      setErrorMessage("Please enter your full name.");
      presentToast({
        message: "Please enter your full name.",
        duration: 2500,
        color: "warning",
      });
      return false;
    }

    if (!trimmedEmail) {
      setErrorMessage("Email address is required.");
      presentToast({
        message: "Email address is required.",
        duration: 2500,
        color: "warning",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      presentToast({
        message: "Please enter a valid email address.",
        duration: 2500,
        color: "warning",
      });
      return false;
    }

    if (trimmedPhone && trimmedPhone.length < 7) {
      setErrorMessage("Please enter a valid phone number.");
      presentToast({
        message: "Please enter a valid phone number.",
        duration: 2500,
        color: "warning",
      });
      return false;
    }

    return true;
  };

  /* =====================================================
     SAVE PROFILE
  ===================================================== */

  const handleSave = async () => {
    if (loading) return;
    if (!validateForm()) return;

    const token = getToken();

    if (!token) {
      presentToast({
        message: "Your session has expired. Please log in again.",
        duration: 3000,
        color: "danger",
      });
      router.push("/login", "root");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      // ==================================================
      // 1. UPDATE BASIC PROFILE (name, email, phone)
      // ==================================================

      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
        }),
      });

      const rawResponse = await response.text();
      let data: ApiResponse = {};

      if (rawResponse) {
        try {
          data = JSON.parse(rawResponse);
        } catch {
          console.error("SERVER RETURNED NON-JSON:", rawResponse);
          throw new Error(
            `Server returned an invalid response (${response.status}).`
          );
        }
      }

      if (!response.ok) {
        console.error("PROFILE UPDATE FAILED:", {
          status: response.status,
          data,
        });

        if (response.status === 401) {
          localStorage.removeItem("token");
          presentToast({
            message: "Your session has expired. Please log in again.",
            duration: 3000,
            color: "danger",
          });
          router.push("/login", "root");
          return;
        }

        if (response.status === 403) {
          throw new Error("You are not authorized to update this profile.");
        }

        if (response.status === 404) {
          throw new Error(
            "Profile update endpoint was not found. Check your backend /api/users/profile route."
          );
        }

        if (response.status === 409) {
          throw new Error(
            data.error ||
              data.message ||
              "That email address is already in use."
          );
        }

        throw new Error(
          data.error ||
            data.message ||
            `Failed to update profile (${response.status}).`
        );
      }

      // ==================================================
      // 2. BUILD UPDATED USER OBJECT
      // ==================================================

      const updatedFromServer = data.user || data.data?.user || {};
      const existingUser = getStoredUser();

      const updatedUser: User = {
        ...existingUser,
        ...updatedFromServer,
        name:
          updatedFromServer.name ||
          updatedFromServer.full_name ||
          name.trim(),
        email: updatedFromServer.email || email.trim(),
        phone:
          updatedFromServer.phone ||
          updatedFromServer.phone_number ||
          phone.trim() ||
          undefined,
      };

      // ==================================================
      // 3. UPLOAD AVATAR (if a new photo was selected)
      // ==================================================

      let finalAvatar =
        updatedUser.avatar ||
        updatedUser.profile_image ||
        avatar;

      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append("avatar", selectedFile); // field name must match backend

          const avatarResponse = await fetch(
            `${API_URL}/api/users/avatar`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                // Do NOT set Content-Type
              },
              body: formData,
            }
          );

          const avatarRaw = await avatarResponse.text();
          let avatarData: ApiResponse = {};

          if (avatarRaw) {
            try {
              avatarData = JSON.parse(avatarRaw);
            } catch {
              throw new Error(
                `Invalid response from avatar endpoint (${avatarResponse.status})`
              );
            }
          }

          if (!avatarResponse.ok) {
            throw new Error(
              avatarData.error ||
                avatarData.message ||
                `Failed to upload avatar (${avatarResponse.status})`
            );
          }

          const uploadedUrl =
            avatarData.avatar ||
            avatarData.user?.avatar ||
            avatarData.user?.profile_image ||
            null;

          if (uploadedUrl) {
            finalAvatar = uploadedUrl;
            updatedUser.avatar = uploadedUrl;
            updatedUser.profile_image = uploadedUrl;
            setAvatar(uploadedUrl);
          }
        } catch (uploadError) {
          console.error("Avatar upload failed:", uploadError);

          // Profile text was already saved – just warn about the photo
          presentToast({
            message:
              "Profile saved, but photo upload failed. Please try again.",
            duration: 3500,
            color: "warning",
            icon: alertCircleOutline,
          });
        }
      }

      // ==================================================
      // 4. SAVE TO LOCALSTORAGE
      // ==================================================

      if (finalAvatar && !finalAvatar.startsWith("data:")) {
        localStorage.setItem("avatar", finalAvatar);
      } else if (!finalAvatar) {
        localStorage.removeItem("avatar");
      }

      updatedUser.avatar = finalAvatar;
      updatedUser.profile_image = finalAvatar;

      localStorage.setItem("user", JSON.stringify(updatedUser));
      localStorage.setItem("name", updatedUser.name || "");
      localStorage.setItem("email", updatedUser.email || "");

      if (updatedUser.phone) {
        localStorage.setItem("phone", updatedUser.phone);
      } else {
        localStorage.removeItem("phone");
      }

      // ==================================================
      // 5. SUCCESS
      // ==================================================

      presentToast({
        message: selectedFile
          ? "Profile and photo updated successfully."
          : "Profile updated successfully.",
        duration: 3000,
        color: "success",
        icon: checkmarkCircleOutline,
      });

      setSelectedFile(null);

      setTimeout(() => {
        if (router.canGoBack()) {
          router.goBack();
        } else {
          router.push("/customer/profile", "back");
        }
      }, 600);
    } catch (error) {
      console.error("EDIT PROFILE ERROR:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to update profile.";

      setErrorMessage(message);

      presentToast({
        message,
        duration: 3500,
        color: "danger",
        icon: alertCircleOutline,
      });
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     INITIAL LOADING
  ===================================================== */

  if (initialLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/customer/profile" />
            </IonButtons>
            <IonTitle>Edit Profile</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <div
            style={{
              height: "70vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <IonSpinner />
            <IonText color="medium">Loading profile...</IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/customer/profile" />
          </IonButtons>
          <IonTitle>Edit Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div
          style={{
            maxWidth: "650px",
            margin: "0 auto",
            padding: "20px 16px 40px",
          }}
        >
          {/* PROFILE PHOTO */}
          <div
            className="ion-text-center"
            style={{ marginBottom: "25px" }}
          >
            <div
              style={{
                position: "relative",
                width: "110px",
                height: "110px",
                margin: "0 auto 12px",
              }}
            >
              <IonAvatar
                style={{
                  width: "110px",
                  height: "110px",
                  cursor: loading ? "default" : "pointer",
                  border: "3px solid var(--ion-color-primary)",
                }}
                onClick={handleChangePhoto}
              >
                <img
                  src={avatar}
                  alt="Profile"
                  onError={(event) => {
                    (event.currentTarget as HTMLImageElement).src =
                      "https://i.pravatar.cc/150?u=default";
                  }}
                />
              </IonAvatar>

              <button
                type="button"
                onClick={handleChangePhoto}
                disabled={loading}
                style={{
                  position: "absolute",
                  right: "-3px",
                  bottom: "-3px",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: "3px solid var(--ion-background-color)",
                  background: "var(--ion-color-primary)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <IonIcon icon={cameraOutline} />
              </button>
            </div>

            <IonButton
              fill="clear"
              size="small"
              onClick={handleChangePhoto}
              disabled={loading}
            >
              <IonIcon icon={cameraOutline} slot="start" />
              Change Photo
            </IonButton>

            {selectedFile && (
              <IonText color="medium">
                <p style={{ fontSize: "12px", margin: "2px 0 0" }}>
                  {selectedFile.name}
                </p>
              </IonText>
            )}
          </div>

          {/* ERROR */}
          {errorMessage && (
            <IonCard color="danger" style={{ margin: "0 0 20px" }}>
              <IonCardContent>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                  }}
                >
                  <IonIcon
                    icon={alertCircleOutline}
                    style={{ fontSize: "22px" }}
                  />
                  <IonText>
                    <strong>Unable to save</strong>
                    <p style={{ margin: "5px 0 0" }}>{errorMessage}</p>
                  </IonText>
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {/* FORM */}
          <IonList
            inset
            style={{ borderRadius: "16px", overflow: "hidden" }}
          >
            <IonItem>
              <IonLabel position="stacked">Full Name *</IonLabel>
              <IonInput
                value={name}
                disabled={loading}
                autocomplete="name"
                placeholder="Enter your full name"
                onIonInput={(event) =>
                  setName(event.detail.value || "")
                }
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Email *</IonLabel>
              <IonInput
                type="email"
                value={email}
                disabled={loading}
                autocomplete="email"
                placeholder="Enter your email"
                onIonInput={(event) =>
                  setEmail(event.detail.value || "")
                }
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Phone</IonLabel>
              <IonInput
                type="tel"
                value={phone}
                disabled={loading}
                autocomplete="tel"
                placeholder="Enter your phone number"
                onIonInput={(event) =>
                  setPhone(event.detail.value || "")
                }
              />
            </IonItem>
          </IonList>

          {/* SAVE */}
          <div style={{ marginTop: "25px" }}>
            <IonButton
              expand="block"
              size="large"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? (
                <>
                  <IonSpinner
                    name="crescent"
                    style={{ marginRight: "10px" }}
                  />
                  Saving...
                </>
              ) : (
                <>
                  <IonIcon icon={checkmarkCircleOutline} slot="start" />
                  Save Changes
                </>
              )}
            </IonButton>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </IonContent>
    </IonPage>
  );
};

export default EditProfile;