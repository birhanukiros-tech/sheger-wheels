import { STORAGE_KEYS, readStoredData, writeStoredData } from "./storage";
import { bookingSchema } from "../schemas/booking.schema";

const NON_BLOCKING_STATUSES = new Set(["cancelled", "rejected"]);

function datesOverlap(firstStart, firstEnd, secondStart, secondEnd) {
  // Rental periods are half-open: the return date is not an occupied night.
  return firstStart < secondEnd && secondStart < firstEnd;
}

export function getBookings() {
  const storedBookings = readStoredData(STORAGE_KEYS.bookings, []);

  if (!Array.isArray(storedBookings)) return [];

  return storedBookings.filter((booking) =>
    bookingSchema.safeParse(booking).success
  );
}

export function getBookingById(bookingId) {
  return getBookings().find((booking) => booking.id === bookingId) ?? null;
}

export function getBookingsByRenter(renterId) {
  return getBookings().filter((booking) => booking.renterId === renterId);
}

export function getBookingsByOwner(ownerId) {
  return getBookings().filter((booking) => booking.ownerId === ownerId);
}

export function createBooking(bookingData) {
  const result = bookingSchema.safeParse(bookingData);

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message ?? "Invalid booking details.",
    };
  }

  const bookings = getBookings();

  if (bookings.some((booking) => booking.id === result.data.id)) {
    return { success: false, error: "A booking with this ID already exists." };
  }

  const conflict = bookings.find((booking) =>
    booking.carId === result.data.carId &&
    !NON_BLOCKING_STATUSES.has(booking.status) &&
    datesOverlap(
      result.data.startDate,
      result.data.endDate,
      booking.startDate,
      booking.endDate
    )
  );

  if (conflict) {
    return {
      success: false,
      error: "This car already has a booking that overlaps those dates. Please choose another date range.",
    };
  }

  const updatedBookings = [...bookings, result.data];
  const saved = writeStoredData(STORAGE_KEYS.bookings, updatedBookings);

  if (!saved) return { success: false, error: "Unable to save the booking." };

  return { success: true, booking: result.data };
}

export function updateBookingStatus(bookingId, status) {
  const bookings = getBookings();
  const bookingIndex = bookings.findIndex((booking) => booking.id === bookingId);

  if (bookingIndex === -1) return { success: false, error: "Booking not found." };

  const updatedBooking = {
    ...bookings[bookingIndex],
    status,
    updatedAt: new Date().toISOString(),
  };

  const result = bookingSchema.safeParse(updatedBooking);

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message ?? "Invalid booking update.",
    };
  }

  const updatedBookings = [...bookings];
  updatedBookings[bookingIndex] = result.data;
  const saved = writeStoredData(STORAGE_KEYS.bookings, updatedBookings);

  if (!saved) return { success: false, error: "Unable to save the booking update." };

  return { success: true, booking: result.data };
}
