import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import AdList from "../components/AdList";
import axiosInstance from "../api/axiosInstance";
import "../styles/globals.css";

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

const PAGE_SIZE = 12;
const DEFAULT_CENTER = [6.7735, 80.0028]; // Moratuwa, Sri Lanka
const DEFAULT_ZOOM = 10;

const Home = () => {
  const [allAds, setAllAds] = useState([]);
  const [filteredAds, setFilteredAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [priceRange, setPriceRange] = useState({ min: 0, max: 50000 });
  const [billsIncludedOnly, setBillsIncludedOnly] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");

  // Sorting
  const [sortBy, setSortBy] = useState("newest"); // newest, price-low, price-high

  // Map state
  const [showMap, setShowMap] = useState(true);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);

  // Fetch published ads on mount
  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/ads/published/list");
      setAllAds(response.data.ads || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch ads:", err);
      setError("Failed to load ads. Please try again later.");
      setAllAds([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...allAds];

    // Filter by search keyword in title and address
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(
        (ad) =>
          ad.title.toLowerCase().includes(keyword) ||
          ad.address.toLowerCase().includes(keyword),
      );
    }

    // Filter by price range
    filtered = filtered.filter(
      (ad) => ad.price >= priceRange.min && ad.price <= priceRange.max,
    );

    // Filter by bills included
    if (billsIncludedOnly) {
      filtered = filtered.filter((ad) => ad.billsIncluded === true);
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "newest":
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    setFilteredAds(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [allAds, priceRange, billsIncludedOnly, sortBy, searchKeyword]);

  // Pagination
  const totalPages = Math.ceil(filteredAds.length / PAGE_SIZE);
  const paginatedAds = filteredAds.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // Get ads with valid locations for map (memoized to prevent infinite loops)
  const adsWithLocation = useMemo(
    () =>
      filteredAds.filter(
        (ad) => ad.location && ad.location.lat && ad.location.lng,
      ),
    [filteredAds],
  );

  // Calculate center based on ads
  useEffect(() => {
    if (adsWithLocation.length > 0) {
      const avgLat =
        adsWithLocation.reduce((sum, ad) => sum + ad.location.lat, 0) /
        adsWithLocation.length;
      const avgLng =
        adsWithLocation.reduce((sum, ad) => sum + ad.location.lng, 0) /
        adsWithLocation.length;
      setMapCenter([avgLat, avgLng]);
    }
  }, [adsWithLocation]);

  return (
    <div className="home">
      <div className="hero">
        <h1>Find Your Perfect Rental</h1>
        <p>Browse thousands of listings in your area</p>
      </div>

      <div className="filters-section">
        <div className="filter-group search-group">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            type="text"
            placeholder="Search by keyword (title or address)"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <label>
            Price Range: LKR {priceRange.min} - LKR {priceRange.max}
          </label>
          <input
            type="range"
            min="0"
            max="50000"
            value={priceRange.max}
            onChange={(e) =>
              setPriceRange((prev) => ({
                ...prev,
                max: parseInt(e.target.value),
              }))
            }
            className="price-slider"
          />
        </div>

        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              checked={billsIncludedOnly}
              onChange={(e) => setBillsIncludedOnly(e.target.checked)}
            />
            Bills Included Only
          </label>
        </div>

        <div className="filter-group">
          <label htmlFor="sort">Sort By:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            id="sort"
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              checked={showMap}
              onChange={(e) => setShowMap(e.target.checked)}
            />
            Show Map
          </label>
        </div>

        {filteredAds.length > 0 && (
          <div className="filter-info">
            Showing {paginatedAds.length} of {filteredAds.length} listings
          </div>
        )}
      </div>

      {showMap && adsWithLocation.length > 0 && (
        <div className="map-container">
          <MapContainer
            center={mapCenter}
            zoom={DEFAULT_ZOOM}
            style={{ height: "400px", width: "100%", borderRadius: "8px" }}
          >
            <TileLayer
              url={
                import.meta.env.VITE_MAP_TILE_URL ||
                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              }
              attribution="© OpenStreetMap contributors"
            />
            <MarkerClusterGroup>
              {adsWithLocation.map((ad) => (
                <Marker
                  key={ad._id}
                  position={[ad.location.lat, ad.location.lng]}
                >
                  <Popup>
                    <div className="marker-popup">
                      <h4>{ad.title}</h4>
                      <p>LKR {ad.price}/month</p>
                      <a href={`/ads/${ad._id}`}>View Details</a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </MapContainer>
        </div>
      )}

      <div className="ads-section">
        {loading && <div className="loading">Loading ads...</div>}
        {error && <div className="error">{error}</div>}
        {!loading && filteredAds.length === 0 && (
          <div className="no-results">No ads found matching your criteria</div>
        )}
        {!loading && filteredAds.length > 0 && (
          <>
            <AdList ads={paginatedAds} loading={false} error={null} />

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="pagination-btn"
                >
                  ← Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="pagination-btn"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
