export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;

  // Owner-added cars are stored in localStorage.
  // The server cannot retrieve their details for SEO metadata.
  if (String(query?.carId || "").startsWith("owner-car-")) {
    return {
      title: "Owner-Listed Car | Sheggar Wheels",
      description:
        "View an owner-listed vehicle on the Sheggar Wheels demo car rental marketplace.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const car = findCarBySlug(slug);

  if (!car) {
    return {
      title: "Car Not Found",
      description: "This car listing could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${car.year} ${car.make} ${car.model} for Rent`;
  const description =
    car.description ||
    `Explore this ${car.year} ${car.make} ${car.model} available for rent in ${car.location}. View details on Sheggar Wheels.`;

  const image = car.image;

  return {
    title,
    description,
    alternates: {
      canonical: `/cars/${slug}`,
    },
    openGraph: {
      title: `${title} | Sheggar Wheels`,
      description,
      url: `/cars/${slug}`,
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 800,
          alt: `${car.year} ${car.make} ${car.model}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Sheggar Wheels`,
      description,
      images: [image],
    },
  };
}