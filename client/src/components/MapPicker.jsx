import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const MapPicker = ({ onLocationSelect, initialLocation }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);

  useEffect(() => {
    if (!map.current) {
      // Default to Sri Lanka (Moratuwa) instead of London
      map.current = L.map(mapContainer.current).setView([6.7735, 80.0028], 13);

      L.tileLayer(
        import.meta.env.VITE_MAP_TILE_URL ||
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        },
      ).addTo(map.current);

      map.current.on("click", (e) => {
        const { lat, lng } = e.latlng;
        updateMarker(lat, lng);
        onLocationSelect({ latitude: lat, longitude: lng });
      });
    }

    if (initialLocation) {
      updateMarker(initialLocation.latitude, initialLocation.longitude);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const updateMarker = (lat, lng) => {
    if (marker.current) {
      marker.current.setLatLng([lat, lng]);
    } else {
      marker.current = L.marker([lat, lng]).addTo(map.current);
    }
    map.current.setView([lat, lng], map.current.getZoom());
  };

  return (
    <div
      ref={mapContainer}
      className="map-picker"
      style={{ height: "400px" }}
    />
  );
};

export default MapPicker;
