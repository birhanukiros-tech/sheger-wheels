
import { notFound } from "next/navigation";
import cars from "@/data/cars.json";
import { createCarSlug } from "@/lib/car-slug";
import CarDetails from "@/components/cars/CarDetails";
import OwnerCarDetails from "@/components/cars/OwnerCarDetails";

export default async function CarDetailsPage({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const requestedCarId = query?.carId;

  // Owner-added cars are stored in localStorage, so the server
  // cannot look them up here. Load them in a small Client Component.
  if (requestedCarId) {
    if (!String(requestedCarId).startsWith("owner-car-")) {
      notFound();
    }

    return (
      <OwnerCarDetails
        slug={slug}
        requestedCarId={requestedCarId}
      />
    );
  }

  const car = cars.find(
    (item) => createCarSlug(item) === slug,
  );

  if (!car || car.available === false || car.isAvailable === false) {
    notFound();
  }

  const otherCars = cars
    .filter(
      (item) =>
        item.id !== car.id &&
        item.available !== false &&
        item.isAvailable !== false,
    )
    .slice(0, 3);

  return <CarDetails car={car} otherCars={otherCars} />;
}
