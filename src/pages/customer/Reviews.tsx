import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonIcon,
  IonText,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonButton,
  IonBadge,
  IonCard,
  IonCardContent,
  IonAvatar,
  useIonToast,
  RefresherEventDetail,
} from "@ionic/react";

import {
  star,
  starOutline,
  chatbubbleOutline,
  refreshOutline,
  homeOutline,
  alertCircleOutline,
  personOutline,
} from "ionicons/icons";

/* =========================================================
   TYPES
========================================================= */

interface Review {
  id: number | string;

  user_id?: number | string;

  property_id?: number | string;

  property?: string;

  property_title?: string;

  property_name?: string;

  title?: string;

  rating: number;

  comment?: string;

  created_at?: string;

  updated_at?: string;

  date?: string;

  user_name?: string;

  user_full_name?: string;

  image?: string;

  property_image?: string;
}

interface ReviewsResponse {
  success?: boolean;

  reviews?: Review[];

  data?: Review[];

  message?: string;

  error?: string;
}

/* =========================================================
   CONFIG
========================================================= */

const API_BASE = "http://localhost:5001";

/* =========================================================
   HELPERS
========================================================= */

const getToken = (): string | null => {
  return localStorage.getItem("token");
};

const getUserId = (): string | null => {
  /*
   --------------------------------------------------------
   Support different authentication storage structures.
   --------------------------------------------------------
  */

  const possibleKeys = [
    "userId",
    "user_id",
    "id",
  ];

  for (const key of possibleKeys) {
    const value = localStorage.getItem(key);

    if (
      value &&
      value !== "null" &&
      value !== "undefined"
    ) {
      return value;
    }
  }

  /*
   --------------------------------------------------------
   Some applications save the complete user object.
   --------------------------------------------------------
  */

  const storedUser =
    localStorage.getItem("user");

  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);

      return String(
        user?.id ||
          user?.userId ||
          user?.user_id ||
          ""
      ) || null;
    } catch {
      return null;
    }
  }

  return null;
};

const getPropertyName = (
  review: Review
): string => {
  return (
    review.property_title ||
    review.property_name ||
    review.property ||
    review.title ||
    "Property"
  );
};

const getReviewDate = (
  review: Review
): string => {
  const rawDate =
    review.created_at ||
    review.date ||
    review.updated_at;

  if (!rawDate) {
    return "";
  }

  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(
    "en-MW",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
};

const getRating = (
  rating: unknown
): number => {
  const numericRating =
    Number(rating);

  if (!Number.isFinite(numericRating)) {
    return 0;
  }

  return Math.min(
    5,
    Math.max(
      0,
      Math.round(numericRating)
    )
  );
};

/* =========================================================
   STAR COMPONENT
========================================================= */

interface StarRatingProps {
  rating: number;
  size?: number;
}

const StarRating: React.FC<
  StarRatingProps
> = ({
  rating,
  size = 17,
}) => {
  const safeRating =
    getRating(rating);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "3px",
      }}
      aria-label={`${safeRating} out of 5 stars`}
    >
      {Array.from(
        { length: 5 },
        (_, index) => {
          const filled =
            index < safeRating;

          return (
            <IonIcon
              key={index}
              icon={
                filled
                  ? star
                  : starOutline
              }
              color="warning"
              style={{
                fontSize: `${size}px`,
              }}
            />
          );
        }
      )}
    </div>
  );
};

/* =========================================================
   REVIEW CARD
========================================================= */

interface ReviewCardProps {
  review: Review;
}

const ReviewCard: React.FC<
  ReviewCardProps
> = ({ review }) => {
  const propertyName =
    getPropertyName(review);

  const rating =
    getRating(review.rating);

  const date =
    getReviewDate(review);

  const comment =
    review.comment?.trim() ||
    "No comment provided.";

  return (
    <IonCard
      style={{
        margin: "0 0 14px 0",
        borderRadius: "18px",
        boxShadow:
          "0 4px 18px rgba(0,0,0,0.08)",
      }}
    >
      <IonCardContent
        style={{
          padding: "18px",
        }}
      >
        {/* =================================================
            PROPERTY HEADER
        ================================================= */}

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <IonAvatar
            style={{
              width: "46px",
              height: "46px",
              background:
                "var(--ion-color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IonIcon
              icon={homeOutline}
              style={{
                fontSize: "23px",
                color: "#fff",
              }}
            />
          </IonAvatar>

          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <h2
              style={{
                margin: "0 0 5px",
                fontSize: "17px",
                fontWeight: 700,
                color:
                  "var(--ion-color-dark)",
                overflow: "hidden",
                textOverflow:
                  "ellipsis",
                whiteSpace:
                  "nowrap",
              }}
            >
              {propertyName}
            </h2>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <StarRating
                rating={rating}
              />

              <IonBadge
                color="warning"
                style={{
                  fontSize: "11px",
                }}
              >
                {rating}/5
              </IonBadge>
            </div>
          </div>
        </div>

        {/* =================================================
            COMMENT
        ================================================= */}

        <div
          style={{
            marginTop: "16px",
            padding: "14px",
            borderRadius: "12px",
            background:
              "var(--ion-color-light)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              lineHeight: 1.6,
              color:
                "var(--ion-color-dark)",
              whiteSpace:
                "pre-wrap",
              wordBreak:
                "break-word",
            }}
          >
            "{comment}"
          </p>
        </div>

        {/* =================================================
            DATE
        ================================================= */}

        {date && (
          <div
            style={{
              marginTop: "12px",
              display: "flex",
              justifyContent:
                "flex-end",
            }}
          >
            <IonNote
              style={{
                fontSize: "12px",
              }}
            >
              Reviewed {date}
            </IonNote>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const Reviews: React.FC =
  () => {
    const [reviews, setReviews] =
      useState<Review[]>([]);

    const [loading, setLoading] =
      useState(true);

    const [error, setError] =
      useState<string | null>(
        null
      );

    const [refreshing, setRefreshing] =
      useState(false);

    const [presentToast] =
      useIonToast();

    /* =====================================================
       FETCH REVIEWS
    ===================================================== */

    const fetchReviews =
      useCallback(
        async (
          showLoading = true
        ) => {
          const controller =
            new AbortController();

          try {
            if (showLoading) {
              setLoading(true);
            }

            setError(null);

            const token =
              getToken();

            if (!token) {
              setReviews([]);

              setError(
                "Your session has expired. Please log in again."
              );

              return;
            }

            /*
             ------------------------------------------------
             Determine the authenticated user's ID.
             ------------------------------------------------
            */

            const userId =
              getUserId();

            let url =
              `${API_BASE}/api/reviews`;

            /*
             ------------------------------------------------
             Prefer the authenticated user's endpoint.
             ------------------------------------------------
            */

            if (userId) {
              url =
                `${API_BASE}/api/reviews/user/${encodeURIComponent(
                  userId
                )}`;
            }

            const response =
              await fetch(
                url,
                {
                  method: "GET",

                  headers: {
                    Accept:
                      "application/json",

                    Authorization:
                      `Bearer ${token}`,
                  },

                  signal:
                    controller.signal,
                }
              );

            /*
             ------------------------------------------------
             Authentication errors
             ------------------------------------------------
            */

            if (
              response.status ===
              401
            ) {
              localStorage.removeItem(
                "token"
              );

              setReviews([]);

              setError(
                "Your session has expired. Please log in again."
              );

              return;
            }

            if (
              response.status ===
              403
            ) {
              setReviews([]);

              setError(
                "You are not authorized to view these reviews."
              );

              return;
            }

            /*
             ------------------------------------------------
             Parse response
             ------------------------------------------------
            */

            const data:
              | ReviewsResponse
              | Review[]
              = await response
              .json()
              .catch(
                () => ({})
              );

            if (
              !response.ok
            ) {
              const message =
                !Array.isArray(
                  data
                )
                  ? data?.error ||
                    data?.message
                  : null;

              throw new Error(
                message ||
                  `Failed to load reviews (${response.status})`
              );
            }

            /*
             ------------------------------------------------
             Support multiple backend formats.
             ------------------------------------------------
            */

            let list: Review[] =
              [];

            if (
              Array.isArray(
                data
              )
            ) {
              list = data;
            } else if (
              Array.isArray(
                data.reviews
              )
            ) {
              list =
                data.reviews;
            } else if (
              Array.isArray(
                data.data
              )
            ) {
              list =
                data.data;
            }

            /*
             ------------------------------------------------
             Remove malformed records.
             ------------------------------------------------
            */

            const validReviews =
              list.filter(
                (review) =>
                  review &&
                  review.id !==
                    undefined
              );

            setReviews(
              validReviews
            );
          } catch (err) {
            /*
             ------------------------------------------------
             Ignore aborted requests.
             ------------------------------------------------
            */

            if (
              err instanceof
                DOMException &&
              err.name ===
                "AbortError"
            ) {
              return;
            }

            console.error(
              "REVIEWS ERROR:",
              err
            );

            const message =
              err instanceof
              Error
                ? err.message
                : "Unable to load your reviews.";

            setError(
              message
            );

            setReviews([]);
          } finally {
            if (
              showLoading
            ) {
              setLoading(false);
            }

            controller.abort();
          }
        },
        []
      );

    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(() => {
      fetchReviews();

      /*
       ------------------------------------------------------
       Do not return the controller here because fetchReviews
       manages its own request lifecycle.
       ------------------------------------------------------
      */

    }, [fetchReviews]);

    /* =====================================================
       REFRESH
    ===================================================== */

    const handleRefresh =
      async (
        event: CustomEvent<RefresherEventDetail>
      ) => {
        try {
          setRefreshing(
            true
          );

          await fetchReviews(
            false
          );
        } finally {
          setRefreshing(
            false
          );

          event.detail.complete();
        }
      };

    /* =====================================================
       RETRY
    ===================================================== */

    const handleRetry =
      async () => {
        try {
          await fetchReviews(
            true
          );
        } catch {
          /*
           fetchReviews already
           handles errors.
          */
        }
      };

    /* =====================================================
       TOTAL RATING
    ===================================================== */

    const averageRating =
      reviews.length > 0
        ? (
            reviews.reduce(
              (
                total,
                review
              ) =>
                total +
                getRating(
                  review.rating
                ),
              0
            ) /
            reviews.length
          ).toFixed(1)
        : "0.0";

    /* =====================================================
       RENDER
    ===================================================== */

    return (
      <IonPage>
        {/* =================================================
            HEADER
        ================================================= */}

        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton
                defaultHref="/customer/profile"
                text="Profile"
              />
            </IonButtons>

            <IonTitle>
              My Reviews
            </IonTitle>

            <IonButtons slot="end">
              <IonButton
                onClick={
                  handleRetry
                }
                disabled={
                  loading ||
                  refreshing
                }
                aria-label="Refresh reviews"
              >
                <IonIcon
                  slot="icon-only"
                  icon={
                    refreshOutline
                  }
                />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        {/* =================================================
            CONTENT
        ================================================= */}

        <IonContent>
          <IonRefresher
            slot="fixed"
            onIonRefresh={
              handleRefresh
            }
          >
            <IonRefresherContent
              pullingText="Pull to refresh"
              refreshingText="Refreshing reviews..."
            />
          </IonRefresher>

          <div
            style={{
              padding:
                "18px 16px 30px",
              maxWidth:
                "900px",
              margin:
                "0 auto",
            }}
          >
            {/* =================================================
                PAGE INTRO
            ================================================= */}

            {!loading &&
              !error &&
              reviews.length >
                0 && (
                <div
                  style={{
                    marginBottom:
                      "20px",
                  }}
                >
                  <h1
                    style={{
                      margin:
                        "0 0 6px",
                      fontSize:
                        "25px",
                      fontWeight:
                        700,
                    }}
                  >
                    Your Reviews
                  </h1>

                  <p
                    style={{
                      margin:
                        0,
                      color:
                        "var(--ion-color-medium)",
                      fontSize:
                        "14px",
                    }}
                  >
                    Reviews you have
                    left on properties.
                  </p>
                </div>
              )}

            {/* =================================================
                SUMMARY
            ================================================= */}

            {!loading &&
              !error &&
              reviews.length >
                0 && (
                <IonCard
                  style={{
                    margin:
                      "0 0 20px",
                    borderRadius:
                      "18px",
                    boxShadow:
                      "0 4px 18px rgba(0,0,0,0.08)",
                  }}
                >
                  <IonCardContent>
                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "space-between",
                        gap:
                          "20px",
                      }}
                    >
                      <div>
                        <IonNote>
                          Total Reviews
                        </IonNote>

                        <h2
                          style={{
                            margin:
                              "4px 0 0",
                            fontSize:
                              "27px",
                            fontWeight:
                              700,
                          }}
                        >
                          {
                            reviews.length
                          }
                        </h2>
                      </div>

                      <div
                        style={{
                          textAlign:
                            "right",
                        }}
                      >
                        <IonNote>
                          Average Rating
                        </IonNote>

                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "flex-end",
                            gap:
                              "8px",
                            marginTop:
                              "5px",
                          }}
                        >
                          <IonIcon
                            icon={
                              star
                            }
                            color="warning"
                            style={{
                              fontSize:
                                "22px",
                            }}
                          />

                          <strong
                            style={{
                              fontSize:
                                "22px",
                            }}
                          >
                            {
                              averageRating
                            }
                          </strong>
                        </div>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              )}

            {/* =================================================
                LOADING
            ================================================= */}

            {loading && (
              <div
                style={{
                  minHeight:
                    "55vh",
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  justifyContent:
                    "center",
                  alignItems:
                    "center",
                  gap:
                    "12px",
                }}
              >
                <IonSpinner
                  name="crescent"
                />

                <IonText color="medium">
                  Loading your reviews...
                </IonText>
              </div>
            )}

            {/* =================================================
                ERROR
            ================================================= */}

            {!loading &&
              error && (
                <IonCard
                  style={{
                    marginTop:
                      "50px",
                    borderRadius:
                      "18px",
                  }}
                >
                  <IonCardContent
                    className="ion-text-center"
                    style={{
                      padding:
                        "30px 20px",
                    }}
                  >
                    <IonIcon
                      icon={
                        alertCircleOutline
                      }
                      color="danger"
                      style={{
                        fontSize:
                          "54px",
                        marginBottom:
                          "12px",
                      }}
                    />

                    <h2
                      style={{
                        margin:
                          "0 0 8px",
                        fontWeight:
                          700,
                      }}
                    >
                      Unable to load reviews
                    </h2>

                    <IonText color="medium">
                      <p
                        style={{
                          margin:
                            "0 auto 20px",
                          maxWidth:
                            "320px",
                          lineHeight:
                            1.5,
                        }}
                      >
                        {error}
                      </p>
                    </IonText>

                    <IonButton
                      fill="outline"
                      onClick={
                        handleRetry
                      }
                    >
                      <IonIcon
                        icon={
                          refreshOutline
                        }
                        slot="start"
                      />

                      Try Again
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              )}

            {/* =================================================
                EMPTY STATE
            ================================================= */}

            {!loading &&
              !error &&
              reviews.length ===
                0 && (
                <IonCard
                  style={{
                    marginTop:
                      "50px",
                    borderRadius:
                      "20px",
                    boxShadow:
                      "0 4px 18px rgba(0,0,0,0.07)",
                  }}
                >
                  <IonCardContent
                    className="ion-text-center"
                    style={{
                      padding:
                        "45px 20px",
                    }}
                  >
                    <div
                      style={{
                        width:
                          "80px",
                        height:
                          "80px",
                        borderRadius:
                          "50%",
                        margin:
                          "0 auto 18px",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        background:
                          "var(--ion-color-light)",
                      }}
                    >
                      <IonIcon
                        icon={
                          chatbubbleOutline
                        }
                        color="primary"
                        style={{
                          fontSize:
                            "40px",
                        }}
                      />
                    </div>

                    <h2
                      style={{
                        margin:
                          "0 0 10px",
                        fontWeight:
                          700,
                      }}
                    >
                      No reviews yet
                    </h2>

                    <IonText color="medium">
                      <p
                        style={{
                          margin:
                            "0 auto",
                          maxWidth:
                            "300px",
                          lineHeight:
                            1.6,
                        }}
                      >
                        Reviews you leave
                        on properties
                        will appear here.
                      </p>
                    </IonText>
                  </IonCardContent>
                </IonCard>
              )}

            {/* =================================================
                REVIEWS
            ================================================= */}

            {!loading &&
              !error &&
              reviews.length >
                0 && (
                <div>
                  <IonList
                    lines="none"
                    style={{
                      background:
                        "transparent",
                    }}
                  >
                    {reviews.map(
                      (
                        review
                      ) => (
                        <ReviewCard
                          key={
                            String(
                              review.id
                            )
                          }
                          review={
                            review
                          }
                        />
                      )
                    )}
                  </IonList>
                </div>
              )}
          </div>
        </IonContent>
      </IonPage>
    );
  };

export default Reviews;