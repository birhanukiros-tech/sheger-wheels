
"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  MapPin,
  Navigation,
  RotateCcw,
  Clock3,
  Route,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

const defaultPickup = [9.0222, 38.7468];
const defaultDropoff = [9.0355, 38.7524];

const pickupIcon = new L.DivIcon({
  className: "",
  html: `<div style="background:#0866F5;color:white;width:34px;height:34px;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px #0004;display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-weight:bold">P</span></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

const dropoffIcon = new L.DivIcon({
  className: "",
  html: `<div style="background:#E99230;color:white;width:34px;height:34px;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px #0004;display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-weight:bold">D</span></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

function MapBounds({ pickup, dropoff }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds([pickup, dropoff], {
      padding: [45, 45],
    });
  }, [map, pickup, dropoff]);

  return null;
}

export default function BookingLocationMap({ onLocationsChange }) {
  const [pickup, setPickup] = useState(defaultPickup);
  const [dropoff, setDropoff] = useState(defaultDropoff);
  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");

  useEffect(() => {
    onLocationsChange?.({ pickup, dropoff });
  }, [pickup, dropoff, onLocationsChange]);

  useEffect(() => {
    const controller = new AbortController();

    async function getRoute() {
      setRouteLoading(true);
      setRouteError("");

      try {
        const coordinates = [
          `${pickup[1]},${pickup[0]}`,
          `${dropoff[1]},${dropoff[0]}`,
        ].join(";");

        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Route service unavailable.");
        }

        const data = await response.json();
        const selectedRoute = data.routes?.[0];

        if (!selectedRoute) {
          throw new Error("No driving route found.");
        }

        setRoute(
          selectedRoute.geometry.coordinates.map(([lng, lat]) => [
            lat,
            lng,
          ])
        );

        setDistance((selectedRoute.distance / 1000).toFixed(1));
        setDuration(Math.ceil(selectedRoute.duration / 60));
      } catch (error) {
        if (error.name !== "AbortError") {
          setRoute([]);
          setDistance(null);
          setDuration(null);
          setRouteError(
            "Route information is temporarily unavailable."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setRouteLoading(false);
        }
      }
    }

    getRoute();

    return () => controller.abort();
  }, [pickup, dropoff]);

  function resetLocations() {
    setPickup(defaultPickup);
    setDropoff(defaultDropoff);
  }

  return (
    <section className="mt-7 rounded-2xl border border-[#E5EAF1] bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#0866F5]" />
            <h2 className="text-lg font-bold text-[#252A34]">
              Pickup and drop-off locations
            </h2>
          </div>

          <p className="mt-2 text-sm leading-6 text-[#667085]">
            Drag the markers to choose your preferred pickup and
            drop-off locations.
          </p>
        </div>

        <button
          type="button"
          onClick={resetLocations}
          className="inline-flex min-h-9 items-center gap-2 self-start rounded-lg border border-[#E5EAF1] px-3 py-2 text-sm font-medium text-[#667085] transition-colors hover:border-[#0866F5] hover:text-[#0866F5]"
        >
          <RotateCcw className="h-4 w-4" />
          Reset locations
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0866F5] text-sm font-bold text-white">
            P
          </span>
          <span className="text-sm font-medium text-[#252A34]">
            Pickup
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E99230] text-sm font-bold text-white">
            D
          </span>
          <span className="text-sm font-medium text-[#252A34]">
            Drop-off
          </span>
        </div>
      </div>

      <div className="mt-4 h-[300px] overflow-hidden rounded-xl border border-[#E5EAF1] bg-[#F4F7FB] sm:h-[340px]">
        <MapContainer
          center={[9.03, 38.74]}
          zoom={13}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapBounds pickup={pickup} dropoff={dropoff} />

          <Marker
            position={pickup}
            icon={pickupIcon}
            draggable
            eventHandlers={{
              dragend(event) {
                const position = event.target.getLatLng();
                setPickup([position.lat, position.lng]);
              },
            }}
          >
            <Popup>Pickup location</Popup>
          </Marker>

          <Marker
            position={dropoff}
            icon={dropoffIcon}
            draggable
            eventHandlers={{
              dragend(event) {
                const position = event.target.getLatLng();
                setDropoff([position.lat, position.lng]);
              },
            }}
          >
            <Popup>Drop-off location</Popup>
          </Marker>

          {route.length > 0 && (
            <Polyline
              positions={route}
              pathOptions={{
                color: "#0866F5",
                weight: 5,
                opacity: 0.8,
              }}
            />
          )}
        </MapContainer>
      </div>

      <div className="mt-4 rounded-xl border border-[#E5EAF1] bg-[#F4F7FB] p-4">
        {routeLoading ? (
          <div className="flex items-center gap-2 text-sm text-[#667085]">
            <Navigation className="h-4 w-4 animate-pulse text-[#0866F5]" />
            Calculating driving route...
          </div>
        ) : routeError ? (
          <p className="text-sm text-[#667085]">{routeError}</p>
        ) : distance !== null ? (
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-[#0866F5]" />
              <div>
                <p className="text-xs text-[#667085]">Distance</p>
                <p className="text-sm font-semibold text-[#252A34]">
                  {distance} km
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-[#0866F5]" />
              <div>
                <p className="text-xs text-[#667085]">Estimated driving time</p>
                <p className="text-sm font-semibold text-[#252A34]">
                  {duration} min
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <p className="mt-3 text-xs leading-5 text-[#98A2B3]">
        Map data © OpenStreetMap contributors. Route estimates provided
        by OSRM.
      </p>
    </section>
  );
}
