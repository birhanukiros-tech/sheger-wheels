import cars from "@/data/cars.json";
import { createCarSlug } from "@/lib/car-slug";

const BASE_URL = "http://localhost:3000";

export default function sitemap() {
  const publicPages = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/cars`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const carPages = cars
    .filter(
      (car) => car.status === "available" && car.id && car.make && car.model,
    )
    .map((car) => ({
      url: `${BASE_URL}/cars/${createCarSlug(car)}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  return [...publicPages, ...carPages];
}