import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  IonList,
  IonItem,
  IonTextarea,
  IonLabel,
  IonButtons,
  IonToast,
  IonAlert,
  IonText,
} from "@ionic/react";
import { useIonRouter } from "@ionic/react";
import { useParams } from "react-router-dom";
import {
  arrowBack,
  createOutline,
  trashOutline,
  star,
  starOutline,
  heart,
  heartOutline,
  chatbubbleOutline,
  locationOutline,
  cashOutline,
  homeOutline,
  resizeOutline,
  refreshOutline,
} from "ionicons/icons";

import PropertyEditForm from "../components/PropertyEditForm";
import PropertyDeleteAlert from "../components/PropertyDeleteAlert";
import { startChat as startChatService } from "../services/chatService";

/* =========================================================
   CONFIG
========================================================= */

const API_URL = "http://localhost:5001";

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect fill='%23e5e7eb' width='600' height='400'/%3E%3Ctext fill='%236b7280' font-family='sans-serif' font-size='22' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

/* =========================================================
   TYPES
========================================================= */

interface Property {
  id: number;
  title: string;
  description?: string;
  location: string;
  price: number | string;
  listing_type: "sale" | "rent";
  image?: string | null;
  images?: string[];
  size_value?: number | string;
  property_type?: string;
  agent_id?: number;
  user_id?: number;
  landlord_id?: number;
  owner_id?: number;
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at?: string;
  user_name?: string;
}

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

interface ApiErrorResponse {
  message?: string;
  error?: string;
  details?: string;
}

/* =========================================================
   HELPERS
========================================================= */

const getToken = (): string | null => localStorage.getItem("token");

const getRole = (): string =>
  (localStorage.getItem("role") || "").toLowerCase();

const getAuthHeaders = (): HeadersInit => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return { message: text } as T;
  }
}

const getErrorMessage = (data: any, fallback: string): string =>
  data?.message || data?.error || data?.details || fallback;

/* =========================================================
   COMPONENT
========================================================= */

const PropertyDetails: React.FC = () => {
  const router = useIonRouter();
  const { id } = useParams<{ id: string }>();

  /* -------------------------------------------------------
     AUTH
  ------------------------------------------------------- */

  const token = getToken();
  const role = getRole();
  const isLoggedIn = Boolean(token);
  const isAgent = ["agent", "landlord"].includes(role);

  /* -------------------------------------------------------
     STATE
  ------------------------------------------------------- */

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [togglingFavorite, setTogglingFavorite] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [deletingProperty, setDeletingProperty] = useState(false);
  const [updatingProperty, setUpdatingProperty] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  const [editForm, setEditForm] = useState<EditForm>({
    title: "",
    description: "",
    location: "",
    price: "",
    listing_type: "sale",
    property_type: "",
    size_value: "",
    images: [],
  });

  /* -------------------------------------------------------
     DERIVED
  ------------------------------------------------------- */

  const propertyId = useMemo(() => {
    if (!id) return null;
    const parsed = Number(id);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [id]);

  const normalizeImages = useCallback(
    (current: Property | null): string[] => {
      if (!current) return [];

      let raw: string[] = [];

      if (Array.isArray(current.images) && current.images.length > 0) {
        raw = current.images;
      } else if (current.image) {
        raw = current.image
          .split(",")
          .map((img) => img.trim())
          .filter((img) => img && img !== "null" && img !== "undefined");
      }

      return raw.filter(Boolean).map((image) => {
        if (
          image.startsWith("http://") ||
          image.startsWith("https://") ||
          image.startsWith("data:")
        ) {
          return image;
        }
        if (image.startsWith("houses/") || image.startsWith("properties/")) {
          return `${API_URL}/uploads/${image}`;
        }
        return `${API_URL}/uploads/houses/${image}`;
      });
    },
    []
  );

  const images = useMemo(
    () => normalizeImages(property),
    [property, normalizeImages]
  );

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    const total = reviews.reduce(
      (sum, r) => sum + Number(r.rating || 0),
      0
    );
    return total / reviews.length;
  }, [reviews]);

  /* -------------------------------------------------------
     FETCHERS
  ------------------------------------------------------- */

  const fetchProperty = useCallback(async () => {
    if (!propertyId) {
      setPageError("Invalid property ID.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setPageError("");

      const response = await fetch(
        `${API_URL}/api/properties/${propertyId}`
      );
      const data = await parseResponse<Property & ApiErrorResponse>(
        response
      );

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to load property.")
        );
      }

      setProperty(data);

      setEditForm({
        title: data.title || "",
        description: data.description || "",
        location: data.location || "",
        price: String(data.price ?? ""),
        listing_type: data.listing_type || "sale",
        property_type: data.property_type || "",
        size_value: String(data.size_value ?? ""),
        images: [],
      });
    } catch (error: any) {
      console.error("FETCH PROPERTY ERROR:", error);
      setProperty(null);
      setPageError(error?.message || "Unable to load property.");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  const fetchReviews = useCallback(async () => {
    if (!propertyId) {
      setReviews([]);
      setLoadingReviews(false);
      return;
    }

    try {
      setLoadingReviews(true);
      const response = await fetch(
        `${API_URL}/api/reviews/property/${propertyId}`
      );
      const data = await parseResponse<Review[] | ApiErrorResponse>(
        response
      );

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to load reviews.")
        );
      }

      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("FETCH REVIEWS ERROR:", error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, [propertyId]);

  const checkFavorite = useCallback(async () => {
    if (!propertyId || !isLoggedIn || !token) {
      setIsFavorited(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/favorites/check/${propertyId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) return;

      const data = await parseResponse<{ isFavorite?: boolean }>(
        response
      );
      setIsFavorited(Boolean(data.isFavorite));
    } catch (error) {
      console.error("CHECK FAVORITE ERROR:", error);
    }
  }, [propertyId, isLoggedIn, token]);

  useEffect(() => {
    fetchProperty();
    fetchReviews();
  }, [fetchProperty, fetchReviews]);

  useEffect(() => {
    checkFavorite();
  }, [checkFavorite]);

  /* -------------------------------------------------------
     ACTIONS
  ------------------------------------------------------- */

  const handleStartChat = async () => {
    if (!token) {
      setToastMessage("Please log in to chat with the agent.");
      return;
    }
    if (!property || startingChat) return;

    setStartingChat(true);

    try {
      const conversation = await startChatService(property.id);

      const chatId =
        (conversation as any)?.id ||
        (conversation as any)?.conversationId ||
        (conversation as any)?.conversation?.id;

      if (!chatId) {
        throw new Error(
          "Chat was created, but the server did not return a chat ID."
        );
      }

      router.push(`/customer/chat/${chatId}`);
    } catch (error: any) {
      console.error("START CHAT ERROR:", error);
      setToastMessage(
        error?.message || "Failed to start chat. Please try again."
      );
    } finally {
      setStartingChat(false);
    }
  };

  const toggleFavorite = async () => {
    if (!token) {
      setToastMessage("Please log in to favorite properties.");
      return;
    }
    if (!propertyId || togglingFavorite) return;

    setTogglingFavorite(true);
    const previous = isFavorited;

    try {
      setIsFavorited(!previous);

      const url = previous
        ? `${API_URL}/api/favorites/${propertyId}`
        : `${API_URL}/api/favorites`;

      const method = previous ? "DELETE" : "POST";

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        ...(method === "POST"
          ? { body: JSON.stringify({ property_id: propertyId }) }
          : {}),
      });

      const data = await parseResponse<ApiErrorResponse>(response);

      if (!response.ok) {
        setIsFavorited(previous);
        throw new Error(
          getErrorMessage(data, "Failed to update favorite.")
        );
      }

      setToastMessage(
        previous ? "Removed from favorites." : "Added to favorites."
      );
    } catch (error: any) {
      console.error("FAVORITE ERROR:", error);
      setToastMessage(error?.message || "Unable to update favorite.");
    } finally {
      setTogglingFavorite(false);
    }
  };

  const handleReviewChange = (
    field: "rating" | "comment",
    value: number | string
  ) => {
    setReviewForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitReview = async () => {
    if (!token) {
      setToastMessage("Please log in to submit a review.");
      return;
    }
    if (!propertyId) return;
    if (reviewForm.rating < 1 || reviewForm.rating > 5) {
      setToastMessage("Please select a rating.");
      return;
    }
    if (!reviewForm.comment.trim()) {
      setToastMessage("Please write a comment.");
      return;
    }
    if (submittingReview) return;

    setSubmittingReview(true);

    try {
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          property_id: propertyId,
          rating: reviewForm.rating,
          comment: reviewForm.comment.trim(),
        }),
      });

      const data = await parseResponse<ApiErrorResponse>(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to submit review.")
        );
      }

      setReviewForm({ rating: 0, comment: "" });
      await fetchReviews();
      setToastMessage("Review submitted successfully.");
    } catch (error: any) {
      console.error("SUBMIT REVIEW ERROR:", error);
      setToastMessage(error?.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleChange = <K extends keyof EditForm>(
    key: K,
    value: EditForm[K]
  ) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpdate = async () => {
    if (!propertyId || updatingProperty) return;

    setUpdatingProperty(true);

    try {
      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("description", editForm.description);
      formData.append("location", editForm.location);
      formData.append("price", editForm.price);
      formData.append("listing_type", editForm.listing_type);
      formData.append("property_type", editForm.property_type);
      formData.append("size_value", editForm.size_value);

      if (editForm.images?.length) {
        editForm.images.forEach((file) =>
          formData.append("images", file)
        );
      }

      const response = await fetch(
        `${API_URL}/api/properties/${propertyId}`,
        { method: "PUT", body: formData }
      );

      const data = await parseResponse<Property & ApiErrorResponse>(
        response
      );

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to update property.")
        );
      }

      setProperty((prev) => (prev ? { ...prev, ...data } : prev));
      setIsEditing(false);
      await fetchProperty();
      setToastMessage("Property updated successfully.");
    } catch (error: any) {
      console.error("UPDATE PROPERTY ERROR:", error);
      setToastMessage(error?.message || "Failed to update property.");
    } finally {
      setUpdatingProperty(false);
    }
  };

  const handleDelete = async () => {
    if (!propertyId || deletingProperty) return;

    setDeletingProperty(true);

    try {
      const response = await fetch(
        `${API_URL}/api/properties/${propertyId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token || ""}` },
        }
      );

      const data = await parseResponse<ApiErrorResponse>(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to delete property.")
        );
      }

      setShowDelete(false);
      setToastMessage("Property deleted successfully.");

      setTimeout(() => {
        router.push("/agent/properties");
      }, 700);
    } catch (error: any) {
      console.error("DELETE PROPERTY ERROR:", error);
      setToastMessage(error?.message || "Failed to delete property.");
    } finally {
      setDeletingProperty(false);
    }
  };

  const handleRetry = async () => {
    await Promise.all([fetchProperty(), fetchReviews()]);
    await checkFavorite();
  };

  /* -------------------------------------------------------
     LOADING
  ------------------------------------------------------- */

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonButton onClick={() => router.goBack()}>
                <IonIcon icon={arrowBack} />
              </IonButton>
            </IonButtons>
            <IonTitle>Property Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="center-state">
            <IonSpinner name="crescent" />
            <p>Loading property…</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  /* -------------------------------------------------------
     NOT FOUND
  ------------------------------------------------------- */

  if (!property) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonButton onClick={() => router.goBack()}>
                <IonIcon icon={arrowBack} />
              </IonButton>
            </IonButtons>
            <IonTitle>Property Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="center-state">
            <IonIcon icon={homeOutline} className="empty-icon" />
            <h2>Property not found</h2>
            <p>{pageError || "We could not load this property."}</p>
            <IonButton onClick={handleRetry}>
              <IonIcon icon={refreshOutline} slot="start" />
              Try Again
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <IonPage>
      <IonHeader className="details-header">
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton onClick={() => router.goBack()}>
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>Property Details</IonTitle>
          <IonButtons slot="end">
            {isLoggedIn && !isAgent && (
              <IonButton
                fill="clear"
                onClick={toggleFavorite}
                disabled={togglingFavorite}
                aria-label={
                  isFavorited ? "Remove from favorites" : "Add to favorites"
                }
              >
                <IonIcon
                  icon={isFavorited ? heart : heartOutline}
                  color={isFavorited ? "danger" : "light"}
                  style={{ fontSize: "1.45rem" }}
                />
              </IonButton>
            )}
            {isAgent && (
              <IonButton
                fill="clear"
                onClick={() => setIsEditing(true)}
                disabled={updatingProperty}
              >
                <IonIcon icon={createOutline} color="light" />
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* ========== GALLERY ========== */}
        {images.length > 0 ? (
          <div className="gallery">
            {images.map((image, index) => (
              <IonImg
                key={`${image}-${index}`}
                src={image}
                alt={`${property.title} – image ${index + 1}`}
                className="gallery-image"
                onIonError={(e) => {
                  const target = e.target as HTMLIonImgElement;
                  if (target.src !== PLACEHOLDER) {
                    target.src = PLACEHOLDER;
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <IonCard className="no-image-card">
            <IonCardContent className="no-image-content">
              <IonIcon icon={homeOutline} className="empty-icon" />
              <p>No images available</p>
            </IonCardContent>
          </IonCard>
        )}

        {/* ========== INFO ========== */}
        {!isEditing && (
          <IonCard className="info-card">
            <IonCardContent>
              <IonBadge
                color={
                  property.listing_type === "rent" ? "secondary" : "success"
                }
              >
                {property.listing_type === "rent" ? "FOR RENT" : "FOR SALE"}
              </IonBadge>

              <h1 className="property-title">{property.title}</h1>

              <div className="rating-row">
                <IonBadge color="warning">
                  ⭐ {avgRating.toFixed(1)}
                </IonBadge>
                <IonText color="medium">
                  {reviews.length} review
                  {reviews.length !== 1 ? "s" : ""}
                </IonText>
              </div>

              <div className="meta-row">
                <IonIcon icon={cashOutline} color="success" />
                <strong className="price">
                  K {Number(property.price).toLocaleString()}
                </strong>
              </div>

              <div className="meta-row">
                <IonIcon icon={locationOutline} color="primary" />
                <span>{property.location}</span>
              </div>

              {property.property_type && (
                <div className="meta-row">
                  <IonIcon icon={homeOutline} color="primary" />
                  <span>
                    <strong>Type:</strong> {property.property_type}
                  </span>
                </div>
              )}

              {property.size_value && (
                <div className="meta-row">
                  <IonIcon icon={resizeOutline} color="primary" />
                  <span>
                    <strong>Size:</strong> {property.size_value}
                  </span>
                </div>
              )}

              {property.description && (
                <div className="description-block">
                  <h3>Description</h3>
                  <p>{property.description}</p>
                </div>
              )}

              {/* Chat CTA */}
              {isLoggedIn && !isAgent && (
                <IonButton
                  expand="block"
                  color="primary"
                  onClick={handleStartChat}
                  disabled={startingChat}
                  className="cta-button"
                >
                  {startingChat ? (
                    <>
                      <IonSpinner name="crescent" />
                      <span style={{ marginLeft: 10 }}>
                        Starting chat…
                      </span>
                    </>
                  ) : (
                    <>
                      <IonIcon icon={chatbubbleOutline} slot="start" />
                      Chat with Agent
                    </>
                  )}
                </IonButton>
              )}

              {/* Delete (agent) */}
              {isAgent && (
                <IonButton
                  color="danger"
                  expand="block"
                  fill="outline"
                  onClick={() => setShowDelete(true)}
                  disabled={deletingProperty}
                  className="delete-button"
                >
                  {deletingProperty ? (
                    <IonSpinner name="crescent" />
                  ) : (
                    <>
                      <IonIcon icon={trashOutline} slot="start" />
                      Delete Property
                    </>
                  )}
                </IonButton>
              )}
            </IonCardContent>
          </IonCard>
        )}

        {/* ========== REVIEWS ========== */}
        {!isEditing && (
          <IonCard className="reviews-card">
            <IonCardContent>
              <div className="section-header">
                <h2>Customer Reviews</h2>
                {reviews.length > 0 && (
                  <IonBadge color="primary">{reviews.length}</IonBadge>
                )}
              </div>

              {loadingReviews ? (
                <div className="center-inline">
                  <IonSpinner />
                </div>
              ) : reviews.length === 0 ? (
                <div className="center-inline">
                  <IonText color="medium">
                    <p>No reviews yet.</p>
                  </IonText>
                </div>
              ) : (
                <IonList lines="none" className="review-list">
                  {reviews.map((review) => (
                    <IonItem key={review.id} className="review-item">
                      <div className="review-body">
                        <div className="review-top">
                          <div className="stars">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <IonIcon
                                key={n}
                                icon={
                                  n <= review.rating ? star : starOutline
                                }
                                color="warning"
                              />
                            ))}
                          </div>
                          {review.user_name && (
                            <IonText color="medium">
                              <small>{review.user_name}</small>
                            </IonText>
                          )}
                        </div>
                        <p className="review-comment">{review.comment}</p>
                        {review.created_at && (
                          <IonText color="medium">
                            <small>
                              {new Date(
                                review.created_at
                              ).toLocaleDateString()}
                            </small>
                          </IonText>
                        )}
                      </div>
                    </IonItem>
                  ))}
                </IonList>
              )}

              {/* Write review */}
              {isLoggedIn && !isAgent && (
                <div className="write-review">
                  <h3>Write a Review</h3>
                  <IonLabel>Rating</IonLabel>
                  <div className="rating-picker">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <IonIcon
                        key={n}
                        icon={
                          n <= reviewForm.rating ? star : starOutline
                        }
                        color={
                          n <= reviewForm.rating ? "warning" : "medium"
                        }
                        className="rating-star"
                        onClick={() => handleReviewChange("rating", n)}
                      />
                    ))}
                  </div>

                  <IonTextarea
                    label="Your Review"
                    labelPlacement="stacked"
                    fill="outline"
                    placeholder="Share your experience…"
                    value={reviewForm.comment}
                    rows={5}
                    onIonChange={(e) =>
                      handleReviewChange("comment", e.detail.value || "")
                    }
                  />

                  <IonButton
                    expand="block"
                    onClick={submitReview}
                    disabled={
                      submittingReview ||
                      reviewForm.rating === 0 ||
                      !reviewForm.comment.trim()
                    }
                    className="submit-review-btn"
                  >
                    {submittingReview ? (
                      <IonSpinner name="crescent" />
                    ) : (
                      "Submit Review"
                    )}
                  </IonButton>
                </div>
              )}
            </IonCardContent>
          </IonCard>
        )}

        {/* ========== EDIT MODE ========== */}
        {isEditing && (
          <IonCard className="edit-card">
            <IonCardContent>
              <h2>Edit Property</h2>
              <PropertyEditForm
                value={editForm}
                onChange={handleChange}
                onSave={handleUpdate}
                onCancel={() => setIsEditing(false)}
              />
              {updatingProperty && (
                <div className="center-inline" style={{ marginTop: 16 }}>
                  <IonSpinner />
                </div>
              )}
            </IonCardContent>
          </IonCard>
        )}

        <div style={{ height: 32 }} />
      </IonContent>

      <PropertyDeleteAlert
        isOpen={showDelete}
        onCancel={() => setShowDelete(false)}
        onDelete={handleDelete}
      />

      <IonAlert
        isOpen={showErrorAlert}
        onDidDismiss={() => setShowErrorAlert(false)}
        header="Error"
        message={pageError || "Something went wrong."}
        buttons={[{ text: "OK", role: "cancel" }]}
      />

      <IonToast
        isOpen={Boolean(toastMessage)}
        message={toastMessage}
        duration={3000}
        position="bottom"
        onDidDismiss={() => setToastMessage("")}
      />

      <style>{`
        .details-header {
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        }

        /* Center states */
        .center-state {
          min-height: 70vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 32px 24px;
          color: var(--ion-color-medium);
          gap: 12px;
        }

        .center-state h2 {
          margin: 0;
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--ion-text-color);
        }

        .center-inline {
          text-align: center;
          padding: 28px 0;
        }

        .empty-icon {
          font-size: 56px;
          opacity: 0.4;
        }

        /* Gallery */
        .gallery {
          display: flex;
          overflow-x: auto;
          gap: 12px;
          padding: 16px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
        }

        .gallery-image {
          min-width: min(85vw, 560px);
          width: min(85vw, 560px);
          height: 280px;
          border-radius: 16px;
          object-fit: cover;
          background: #e5e7eb;
          scroll-snap-align: start;
          flex-shrink: 0;
        }

        .no-image-card {
          margin: 16px;
          border-radius: 16px;
        }

        .no-image-content {
          text-align: center;
          padding: 48px 20px;
        }

        /* Info card */
        .info-card,
        .reviews-card,
        .edit-card {
          margin: 0 16px 16px;
          border-radius: 16px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
        }

        .property-title {
          margin: 12px 0 8px;
          font-size: 1.55rem;
          font-weight: 700;
          line-height: 1.3;
        }

        .rating-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 18px;
        }

        .meta-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          font-size: 0.95rem;
        }

        .price {
          font-size: 1.35rem;
        }

        .description-block {
          margin-top: 22px;
        }

        .description-block h3 {
          margin: 0 0 8px;
          font-size: 1.05rem;
        }

        .description-block p {
          margin: 0;
          line-height: 1.7;
          white-space: pre-line;
          color: var(--ion-color-dark);
        }

        .cta-button {
          margin-top: 24px;
          height: 50px;
        }

        .delete-button {
          margin-top: 16px;
        }

        /* Reviews */
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }

        .section-header h2 {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 600;
        }

        .review-list {
          background: transparent;
          padding: 0;
        }

        .review-item {
          --background: #f8fafc;
          border-radius: 12px;
          margin-bottom: 10px;
          --padding-start: 14px;
          --inner-padding-end: 14px;
        }

        .review-body {
          width: 100%;
          padding: 10px 0;
        }

        .review-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stars {
          display: flex;
          gap: 3px;
        }

        .review-comment {
          margin: 10px 0 6px;
          line-height: 1.55;
        }

        .write-review {
          margin-top: 28px;
          padding-top: 8px;
          border-top: 1px solid var(--ion-color-light-shade);
        }

        .write-review h3 {
          margin: 0 0 12px;
        }

        .rating-picker {
          display: flex;
          gap: 10px;
          margin: 10px 0 18px;
        }

        .rating-star {
          font-size: 30px;
          cursor: pointer;
        }

        .submit-review-btn {
          margin-top: 14px;
        }

        /* Desktop */
        @media (min-width: 768px) {
          .gallery,
          .info-card,
          .reviews-card,
          .edit-card,
          .no-image-card {
            max-width: 820px;
            margin-left: auto;
            margin-right: auto;
          }
        }
      `}</style>
    </IonPage>
  );
};

export default PropertyDetails;