export const metadata = {
  title: "Cars for Rent in Addis Ababa",
  description:
    "Browse cars available for rent in Addis Ababa, Ethiopia. Compare demo vehicles by price, transmission, fuel type, and seating capacity with Sheggar Wheels.",
  alternates: {
    canonical: "/cars",
  },
  openGraph: {
    title: "Cars for Rent in Addis Ababa | Sheggar Wheels",
    description:
      "Explore available demo vehicles, compare prices, and find your next ride in Addis Ababa.",
    url: "/cars",
    type: "website",
  },
};

export default function CarsLayout({ children }) {
  return children;
}
