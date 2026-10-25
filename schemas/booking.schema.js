import { z } from "zod";

export const bookingStatusSchema = z.enum([
  "pending",
  "confirmed",
  "active",
  "completed",
  "cancelled",
  "rejected",
]);

export const bookingSchema = z.object({
  id: z.string().min(1, "Booking ID is required"),
  carId: z.string().min(1, "Car ID is required"),
  renterId: z.string().min(1, "Renter ID is required"),
  ownerId: z.string().min(1, "Owner ID is required"),

  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),

  dailyPrice: z.number().finite().positive("Daily price must be positive"),
  totalDays: z.number().int().positive("Rental duration must be positive"),
  totalPrice: z.number().finite().nonnegative(),

  status: bookingStatusSchema,

  createdAt: z.string().min(1, "Creation date is required"),
  updatedAt: z.string().min(1, "Update date is required"),
});

export function validateBooking(booking) {
  return bookingSchema.safeParse(booking);
}
