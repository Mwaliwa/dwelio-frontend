import React, {
  useCallback,
  useMemo,
  useRef,
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
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonButton,
  IonIcon,
  IonAlert,
  IonSegment,
  IonSegmentButton,
  IonSearchbar,
  IonModal,
  IonButtons,
  IonMenuButton,
  IonRefresher,
  IonRefresherContent,
  IonText,
  IonSkeletonText,
  useIonToast,
  useIonViewWillEnter,
  useIonViewDidLeave,
} from "@ionic/react";

import {
  eyeOutline,
  checkmarkOutline,
  closeOutline,
  locationOutline,
  calendarOutline,
  peopleOutline,
  refreshOutline,
  homeOutline,
  personOutline,
  callOutline,
  mailOutline,
  timeOutline,
  chevronForwardOutline,
} from "ionicons/icons";

import {
  useHistory,
} from "react-router-dom";

import axios, {
  AxiosError,
  isCancel,
} from "axios";

import {
  getAuthToken,
  formatDate,
  normalizeStatus,
  getStatusColor,
  type BookingStatus,
} from "../../utils/booking";

/* =========================================================
   CONFIGURATION
========================================================= */

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

/*
 * If your VITE_API_URL already ends with /api,
 * the helper below prevents /api/api/... problems.
 */

const API_BASE = API_URL.replace(/\/+$/, "");

/* =========================================================
   TYPES
========================================================= */

interface Booking {
  id: number;

  property_id: number;

  property_title?: string;
  title?: string;

  property_location?: string;
  location?: string;

  property_image?: string;

  status: BookingStatus;

  check_in: string | null;
  check_out: string | null;

  created_at: string;

  guests?: number;

  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;

  user?: {
    id?: number;
    name?: string;
    phone?: string;
    email?: string;
  };
}

interface BookingResponse {
  success?: boolean;
  bookings?: Booking[];
  message?: string;
  error?: string;
}

type FilterKey =
  | "all"
  | "pending"
  | "confirmed"
  | "cancelled";

type ListPhase =
  | "loading"
  | "ready"
  | "error"
  | "empty";

type ActionType =
  | "confirm"
  | "reject";

/* =========================================================
   HELPERS
========================================================= */

const getTitle = (
  booking: Booking
): string => {
  return (
    booking.property_title ||
    booking.title ||
    "Property"
  );
};

const getLocation = (
  booking: Booking
): string => {
  return (
    booking.property_location ||
    booking.location ||
    "Location unavailable"
  );
};

const getCustomerName = (
  booking: Booking
): string => {
  return (
    booking.customer_name ||
    booking.user?.name ||
    "Customer"
  );
};

const getCustomerPhone = (
  booking: Booking
): string => {
  return (
    booking.customer_phone ||
    booking.user?.phone ||
    ""
  );
};

const getCustomerEmail = (
  booking: Booking
): string => {
  return (
    booking.customer_email ||
    booking.user?.email ||
    ""
  );
};

const getStatus = (
  status: string
): string => {
  return normalizeStatus(status);
};

const isPending = (
  status: string
): boolean => {
  return [
    "pending",
    "requested",
  ].includes(
    getStatus(status)
  );
};

const isConfirmed = (
  status: string
): boolean => {
  return [
    "approved",
    "confirmed",
  ].includes(
    getStatus(status)
  );
};

const isCancelled = (
  status: string
): boolean => {
  return [
    "cancelled",
    "rejected",
  ].includes(
    getStatus(status)
  );
};

const canConfirm = (
  status: string
): boolean => {
  return isPending(status);
};

const canReject = (
  status: string
): boolean => {
  return (
    isPending(status) ||
    isConfirmed(status)
  );
};

/* =========================================================
   COMPONENT
========================================================= */

export default function AgentBookings() {
  const history =
    useHistory();

  const [presentToast] =
    useIonToast();

  /* =======================================================
     STATE
  ======================================================= */

  const [
    bookings,
    setBookings,
  ] = useState<Booking[]>([]);

  const [
    phase,
    setPhase,
  ] = useState<ListPhase>(
    "loading"
  );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null
  );

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    activeFilter,
    setActiveFilter,
  ] = useState<FilterKey>(
    "all"
  );

  /* =======================================================
     ACTION STATE
  ======================================================= */

  const [
    actionType,
    setActionType,
  ] = useState<ActionType | null>(
    null
  );

  const [
    selectedBookingId,
    setSelectedBookingId,
  ] = useState<number | null>(
    null
  );

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  /* =======================================================
     DETAIL MODAL
  ======================================================= */

  const [
    showDetailModal,
    setShowDetailModal,
  ] = useState(false);

  const [
    selectedBooking,
    setSelectedBooking,
  ] = useState<Booking | null>(
    null
  );

  /* =======================================================
     REFS
  ======================================================= */

  const abortRef =
    useRef<AbortController | null>(
      null
    );

  const actionInFlightRef =
    useRef(false);

  const mountedRef =
    useRef(true);

  /* =======================================================
     CLEANUP
  ======================================================= */

  const cleanup = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  useIonViewDidLeave(() => {
    cleanup();
  });

  /* =======================================================
     TOAST HELPER
  ======================================================= */

  const showToast = useCallback(
    (
      message: string,
      color:
        | "success"
        | "danger"
        | "warning"
        | "medium" = "danger"
    ) => {
      presentToast({
        message,
        duration: 2800,
        position: "top",
        color,
      });
    },
    [presentToast]
  );

  /* =======================================================
     AUTH FAILURE
  ======================================================= */

  const handleAuthFailure =
    useCallback(() => {
      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

      localStorage.removeItem(
        "role"
      );

      localStorage.removeItem(
        "auth"
      );

      showToast(
        "Your session has expired. Please log in again.",
        "danger"
      );

      history.replace(
        "/login"
      );
    }, [
      history,
      showToast,
    ]);

  /* =======================================================
     FETCH BOOKINGS
  ======================================================= */

  const fetchBookings =
    useCallback(
      async (
        options?: {
          silent?: boolean;
        }
      ) => {
        const token =
          getAuthToken();

        if (!token) {
          setPhase("error");

          setErrorMessage(
            "Your session has expired."
          );

          handleAuthFailure();

          return;
        }

        if (!options?.silent) {
          setPhase("loading");
          setErrorMessage(null);
        }

        cleanup();

        const controller =
          new AbortController();

        abortRef.current =
          controller;

        try {
          const response =
            await axios.get<BookingResponse>(
              `${API_BASE}/bookings/agent`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                    Accept:
                      "application/json",
                },

                signal:
                  controller.signal,

                timeout:
                  15000,
              }
            );

          if (
            !mountedRef.current
          ) {
            return;
          }

          const data =
            response.data;

          const list =
            Array.isArray(
              data?.bookings
            )
              ? data.bookings
              : [];

          setBookings(list);

          setPhase(
            list.length > 0
              ? "ready"
              : "empty"
          );

          setErrorMessage(
            null
          );
        } catch (error) {
          if (
            isCancel(error)
          ) {
            return;
          }

          if (
            !mountedRef.current
          ) {
            return;
          }

          const axiosError =
            error as AxiosError<{
              message?: string;
              error?: string;
            }>;

          const status =
            axiosError.response
              ?.status;

          if (
            status === 401
          ) {
            handleAuthFailure();
            return;
          }

          const message =
            axiosError.response
              ?.data?.message ||
            axiosError.response
              ?.data?.error ||
            axiosError.message ||
            "Unable to load bookings.";

          setErrorMessage(
            message
          );

          setPhase("error");

          if (
            !options?.silent
          ) {
            showToast(
              message,
              "danger"
            );
          }
        } finally {
          if (
            abortRef.current ===
            controller
          ) {
            abortRef.current =
              null;
          }
        }
      },
      [
        cleanup,
        handleAuthFailure,
        showToast,
      ]
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useIonViewWillEnter(() => {
    mountedRef.current = true;

    void fetchBookings();
  });

  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh =
    async (
      event: CustomEvent
    ) => {
      try {
        await fetchBookings({
          silent: true,
        });
      } finally {
        event.detail.complete();
      }
    };

  /* =======================================================
     FILTERED BOOKINGS
  ======================================================= */

  const {
    filteredBookings,
    counts,
  } = useMemo(() => {
    let pending = 0;
    let confirmed = 0;
    let cancelled = 0;

    for (
      const booking of bookings
    ) {
      if (
        isPending(
          booking.status
        )
      ) {
        pending++;
      } else if (
        isConfirmed(
          booking.status
        )
      ) {
        confirmed++;
      } else if (
        isCancelled(
          booking.status
        )
      ) {
        cancelled++;
      }
    }

    const term =
      searchTerm
        .trim()
        .toLowerCase();

    const filtered =
      bookings.filter(
        (booking) => {
          const matchesSearch =
            !term ||
            getTitle(
              booking
            )
              .toLowerCase()
              .includes(term) ||
            getLocation(
              booking
            )
              .toLowerCase()
              .includes(term) ||
            getCustomerName(
              booking
            )
              .toLowerCase()
              .includes(term) ||
            getCustomerPhone(
              booking
            )
              .toLowerCase()
              .includes(term);

          if (
            !matchesSearch
          ) {
            return false;
          }

          const status =
            getStatus(
              booking.status
            );

          switch (
            activeFilter
          ) {
            case "pending":
              return [
                "pending",
                "requested",
              ].includes(
                status
              );

            case "confirmed":
              return [
                "approved",
                "confirmed",
              ].includes(
                status
              );

            case "cancelled":
              return [
                "cancelled",
                "rejected",
              ].includes(
                status
              );

            default:
              return true;
          }
        }
      );

    return {
      filteredBookings:
        filtered,

      counts: {
        all:
          bookings.length,
        pending,
        confirmed,
        cancelled,
      },
    };
  }, [
    bookings,
    searchTerm,
    activeFilter,
  ]);

  /* =======================================================
     OPEN DETAILS
  ======================================================= */

  const openDetails =
    useCallback(
      (booking: Booking) => {
        setSelectedBooking(
          booking
        );

        setShowDetailModal(
          true
        );
      },
      []
    );

  /* =======================================================
     REQUEST ACTION
  ======================================================= */

  const requestAction =
    useCallback(
      (
        booking: Booking,
        type: ActionType
      ) => {
        setSelectedBookingId(
          booking.id
        );

        setSelectedBooking(
          booking
        );

        setActionType(
          type
        );
      },
      []
    );

  /* =======================================================
     CLOSE ACTION
  ======================================================= */

  const closeAction =
    useCallback(() => {
      if (
        actionLoading
      ) {
        return;
      }

      setActionType(
        null
      );

      setSelectedBookingId(
        null
      );
    }, [
      actionLoading,
    ]);

  /* =======================================================
     HANDLE BOOKING ACTION
  ======================================================= */

  const handleAction =
    useCallback(
      async () => {
        if (
          selectedBookingId ===
            null ||
          !actionType ||
          actionInFlightRef.current
        ) {
          return;
        }

        const token =
          getAuthToken();

        if (!token) {
          handleAuthFailure();
          return;
        }

        actionInFlightRef.current =
          true;

        setActionLoading(
          true
        );

        const endpoint =
          actionType ===
          "confirm"
            ? `${API_BASE}/bookings/agent/${selectedBookingId}/confirm`
            : `${API_BASE}/bookings/agent/${selectedBookingId}/reject`;

        const newStatus =
          actionType ===
          "confirm"
            ? "confirmed"
            : "cancelled";

        try {
          await axios.patch(
            endpoint,
            {},
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
                Accept:
                  "application/json",
              },
              timeout: 12000,
            }
          );

          /* -----------------------------------------------
             Optimistic update
          ------------------------------------------------ */

          setBookings(
            (previous) =>
              previous.map(
                (booking) =>
                  booking.id ===
                  selectedBookingId
                    ? {
                        ...booking,
                        status:
                          newStatus as BookingStatus,
                      }
                    : booking
              )
          );

          setSelectedBooking(
            (previous) =>
              previous &&
              previous.id ===
                selectedBookingId
                ? {
                    ...previous,
                    status:
                      newStatus as BookingStatus,
                  }
                : previous
          );

          showToast(
            actionType ===
              "confirm"
              ? "Booking confirmed successfully."
              : "Booking rejected successfully.",
            actionType ===
              "confirm"
              ? "success"
              : "warning"
          );
        } catch (error) {
          const axiosError =
            error as AxiosError<{
              message?: string;
              error?: string;
            }>;

          if (
            axiosError.response
              ?.status === 401
          ) {
            handleAuthFailure();
            return;
          }

          const message =
            axiosError.response
              ?.data?.message ||
            axiosError.response
              ?.data?.error ||
            axiosError.message ||
            `Unable to ${
              actionType ===
              "confirm"
                ? "confirm"
                : "reject"
            } booking.`;

          showToast(
            message,
            "danger"
          );
        } finally {
          actionInFlightRef.current =
            false;

          setActionLoading(
            false
          );

          setActionType(
            null
          );

          setSelectedBookingId(
            null
          );
        }
      },
      [
        actionType,
        handleAuthFailure,
        selectedBookingId,
        showToast,
      ]
    );

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const clearFilters =
    useCallback(() => {
      setSearchTerm("");
      setActiveFilter(
        "all"
      );
    }, []);

  /* =======================================================
     SKELETON
  ======================================================= */

  const renderSkeleton =
    () => (
      <div
        aria-busy="true"
        aria-label="Loading bookings"
      >
        {[1, 2, 3].map(
          (item) => (
            <IonCard
              key={item}
              className="booking-card"
            >
              <IonCardContent>
                <IonSkeletonText
                  animated
                  style={{
                    width: "65%",
                    height: "20px",
                  }}
                />

                <IonSkeletonText
                  animated
                  style={{
                    width: "45%",
                    height: "14px",
                    marginTop:
                      "10px",
                  }}
                />

                <IonSkeletonText
                  animated
                  style={{
                    width: "55%",
                    height: "14px",
                    marginTop:
                      "10px",
                  }}
                />

                <IonSkeletonText
                  animated
                  style={{
                    width: "40%",
                    height: "14px",
                    marginTop:
                      "10px",
                  }}
                />

                <div className="skeleton-actions">
                  <IonSkeletonText
                    animated
                    style={{
                      width: "90px",
                      height:
                        "36px",
                      borderRadius:
                        "10px",
                    }}
                  />

                  <IonSkeletonText
                    animated
                    style={{
                      width: "90px",
                      height:
                        "36px",
                      borderRadius:
                        "10px",
                    }}
                  />
                </div>
              </IonCardContent>
            </IonCard>
          )
        )}
      </div>
    );

  /* =======================================================
     BOOKING CARD
  ======================================================= */

  const renderBookingCard =
    (
      booking: Booking
    ) => {
      const status =
        getStatus(
          booking.status
        );

      const displayStatus =
        status
          .replace(
            /_/g,
            " "
          )
          .replace(
            /\b\w/g,
            (char) =>
              char.toUpperCase()
          );

      return (
        <IonCard
          key={booking.id}
          className="booking-card"
        >
          <IonCardContent>
            <div className="booking-card-header">
              <div className="booking-heading">
                <h2>
                  {getTitle(
                    booking
                  )}
                </h2>

                <p className="location-row">
                  <IonIcon
                    icon={
                      locationOutline
                    }
                  />

                  <span>
                    {getLocation(
                      booking
                    )}
                  </span>
                </p>
              </div>

              <IonBadge
                color={getStatusColor(
                  booking.status
                )}
              >
                {displayStatus}
              </IonBadge>
            </div>

            {/* CUSTOMER */}

            <div className="customer-section">
              <div className="customer-main">
                <div className="customer-avatar">
                  <IonIcon
                    icon={
                      personOutline
                    }
                  />
                </div>

                <div>
                  <strong>
                    {getCustomerName(
                      booking
                    )}
                  </strong>

                  {getCustomerPhone(
                    booking
                  ) && (
                    <small>
                      <IonIcon
                        icon={
                          callOutline
                        }
                      />

                      {
                        getCustomerPhone(
                          booking
                        )
                      }
                    </small>
                  )}
                </div>
              </div>
            </div>

            {/* BOOKING INFORMATION */}

            <div className="booking-information">
              {booking.check_in && (
                <div className="information-item">
                  <IonIcon
                    icon={
                      calendarOutline
                    }
                  />

                  <span>
                    <small>
                      Dates
                    </small>

                    <strong>
                      {formatDate(
                        booking.check_in
                      )}

                      {booking.check_out
                        ? ` → ${formatDate(
                            booking.check_out
                          )}`
                        : ""}
                    </strong>
                  </span>
                </div>
              )}

              {typeof booking.guests ===
                "number" &&
                booking.guests >
                  0 && (
                  <div className="information-item">
                    <IonIcon
                      icon={
                        peopleOutline
                      }
                    />

                    <span>
                      <small>
                        Guests
                      </small>

                      <strong>
                        {
                          booking.guests
                        }{" "}
                        {booking.guests ===
                        1
                          ? "guest"
                          : "guests"}
                      </strong>
                    </span>
                  </div>
                )}

              <div className="information-item">
                <IonIcon
                  icon={
                    timeOutline
                  }
                />

                <span>
                  <small>
                    Requested
                  </small>

                  <strong>
                    {formatDate(
                      booking.created_at
                    )}
                  </strong>
                </span>
              </div>
            </div>

            {/* ACTIONS */}

            <div className="booking-actions">
              <IonButton
                fill="outline"
                size="small"
                onClick={() =>
                  openDetails(
                    booking
                  )
                }
              >
                <IonIcon
                  icon={
                    eyeOutline
                  }
                  slot="start"
                />

                Details
              </IonButton>

              {canConfirm(
                status
              ) && (
                <IonButton
                  size="small"
                  color="success"
                  onClick={() =>
                    requestAction(
                      booking,
                      "confirm"
                    )
                  }
                >
                  <IonIcon
                    icon={
                      checkmarkOutline
                    }
                    slot="start"
                  />

                  Confirm
                </IonButton>
              )}

              {canReject(
                status
              ) && (
                <IonButton
                  fill="outline"
                  color="danger"
                  size="small"
                  onClick={() =>
                    requestAction(
                      booking,
                      "reject"
                    )
                  }
                >
                  <IonIcon
                    icon={
                      closeOutline
                    }
                    slot="start"
                  />

                  Reject
                </IonButton>
              )}
            </div>
          </IonCardContent>
        </IonCard>
      );
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <IonPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>

          <IonTitle>
            Agent Bookings
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <IonContent fullscreen>
        <IonRefresher
          slot="fixed"
          onIonRefresh={
            handleRefresh
          }
        >
          <IonRefresherContent
            pullingIcon={
              refreshOutline
            }
            pullingText="Pull to refresh"
            refreshingSpinner="crescent"
            refreshingText="Refreshing..."
          />
        </IonRefresher>

        <main className="bookings-page">
          {/* =================================================
              SUMMARY
          ================================================= */}

          <section className="summary-card">
            <div>
              <span>
                Total bookings
              </span>

              <strong>
                {counts.all}
              </strong>
            </div>

            <div>
              <span>
                Pending
              </span>

              <strong>
                {counts.pending}
              </strong>
            </div>

            <div>
              <span>
                Confirmed
              </span>

              <strong>
                {counts.confirmed}
              </strong>
            </div>
          </section>

          {/* =================================================
              SEARCH
          ================================================= */}

          <IonSearchbar
            value={
              searchTerm
            }
            onIonInput={(event) =>
              setSearchTerm(
                event.detail.value ||
                  ""
              )
            }
            placeholder="Search property, location or customer"
            debounce={250}
            className="bookings-search"
          />

          {/* =================================================
              FILTERS
          ================================================= */}

          <IonSegment
            value={
              activeFilter
            }
            scrollable
            onIonChange={(
              event
            ) => {
              const value =
                event.detail
                  .value as FilterKey;

              setActiveFilter(
                value || "all"
              );
            }}
            className="bookings-segment"
          >
            <IonSegmentButton value="all">
              <IonLabel>
                All
                {counts.all >
                0
                  ? ` (${counts.all})`
                  : ""}
              </IonLabel>
            </IonSegmentButton>

            <IonSegmentButton value="pending">
              <IonLabel>
                Pending
                {counts.pending >
                0
                  ? ` (${counts.pending})`
                  : ""}
              </IonLabel>
            </IonSegmentButton>

            <IonSegmentButton value="confirmed">
              <IonLabel>
                Confirmed
                {counts.confirmed >
                0
                  ? ` (${counts.confirmed})`
                  : ""}
              </IonLabel>
            </IonSegmentButton>

            <IonSegmentButton value="cancelled">
              <IonLabel>
                Cancelled
                {counts.cancelled >
                0
                  ? ` (${counts.cancelled})`
                  : ""}
              </IonLabel>
            </IonSegmentButton>
          </IonSegment>

          {/* =================================================
              LOADING
          ================================================= */}

          {phase ===
            "loading" &&
            renderSkeleton()}

          {/* =================================================
              ERROR
          ================================================= */}

          {phase ===
            "error" && (
            <IonCard className="state-card">
              <IonCardContent>
                <div className="state-icon error">
                  <IonIcon
                    icon={
                      refreshOutline
                    }
                  />
                </div>

                <h2>
                  Unable to load bookings
                </h2>

                <IonText color="medium">
                  <p>
                    {errorMessage ||
                      "Something went wrong while loading your bookings."}
                  </p>
                </IonText>

                <IonButton
                  onClick={() =>
                    void fetchBookings()
                  }
                >
                  <IonIcon
                    icon={
                      refreshOutline
                    }
                    slot="start"
                  />

                  Try again
                </IonButton>
              </IonCardContent>
            </IonCard>
          )}

          {/* =================================================
              EMPTY
          ================================================= */}

          {phase ===
            "empty" && (
            <IonCard className="state-card">
              <IonCardContent>
                <div className="state-icon">
                  <IonIcon
                    icon={
                      homeOutline
                    }
                  />
                </div>

                <h2>
                  No bookings yet
                </h2>

                <IonText color="medium">
                  <p>
                    Customer booking requests
                    for your properties will
                    appear here.
                  </p>
                </IonText>
              </IonCardContent>
            </IonCard>
          )}

          {/* =================================================
              FILTERED EMPTY
          ================================================= */}

          {phase ===
            "ready" &&
            filteredBookings.length ===
              0 && (
              <IonCard className="state-card">
                <IonCardContent>
                  <div className="state-icon">
                    <IonIcon
                      icon={
                        eyeOutline
                      }
                    />
                  </div>

                  <h2>
                    No matching bookings
                  </h2>

                  <IonText color="medium">
                    <p>
                      No booking matches
                      your current search
                      or filter.
                    </p>
                  </IonText>

                  <IonButton
                    fill="outline"
                    onClick={
                      clearFilters
                    }
                  >
                    Clear filters
                  </IonButton>
                </IonCardContent>
              </IonCard>
            )}

          {/* =================================================
              BOOKING LIST
          ================================================= */}

          {phase ===
            "ready" &&
            filteredBookings.length >
              0 && (
              <IonList
                lines="none"
                className="bookings-list"
              >
                {filteredBookings.map(
                  renderBookingCard
                )}
              </IonList>
            )}
        </main>
      </IonContent>

      {/* =====================================================
          CONFIRM / REJECT ALERT
      ===================================================== */}

      <IonAlert
        isOpen={
          Boolean(
            actionType
          ) &&
          selectedBookingId !==
            null
        }
        header={
          actionType ===
          "confirm"
            ? "Confirm booking?"
            : "Reject booking?"
        }
        message={
          actionType ===
          "confirm"
            ? "This booking will be confirmed and the customer can be notified."
            : "This booking will be rejected. Make sure you want to continue."
        }
        buttons={[
          {
            text: "Cancel",
            role: "cancel",
            handler:
              closeAction,
          },
          {
            text:
              actionType ===
              "confirm"
                ? "Confirm"
                : "Reject",

            role:
              actionType ===
              "reject"
                ? "destructive"
                : undefined,

            handler: () => {
              void handleAction();

              /*
               * Returning false keeps the
               * alert from closing while the
               * action is being processed.
               */

              return false;
            },
          },
        ]}
      />

      {/* =====================================================
          DETAILS MODAL
      ===================================================== */}

      <IonModal
        isOpen={
          showDetailModal
        }
        onDidDismiss={() => {
          setShowDetailModal(
            false
          );

          setSelectedBooking(
            null
          );
        }}
      >
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonButton
                onClick={() =>
                  setShowDetailModal(
                    false
                  )
                }
              >
                Close
              </IonButton>
            </IonButtons>

            <IonTitle>
              Booking Details
            </IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          {selectedBooking && (
            <div className="details-page">
              {/* PROPERTY */}

              <IonCard className="detail-card">
                <IonCardContent>
                  <div className="detail-property">
                    <div className="detail-property-icon">
                      <IonIcon
                        icon={
                          homeOutline
                        }
                      />
                    </div>

                    <div>
                      <h2>
                        {getTitle(
                          selectedBooking
                        )}
                      </h2>

                      <p>
                        <IonIcon
                          icon={
                            locationOutline
                          }
                        />

                        {getLocation(
                          selectedBooking
                        )}
                      </p>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>

              {/* CUSTOMER */}

              <IonCard className="detail-card">
                <IonCardContent>
                  <h3>
                    Customer
                  </h3>

                  <IonItem lines="full">
                    <IonIcon
                      icon={
                        personOutline
                      }
                      slot="start"
                    />

                    <IonLabel>
                      <span>
                        Name
                      </span>

                      <strong>
                        {getCustomerName(
                          selectedBooking
                        )}
                      </strong>
                    </IonLabel>
                  </IonItem>

                  {getCustomerPhone(
                    selectedBooking
                  ) && (
                    <IonItem lines="full">
                      <IonIcon
                        icon={
                          callOutline
                        }
                        slot="start"
                      />

                      <IonLabel>
                        <span>
                          Phone
                        </span>

                        <strong>
                          {getCustomerPhone(
                            selectedBooking
                          )}
                        </strong>
                      </IonLabel>
                    </IonItem>
                  )}

                  {getCustomerEmail(
                    selectedBooking
                  ) && (
                    <IonItem lines="none">
                      <IonIcon
                        icon={
                          mailOutline
                        }
                        slot="start"
                      />

                      <IonLabel>
                        <span>
                          Email
                        </span>

                        <strong>
                          {getCustomerEmail(
                            selectedBooking
                          )}
                        </strong>
                      </IonLabel>
                    </IonItem>
                  )}
                </IonCardContent>
              </IonCard>

              {/* BOOKING */}

              <IonCard className="detail-card">
                <IonCardContent>
                  <h3>
                    Booking Information
                  </h3>

                  <IonItem lines="full">
                    <IonLabel>
                      Status
                    </IonLabel>

                    <IonBadge
                      color={getStatusColor(
                        selectedBooking.status
                      )}
                    >
                      {getStatus(
                        selectedBooking.status
                      )}
                    </IonBadge>
                  </IonItem>

                  {selectedBooking.check_in && (
                    <IonItem lines="full">
                      <IonIcon
                        icon={
                          calendarOutline
                        }
                        slot="start"
                      />

                      <IonLabel>
                        <span>
                          Check-in
                        </span>

                        <strong>
                          {formatDate(
                            selectedBooking.check_in
                          )}
                        </strong>
                      </IonLabel>
                    </IonItem>
                  )}

                  {selectedBooking.check_out && (
                    <IonItem lines="full">
                      <IonIcon
                        icon={
                          calendarOutline
                        }
                        slot="start"
                      />

                      <IonLabel>
                        <span>
                          Check-out
                        </span>

                        <strong>
                          {formatDate(
                            selectedBooking.check_out
                          )}
                        </strong>
                      </IonLabel>
                    </IonItem>
                  )}

                  {typeof selectedBooking.guests ===
                    "number" && (
                    <IonItem lines="full">
                      <IonIcon
                        icon={
                          peopleOutline
                        }
                        slot="start"
                      />

                      <IonLabel>
                        <span>
                          Guests
                        </span>

                        <strong>
                          {
                            selectedBooking.guests
                          }
                        </strong>
                      </IonLabel>
                    </IonItem>
                  )}

                  <IonItem lines="none">
                    <IonIcon
                      icon={
                        timeOutline
                      }
                      slot="start"
                    />

                    <IonLabel>
                      <span>
                        Requested
                      </span>

                      <strong>
                        {formatDate(
                          selectedBooking.created_at
                        )}
                      </strong>
                    </IonLabel>
                  </IonItem>
                </IonCardContent>
              </IonCard>

              {/* ACTIONS */}

              {canConfirm(
                selectedBooking.status
              ) && (
                <IonButton
                  expand="block"
                  color="success"
                  className="detail-button"
                  disabled={
                    actionLoading
                  }
                  onClick={() => {
                    const id =
                      selectedBooking.id;

                    setShowDetailModal(
                      false
                    );

                    setTimeout(
                      () =>
                        requestAction(
                          selectedBooking,
                          "confirm"
                        ),
                      150
                    );
                  }}
                >
                  <IonIcon
                    icon={
                      checkmarkOutline
                    }
                    slot="start"
                  />

                  Confirm Booking

                  <IonIcon
                    icon={
                      chevronForwardOutline
                    }
                    slot="end"
                  />
                </IonButton>
              )}

              {canReject(
                selectedBooking.status
              ) && (
                <IonButton
                  expand="block"
                  fill="outline"
                  color="danger"
                  className="detail-button"
                  disabled={
                    actionLoading
                  }
                  onClick={() => {
                    setShowDetailModal(
                      false
                    );

                    setTimeout(
                      () =>
                        requestAction(
                          selectedBooking,
                          "reject"
                        ),
                      150
                    );
                  }}
                >
                  <IonIcon
                    icon={
                      closeOutline
                    }
                    slot="start"
                  />

                  Reject Booking
                </IonButton>
              )}
            </div>
          )}
        </IonContent>
      </IonModal>

      {/* =====================================================
          INLINE CSS
      ===================================================== */}

      <style>
        {`
          .bookings-page {
            width: 100%;
            max-width: 900px;
            margin: 0 auto;
            padding: 16px;
            padding-bottom: 40px;
          }

          /* ==================================================
             SUMMARY
          ================================================== */

          .summary-card {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 16px;
          }

          .summary-card > div {
            background: var(--ion-card-background, #ffffff);
            border-radius: 14px;
            padding: 14px 10px;
            text-align: center;
            box-shadow: 0 3px 16px rgba(0,0,0,0.06);
          }

          .summary-card span {
            display: block;
            font-size: 0.72rem;
            color: var(--ion-color-medium);
            margin-bottom: 5px;
          }

          .summary-card strong {
            display: block;
            font-size: 1.35rem;
            font-weight: 700;
            color: var(--ion-color-primary);
          }

          /* ==================================================
             SEARCH
          ================================================== */

          .bookings-search {
            padding: 0;
            margin-bottom: 12px;
          }

          .bookings-segment {
            margin-bottom: 18px;
            border-radius: 12px;
          }

          /* ==================================================
             CARDS
          ================================================== */

          .booking-card {
            margin: 0 0 14px;
            border-radius: 16px;
            box-shadow: 0 4px 18px rgba(0,0,0,0.06);
            overflow: hidden;
          }

          .booking-card ion-card-content {
            padding: 17px;
          }

          .booking-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 14px;
          }

          .booking-heading {
            min-width: 0;
            flex: 1;
          }

          .booking-heading h2 {
            margin: 0;
            font-size: 1.05rem;
            line-height: 1.3;
            font-weight: 700;
          }

          .location-row {
            display: flex;
            align-items: center;
            gap: 5px;
            margin: 6px 0 0;
            color: var(--ion-color-medium);
            font-size: 0.84rem;
          }

          .location-row ion-icon {
            flex-shrink: 0;
          }

          .booking-card ion-badge {
            flex-shrink: 0;
            text-transform: capitalize;
            border-radius: 8px;
            padding: 6px 8px;
          }

          /* ==================================================
             CUSTOMER
          ================================================== */

          .customer-section {
            padding: 11px 0;
            border-top: 1px solid var(--ion-color-light);
            border-bottom: 1px solid var(--ion-color-light);
          }

          .customer-main {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .customer-avatar {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(var(--ion-color-primary-rgb), 0.1);
            color: var(--ion-color-primary);
            flex-shrink: 0;
          }

          .customer-main strong {
            display: block;
            font-size: 0.93rem;
          }

          .customer-main small {
            display: flex;
            align-items: center;
            gap: 5px;
            margin-top: 3px;
            color: var(--ion-color-medium);
            font-size: 0.78rem;
          }

          /* ==================================================
             BOOKING INFORMATION
          ================================================== */

          .booking-information {
            display: grid;
            grid-template-columns: 1fr;
            gap: 8px;
            padding-top: 13px;
          }

          .information-item {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .information-item > ion-icon {
            font-size: 20px;
            color: var(--ion-color-primary);
            flex-shrink: 0;
          }

          .information-item span {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .information-item small {
            color: var(--ion-color-medium);
            font-size: 0.72rem;
          }

          .information-item strong {
            font-size: 0.84rem;
            font-weight: 600;
          }

          /* ==================================================
             ACTIONS
          ================================================== */

          .booking-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 16px;
          }

          .booking-actions ion-button {
            margin: 0;
            --border-radius: 9px;
          }

          /* ==================================================
             SKELETON
          ================================================== */

          .skeleton-actions {
            display: flex;
            gap: 8px;
            margin-top: 16px;
          }

          /* ==================================================
             STATES
          ================================================== */

          .state-card {
            margin: 20px 0;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 3px 16px rgba(0,0,0,0.05);
          }

          .state-card ion-card-content {
            padding: 35px 20px;
          }

          .state-card h2 {
            margin: 10px 0 6px;
            font-size: 1.1rem;
          }

          .state-card p {
            line-height: 1.5;
          }

          .state-icon {
            width: 62px;
            height: 62px;
            margin: 0 auto;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(var(--ion-color-primary-rgb), 0.1);
            color: var(--ion-color-primary);
            font-size: 30px;
          }

          .state-icon.error {
            background: rgba(var(--ion-color-danger-rgb), 0.1);
            color: var(--ion-color-danger);
          }

          .bookings-list {
            padding: 0;
            background: transparent;
          }

          /* ==================================================
             DETAIL MODAL
          ================================================== */

          .details-page {
            max-width: 700px;
            margin: 0 auto;
            padding-bottom: 30px;
          }

          .detail-card {
            margin: 0 0 14px;
            border-radius: 16px;
            box-shadow: 0 3px 16px rgba(0,0,0,0.05);
          }

          .detail-card h3 {
            margin: 0 0 8px;
            font-size: 0.95rem;
            font-weight: 700;
          }

          .detail-property {
            display: flex;
            align-items: center;
            gap: 13px;
          }

          .detail-property-icon {
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            background: rgba(var(--ion-color-primary-rgb), 0.1);
            color: var(--ion-color-primary);
            font-size: 24px;
            flex-shrink: 0;
          }

          .detail-property h2 {
            margin: 0 0 5px;
            font-size: 1.1rem;
          }

          .detail-property p {
            display: flex;
            align-items: center;
            gap: 5px;
            margin: 0;
            color: var(--ion-color-medium);
            font-size: 0.83rem;
          }

          .detail-card ion-item {
            --padding-start: 0;
            --inner-padding-end: 0;
          }

          .detail-card ion-label span {
            display: block;
            font-size: 0.74rem;
            color: var(--ion-color-medium);
            margin-bottom: 3px;
          }

          .detail-card ion-label strong {
            display: block;
            font-size: 0.9rem;
          }

          .detail-button {
            height: 48px;
            margin: 10px 0 0;
            --border-radius: 12px;
            font-weight: 600;
          }

          /* ==================================================
             TABLET / DESKTOP
          ================================================== */

          @media (min-width: 600px) {
            .bookings-page {
              padding: 24px;
            }

            .booking-information {
              grid-template-columns: repeat(2, 1fr);
            }

            .summary-card > div {
              padding: 18px;
            }

            .summary-card strong {
              font-size: 1.5rem;
            }
          }

          /* ==================================================
             MOBILE
          ================================================== */

          @media (max-width: 420px) {
            .bookings-page {
              padding: 12px;
            }

            .booking-card-header {
              gap: 7px;
            }

            .booking-heading h2 {
              font-size: 0.96rem;
            }

            .booking-card ion-badge {
              font-size: 0.68rem;
            }

            .booking-actions {
              display: grid;
              grid-template-columns: 1fr;
            }

            .booking-actions ion-button {
              width: 100%;
            }

            .summary-card {
              gap: 7px;
            }

            .summary-card > div {
              padding: 11px 5px;
            }

            .summary-card span {
              font-size: 0.65rem;
            }
          }
        `}
      </style>
    </IonPage>
  );
}