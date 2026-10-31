import { notFound } from "next/navigation";
import cars from "@/data/cars.json";
import { createCarSlug } from "@/lib/car-slug";
import CarDetails from "@/components/cars/CarDetails";
import OwnerCarDetails from "@/components/cars/OwnerCarDetails";

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;

  if (String(query?.carId || "").startsWith("owner-car-")) {
    return {
      title: "Owner-Listed Car | Sheggar Wheels",
      description: "View an owner-listed vehicle on Sheggar Wheels.",
      robots: { index: false, follow: false },
    };
  }

  const car = cars.find((item) => createCarSlug(item) === slug);

  if (!car) {
    return {
      title: "Car Not Found",
      description: "This car listing could not be found.",
      robots: { index: false, follow: false },
    };
  }

  const title = `${car.year} ${car.make} ${car.model} for Rent`;
  const description =
    car.description ||
    `Explore this ${car.year} ${car.make} ${car.model} available for rent in ${car.location}.`;

  return {
    title,
    description,
    alternates: { canonical: `/cars/${slug}` },
    openGraph: {
      title: `${title} | Sheggar Wheels`,
      description,
      url: `/cars/${slug}`,
      type: "website",
      images: [{ url: car.image, width: 1200, height: 800 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Sheggar Wheels`,
      description,
      images: [car.image],
    },
  };
}

export default async function CarDetailsPage({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;

  if (String(query?.carId || "").startsWith("owner-car-")) {
    return <OwnerCarDetails carId={query.carId} />;
  }

  const car = cars.find((item) => createCarSlug(item) === slug);

  if (!car) {
    notFound();
  }

  const otherCars = cars
    .filter((item) => item.id !== car.id)
    .slice(0, 3);

  return <CarDetails car={car} otherCars={otherCars} />;
}