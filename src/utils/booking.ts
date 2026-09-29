// src/utils/booking.ts
export type BookingStatus =
  | "pending"
  | "approved"
  | "confirmed"
  | "completed"
  | "rejected"
  | "cancelled"
  | "paid"
  | string;

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
};

export const formatMoney = (amount: number, currency = "MWK") =>
  new Intl.NumberFormat("en-MW", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

export const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
};

export const normalizeStatus = (status: string) => (status || "").toLowerCase();

export const getStatusColor = (status: string): string => {
  switch (normalizeStatus(status)) {
    case "approved":
    case "confirmed":
    case "completed":
    case "paid":
      return "success";
    case "pending":
      return "warning";
    case "rejected":
      return "danger";
    case "cancelled":
      return "medium";
    default:
      return "primary";
  }
};

export const canPay = (status: string) =>
  ["pending", "approved"].includes(normalizeStatus(status));

export const canCancel = (status: string) =>
  ["pending", "approved", "confirmed"].includes(normalizeStatus(status));

export const isPaidStatus = (status: string) =>
  ["approved", "confirmed", "completed", "paid"].includes(normalizeStatus(status));