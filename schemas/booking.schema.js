
import { z } from "zod";

export const bookingStatusSchema = z.enum([
  "pending",
  "confirmed",
  "active",
  "completed",
  "cancelled",
  "rejected",
]);

export const bookingContactSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(80),
  email: z.string().trim().email("Enter a valid email address").max(254),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
  idType: z.enum([
    "national_id",
    "passport",
    "drivers_license",
    "other",
  ]),
  idNumber: z.string().trim().min(3, "ID number is required").max(50),
});

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

  contact: bookingContactSchema.optional(),

  paymentMethod: z.enum([
    "demo_card",
    "demo_telebirr",
    "pay_at_pickup",
  ]).optional(),

  paymentStatus: z.enum([
    "demo_paid",
    "pay_at_pickup",
  ]).optional(),

  paymentReference: z.string().optional(),
  paymentUpdatedAt: z.string().optional(),

  status: bookingStatusSchema,
  createdAt: z.string().min(1, "Creation date is required"),
  updatedAt: z.string().min(1, "Update date is required"),
});

export function validateBooking(booking) {
  return bookingSchema.safeParse(booking);
}
