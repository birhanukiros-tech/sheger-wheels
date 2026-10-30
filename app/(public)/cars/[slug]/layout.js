export const metadata = {
  title: "Car Details",
  description:
    "Explore vehicle details, features, pricing, and availability with Sheggar Wheels, a demo car rental marketplace in Addis Ababa, Ethiopia.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Explore Cars for Rent | Sheggar Wheels",
    description:
      "Discover vehicle details and explore demo car rental options in Addis Ababa.",
    type: "website",
  },
};

export default function CarDetailsLayout({ children }) {
  return children;
}