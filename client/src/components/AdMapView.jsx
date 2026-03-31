import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const AdMapView = ({ location }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (!location) return;

    if (!map.current) {
      map.current = L.map(mapContainer.current).setView(
        [location.latitude, location.longitude],
        15,
      );

      L.tileLayer(
        import.meta.env.VITE_MAP_TILE_URL ||
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        },
      ).addTo(map.current);
    }

    L.marker([location.latitude, location.longitude]).addTo(map.current);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [location]);

  return (
    <div
      ref={mapContainer}
      className="ad-map-view"
      style={{ height: "400px" }}
    />
  );
};

export default AdMapView;
