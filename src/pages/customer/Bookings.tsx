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
  IonRefresher,
  IonRefresherContent,
  IonNote,
  IonText,
  IonSkeletonText,
  useIonToast,
  useIonViewWillEnter,
  useIonViewDidLeave,
  RefresherEventDetail,
} from "@ionic/react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  eyeOutline,
  trashOutline,
  cashOutline,
  locationOutline,
  cardOutline,
  calendarOutline,
  peopleOutline,
  refreshOutline,
  homeOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import axios, { AxiosError, isCancel } from "axios";
import {
  getAuthToken,
  formatMoney,
  formatDate,
  normalizeStatus,
  getStatusColor,
  canPay,
  canCancel,
  isPaidStatus,
  type BookingStatus,
} from "../../utils/booking";

// ---------------------------------------------------------------------------
// Config & types
// ---------------------------------------------------------------------------

const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) {
  console.error("[Bookings] VITE_API_URL is not defined");
}

interface Booking {
  id: number;
  property_id: number;
  property_title?: string;
  title?: string;
  property_location?: string;
  location?: string;
  property_image?: string;
  price?: number;
  total_amount?: number;
  status: BookingStatus;
  check_in: string | null;
  check_out: string | null;
  created_at: string;
  guests?: number;
  currency?: string;
}

type FilterKey = "all" | "upcoming" | "past" | "cancelled";
type ListPhase = "loading" | "ready" | "error" | "empty";

// ---------------------------------------------------------------------------
// Helpers (local)
// ---------------------------------------------------------------------------

const getTitle = (b: Booking) => b.property_title || b.title || "Property";
const getLocation = (b: Booking) =>
  b.property_location || b.location || "Unknown location";
const getAmount = (b: Booking) => Number(b.total_amount ?? b.price ?? 0);
const getCurrency = (b: Booking) => b.currency || "MWK";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Bookings() {
  const history = useHistory();
  const [presentToast] = useIonToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [phase, setPhase] = useState<ListPhase>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const cancelInFlightRef = useRef(false);

  const cleanup = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  useIonViewDidLeave(() => {
    cleanup();
  });

  // -----------------------------------------------------------------------
  // Fetch
  // -----------------------------------------------------------------------
  const fetchBookings = useCallback(
    async (opts?: { silent?: boolean }) => {
      const token = getAuthToken();
      if (!token) {
        setErrorMessage("Please log in to view your bookings.");
        setPhase("error");
        presentToast({
          message: "Session expired. Please log in again.",
          duration: 2800,
          color: "danger",
        });
        history.replace("/login");
        return;
      }

      if (!opts?.silent) {
        setPhase("loading");
        setErrorMessage(null);
      }

      cleanup();
      abortRef.current = new AbortController();

      try {
        const { data } = await axios.get<{
          success?: boolean;
          bookings?: Booking[];
          message?: string;
        }>(`${API_URL}/bookings`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: abortRef.current.signal,
          timeout: 15_000,
        });

        const list = Array.isArray(data?.bookings) ? data.bookings : [];
        setBookings(list);
        setPhase(list.length === 0 ? "empty" : "ready");
      } catch (err) {
        if (isCancel(err)) return;

        const ax = err as AxiosError<{ message?: string; error?: string }>;
        const msg =
          ax.response?.data?.message ||
          ax.response?.data?.error ||
          ax.message ||
          "Failed to load bookings.";

        setErrorMessage(msg);
        setPhase("error");

        if (!opts?.silent) {
          presentToast({
            message: msg,
            duration: 3000,
            color: "danger",
          });
        }
      }
    },
    [cleanup, history, presentToast]
  );

  useIonViewWillEnter(() => {
    fetchBookings();
  });

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      await fetchBookings({ silent: true });
    } finally {
      event.detail.complete();
    }
  };

  // -----------------------------------------------------------------------
  // Derived data
  // -----------------------------------------------------------------------
  const { filteredBookings, counts, totalSpent } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let upcoming = 0;
    let past = 0;
    let cancelled = 0;
    let spent = 0;

    const matchesSearch = (b: Booking) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.trim().toLowerCase();
      return (
        getTitle(b).toLowerCase().includes(term) ||
        getLocation(b).toLowerCase().includes(term)
      );
    };

    const matchesFilter = (b: Booking): boolean => {
      const status = normalizeStatus(b.status);
      const checkIn = b.check_in ? new Date(b.check_in) : null;

      switch (activeFilter) {
        case "upcoming":
          return (
            !!checkIn &&
            checkIn >= today &&
            ["pending", "approved", "confirmed", "paid"].includes(status)
          );
        case "past":
          return !!checkIn && checkIn < today && status !== "cancelled";
        case "cancelled":
          return status === "cancelled";
        default:
          return true;
      }
    };

    for (const b of bookings) {
      const status = normalizeStatus(b.status);
      const checkIn = b.check_in ? new Date(b.check_in) : null;

      if (isPaidStatus(b.status)) {
        spent += getAmount(b);
      }

      if (status === "cancelled") {
        cancelled += 1;
      } else if (
        checkIn &&
        checkIn >= today &&
        ["pending", "approved", "confirmed", "paid"].includes(status)
      ) {
        upcoming += 1;
      } else if (checkIn && checkIn < today) {
        past += 1;
      }
    }

    const filtered = bookings.filter((b) => matchesSearch(b) && matchesFilter(b));

    return {
      filteredBookings: filtered,
      counts: {
        all: bookings.length,
        upcoming,
        past,
        cancelled,
      },
      totalSpent: spent,
    };
  }, [bookings, searchTerm, activeFilter]);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------
  const openDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const goToPayment = (bookingId: number) => {
    history.push(`/customer/payments/${bookingId}`);
  };

  const requestCancel = (id: number) => {
    setSelectedBookingId(id);
    setShowCancelAlert(true);
  };

  const handleCancel = async () => {
    if (!selectedBookingId || cancelInFlightRef.current) return;

    const token = getAuthToken();
    if (!token) {
      presentToast({
        message: "Please log in again",
        duration: 2500,
        color: "danger",
      });
      history.replace("/login");
      return;
    }

    cancelInFlightRef.current = true;
    setCancelling(true);

    try {
      await axios.patch(
        `${API_URL}/bookings/${selectedBookingId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 12_000,
        }
      );

      presentToast({
        message: "Booking cancelled successfully",
        duration: 2500,
        color: "success",
      });

      // Optimistic update
      setBookings((prev) =>
        prev.map((b) =>
          b.id === selectedBookingId ? { ...b, status: "cancelled" } : b
        )
      );

      if (selectedBooking?.id === selectedBookingId) {
        setSelectedBooking((prev) =>
          prev ? { ...prev, status: "cancelled" } : prev
        );
      }
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      const msg =
        ax.response?.data?.message ||
        (err as Error).message ||
        "Failed to cancel booking";
      presentToast({
        message: msg,
        duration: 3200,
        color: "danger",
      });
    } finally {
      cancelInFlightRef.current = false;
      setCancelling(false);
      setShowCancelAlert(false);
      setSelectedBookingId(null);
    }
  };

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------
  const renderSkeleton = () => (
    <div className="bookings-skeleton" aria-busy="true" aria-label="Loading bookings">
      {[1, 2, 3].map((i) => (
        <IonCard key={i} className="booking-card">
          <IonCardContent>
            <IonSkeletonText animated style={{ width: "60%", height: 18 }} />
            <IonSkeletonText animated style={{ width: "40%", height: 14, marginTop: 8 }} />
            <IonSkeletonText animated style={{ width: "35%", height: 14, marginTop: 8 }} />
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <IonSkeletonText animated style={{ width: 88, height: 32, borderRadius: 8 }} />
              <IonSkeletonText animated style={{ width: 88, height: 32, borderRadius: 8 }} />
            </div>
          </IonCardContent>
        </IonCard>
      ))}
    </div>
  );

  const renderBookingCard = (booking: Booking) => {
    const status = normalizeStatus(booking.status);

    return (
      <IonCard key={booking.id} className="booking-card">
        <IonCardContent>
          <div className="booking-card-header">
            <div className="booking-card-meta">
              <h2 className="booking-title">{getTitle(booking)}</h2>
              <p className="booking-location">
                <IonIcon icon={locationOutline} aria-hidden="true" />
                <span>{getLocation(booking)}</span>
              </p>
            </div>
            <IonBadge color={getStatusColor(booking.status)} className="booking-status">
              {booking.status}
            </IonBadge>
          </div>

          <div className="booking-facts">
            <p>
              <IonIcon icon={cashOutline} aria-hidden="true" />
              <strong>{formatMoney(getAmount(booking), getCurrency(booking))}</strong>
            </p>
            {booking.check_in && (
              <p>
                <IonIcon icon={calendarOutline} aria-hidden="true" />
                <span>
                  {formatDate(booking.check_in)}
                  {booking.check_out ? ` → ${formatDate(booking.check_out)}` : ""}
                </span>
              </p>
            )}
            {typeof booking.guests === "number" && booking.guests > 0 && (
              <p>
                <IonIcon icon={peopleOutline} aria-hidden="true" />
                <span>
                  {booking.guests} guest{booking.guests === 1 ? "" : "s"}
                </span>
              </p>
            )}
          </div>

          <div className="booking-actions">
            <IonButton
              fill="outline"
              size="small"
              onClick={() => openDetails(booking)}
              aria-label={`View details for ${getTitle(booking)}`}
            >
              <IonIcon icon={eyeOutline} slot="start" />
              Details
            </IonButton>

            {canPay(status) && (
              <IonButton
                size="small"
                color="success"
                onClick={() => goToPayment(booking.id)}
                aria-label={`Pay for ${getTitle(booking)}`}
              >
                <IonIcon icon={cardOutline} slot="start" />
                Pay Now
              </IonButton>
            )}

            {canCancel(status) && (
              <IonButton
                fill="outline"
                color="danger"
                size="small"
                onClick={() => requestCancel(booking.id)}
                aria-label={`Cancel ${getTitle(booking)}`}
              >
                <IonIcon icon={trashOutline} slot="start" />
                Cancel
              </IonButton>
            )}
          </div>
        </IonCardContent>
      </IonCard>
    );
  };

  // -----------------------------------------------------------------------
  // UI
  // -----------------------------------------------------------------------
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>My Bookings</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="bookings-page ion-padding">
          {/* Summary */}
          <IonCard className="summary-card">
            <IonCardContent>
              <div className="summary-row">
                <div>
                  <IonText color="medium">
                    <p className="summary-label">Total spent</p>
                  </IonText>
                  <h2 className="summary-amount">{formatMoney(totalSpent, "MWK")}</h2>
                  <IonNote>
                    {counts.all} booking{counts.all === 1 ? "" : "s"}
                  </IonNote>
                </div>
                <IonIcon icon={cashOutline} className="summary-icon" aria-hidden="true" />
              </div>
            </IonCardContent>
          </IonCard>

          {/* Search */}
          <IonSearchbar
            value={searchTerm}
            onIonInput={(e) => setSearchTerm(e.detail.value ?? "")}
            placeholder="Search by property or location"
            debounce={250}
            className="bookings-search"
            aria-label="Search bookings"
          />

          {/* Filters */}
          <IonSegment
            value={activeFilter}
            onIonChange={(e) =>
              setActiveFilter((e.detail.value as FilterKey) || "all")
            }
            className="bookings-segment"
          >
            <IonSegmentButton value="all">
              All{counts.all > 0 ? ` (${counts.all})` : ""}
            </IonSegmentButton>
            <IonSegmentButton value="upcoming">
              Upcoming{counts.upcoming > 0 ? ` (${counts.upcoming})` : ""}
            </IonSegmentButton>
            <IonSegmentButton value="past">
              Past{counts.past > 0 ? ` (${counts.past})` : ""}
            </IonSegmentButton>
            <IonSegmentButton value="cancelled">
              Cancelled{counts.cancelled > 0 ? ` (${counts.cancelled})` : ""}
            </IonSegmentButton>
          </IonSegment>

          {/* Loading */}
          {phase === "loading" && renderSkeleton()}

          {/* Error */}
          {phase === "error" && (
            <IonCard className="state-card">
              <IonCardContent className="ion-text-center">
                <IonText color="danger">
                  <p role="alert">{errorMessage}</p>
                </IonText>
                <IonButton size="small" onClick={() => fetchBookings()}>
                  <IonIcon icon={refreshOutline} slot="start" />
                  Try again
                </IonButton>
              </IonCardContent>
            </IonCard>
          )}

          {/* Empty (no bookings at all) */}
          {phase === "empty" && (
            <IonCard className="state-card">
              <IonCardContent className="ion-text-center empty-state">
                <IonIcon icon={homeOutline} className="empty-icon" />
                <h3>No bookings yet</h3>
                <IonText color="medium">
                  <p>When you book a property, it will appear here.</p>
                </IonText>
                <IonButton size="small" onClick={() => history.push("/customer/properties")}>
                  Browse properties
                </IonButton>
              </IonCardContent>
            </IonCard>
          )}

          {/* Filtered empty */}
          {phase === "ready" && filteredBookings.length === 0 && (
            <IonCard className="state-card">
              <IonCardContent className="ion-text-center">
                <IonText color="medium">
                  <p>No bookings match your filters.</p>
                </IonText>
                <IonButton
                  size="small"
                  fill="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setActiveFilter("all");
                  }}
                >
                  Clear filters
                </IonButton>
              </IonCardContent>
            </IonCard>
          )}

          {/* List */}
          {phase === "ready" && filteredBookings.length > 0 && (
            <IonList className="bookings-list" lines="none">
              {filteredBookings.map(renderBookingCard)}
            </IonList>
          )}
        </div>
      </IonContent>

      {/* Cancel confirmation */}
      <IonAlert
        isOpen={showCancelAlert}
        header="Cancel booking?"
        message="This cannot be undone. Any pending payment will be voided according to the property’s cancellation policy."
        buttons={[
          {
            text: "Keep booking",
            role: "cancel",
            handler: () => {
              setSelectedBookingId(null);
            },
          },
          {
            text: cancelling ? "Cancelling…" : "Yes, cancel",
            role: "destructive",
            handler: () => {
              void handleCancel();
              return false; // keep open until async finishes
            },
          },
        ]}
        onDidDismiss={() => {
          if (!cancelling) {
            setShowCancelAlert(false);
            setSelectedBookingId(null);
          }
        }}
      />

      {/* Details modal */}
      <IonModal
        isOpen={showDetailModal}
        onDidDismiss={() => {
          setShowDetailModal(false);
          setSelectedBooking(null);
        }}
      >
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => setShowDetailModal(false)}>Close</IonButton>
            </IonButtons>
            <IonTitle>Booking details</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          {selectedBooking && (
            <>
              <IonCard className="detail-card">
                <IonCardContent>
                  <h2 className="detail-title">{getTitle(selectedBooking)}</h2>
                  <p className="detail-location">
                    <IonIcon icon={locationOutline} aria-hidden="true" />
                    {getLocation(selectedBooking)}
                  </p>
                </IonCardContent>
              </IonCard>

              <IonCard className="detail-card">
                <IonCardContent>
                  <h3 className="detail-section-title">Booking information</h3>

                  <IonItem lines="full">
                    <IonLabel>Status</IonLabel>
                    <IonBadge color={getStatusColor(selectedBooking.status)}>
                      {selectedBooking.status}
                    </IonBadge>
                  </IonItem>

                  <IonItem lines="full">
                    <IonLabel>Amount</IonLabel>
                    <strong>
                      {formatMoney(
                        getAmount(selectedBooking),
                        getCurrency(selectedBooking)
                      )}
                    </strong>
                  </IonItem>

                  {selectedBooking.check_in && (
                    <IonItem lines="full">
                      <IonLabel>Check-in</IonLabel>
                      <strong>{formatDate(selectedBooking.check_in)}</strong>
                    </IonItem>
                  )}

                  {selectedBooking.check_out && (
                    <IonItem lines="full">
                      <IonLabel>Check-out</IonLabel>
                      <strong>{formatDate(selectedBooking.check_out)}</strong>
                    </IonItem>
                  )}

                  {typeof selectedBooking.guests === "number" && (
                    <IonItem lines="full">
                      <IonLabel>Guests</IonLabel>
                      <strong>{selectedBooking.guests}</strong>
                    </IonItem>
                  )}

                  <IonItem lines="none">
                    <IonLabel>Booked on</IonLabel>
                    <strong>{formatDate(selectedBooking.created_at)}</strong>
                  </IonItem>
                </IonCardContent>
              </IonCard>

              {canPay(selectedBooking.status) && (
                <IonButton
                  expand="block"
                  color="success"
                  className="detail-cta"
                  onClick={() => {
                    setShowDetailModal(false);
                    goToPayment(selectedBooking.id);
                  }}
                >
                  <IonIcon icon={cardOutline} slot="start" />
                  Pay now
                </IonButton>
              )}

              {canCancel(selectedBooking.status) && (
                <IonButton
                  expand="block"
                  color="danger"
                  fill="outline"
                  className="detail-cta"
                  onClick={() => {
                    const id = selectedBooking.id;
                    setShowDetailModal(false);
                    setTimeout(() => requestCancel(id), 200);
                  }}
                >
                  Cancel this booking
                </IonButton>
              )}
            </>
          )}
        </IonContent>
      </IonModal>

      <style>{`
        .bookings-page {
          max-width: 640px;
          margin: 0 auto;
          padding-bottom: 32px;
        }
        .summary-card {
          border-radius: 16px;
          margin: 0 0 12px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .summary-label {
          margin: 0;
          font-size: 0.9rem;
        }
        .summary-amount {
          margin: 4px 0 2px;
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--ion-color-success);
        }
        .summary-icon {
          font-size: 44px;
          opacity: 0.7;
          color: var(--ion-color-success);
        }
        .bookings-search {
          padding: 0;
          margin-bottom: 8px;
        }
        .bookings-segment {
          margin-bottom: 16px;
        }
        .booking-card,
        .state-card,
        .detail-card {
          border-radius: 14px;
          margin: 0 0 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
        }
        .booking-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 10px;
        }
        .booking-title {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 650;
        }
        .booking-location {
          margin: 6px 0 0;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.9rem;
          opacity: 0.85;
        }
        .booking-status {
          text-transform: capitalize;
          flex-shrink: 0;
        }
        .booking-facts p {
          margin: 4px 0;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.92rem;
        }
        .booking-facts ion-icon {
          font-size: 16px;
          opacity: 0.75;
        }
        .booking-actions {
          margin-top: 14px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .empty-state {
          padding: 28px 16px;
        }
        .empty-icon {
          font-size: 48px;
          opacity: 0.45;
          margin-bottom: 8px;
        }
        .detail-title {
          margin: 0 0 6px;
          font-size: 1.2rem;
        }
        .detail-location {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 6px;
          opacity: 0.85;
        }
        .detail-section-title {
          margin: 0 0 8px;
          font-size: 0.95rem;
          font-weight: 600;
        }
        .detail-cta {
          margin-top: 12px;
          --border-radius: 12px;
          height: 48px;
          font-weight: 600;
        }
        .bookings-list {
          background: transparent;
          padding: 0;
        }
      `}</style>
    </IonPage>
  );
}