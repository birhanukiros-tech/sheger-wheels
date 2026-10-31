export default function robots() {
  const siteUrl = "https://sheger-wheels-two.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/cars", "/cars/"],
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
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}