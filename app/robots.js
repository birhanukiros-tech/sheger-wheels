import { NextResponse } from "next/server";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/cars"],
        disallow: [
          "/signin",
          "/signup",
          "/admin",
          "/owner",
          "/dashboard",
          "/bookings",
          "/checkout",
        ],
      },
    ],
    sitemap: "http://localhost:3000/sitemap.xml",
  };
}
