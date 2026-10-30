import cars from "@/data/cars.json";
import { createCarSlug } from "@/lib/car-slug";

const BASE_URL = "http://localhost:3000";

export async function generateMetadata({ params }) {
  const { slug } = await params;

  const car = cars.find((item) => createCarSlug(item) === slug);

  // Handle slugs that don't match a seeded car.
  if (!car) {
    return {
      title: "Car Details",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const carName = `${car.year} ${car.make} ${car.model}`;
  const title = `${carName} for Rent in Addis Ababa | Sheggar Wheels`;
  const description = `Explore the ${carName} available in ${car.location}. Check its features, ${car.seats} seats, ${car.transmission} transmission, and daily rental price of ETB ${Number(car.dailyPrice).toLocaleString("en-US")}.`;

  const canonicalUrl = `${BASE_URL}/cars/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
    },
    twitter: {
  card: "summary_large_image",
  title,
  description,
},
  };
}

export default function CarDetailsLayout({ children }) {
  return children;
}