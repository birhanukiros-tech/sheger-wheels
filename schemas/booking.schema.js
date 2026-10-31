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
  idType: z.enum(["national_id", "passport", "drivers_license", "other"]),
  idNumber: z.string().trim().min(3, "ID number is required").max(50),
});

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid YYYY-MM-DD date").refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Enter a valid calendar date");

export const bookingSchema = z.object({
  id: z.string().min(1, "Booking ID is required"),
  carId: z.string().min(1, "Car ID is required"),
  renterId: z.string().min(1, "Renter ID is required"),
  ownerId: z.string().min(1, "Owner ID is required"),
  startDate: dateSchema,
  endDate: dateSchema,
  dailyPrice: z.number().finite().positive("Daily price must be positive"),
  totalDays: z.number().int().positive("Rental duration must be positive"),
  totalPrice: z.number().finite().positive("Total price must be positive"),
  contact: bookingContactSchema.optional(),
  paymentMethod: z.enum(["demo_card", "demo_telebirr", "pay_at_pickup"]).optional(),
  paymentStatus: z.enum(["demo_paid", "pay_at_pickup"]).optional(),
  paymentReference: z.string().optional(),
  paymentUpdatedAt: z.string().optional(),
  status: bookingStatusSchema,
  createdAt: z.string().min(1, "Creation date is required"),
  updatedAt: z.string().min(1, "Update date is required"),
}).superRefine((booking, ctx) => {
  const start = new Date(`${booking.startDate}T00:00:00.000Z`);
  const end = new Date(`${booking.endDate}T00:00:00.000Z`);
  const days = (end.getTime() - start.getTime()) / 86400000;

  if (days < 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "Return date must be after pickup date." });
  } else if (days !== booking.totalDays) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["totalDays"], message: "Rental duration does not match the selected dates." });
  }

  if (Math.abs(booking.totalPrice - booking.dailyPrice * booking.totalDays) > 0.01) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["totalPrice"], message: "Total price does not match the rental duration and daily price." });
  }
});

export function validateBooking(booking) {
  return bookingSchema.safeParse(booking);
}
