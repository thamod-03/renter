import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import adsApi from "../api/adsApi";
import AdMapView from "../components/AdMapView";

const AdDetail = () => {
  const { id } = useParams();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportError, setReportError] = useState(null);

  useEffect(() => {
    fetchAd();
  }, [id]);

  const fetchAd = async () => {
    try {
      setLoading(true);
      const response = await adsApi.getAdById(id);
      setAd(response.data.ad);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    try {
      setReportError(null);
      await adsApi.reportAd(id);
      setReportSubmitted(true);
      setTimeout(() => setReportSubmitted(false), 3000);
    } catch (err) {
      setReportError(err.message || "Failed to submit report");
    }
  };

  const handleContactRenter = () => {
    if (ad?.phoneNumber) {
      window.location.href = `tel:0${ad.phoneNumber}`;
    } else if (ad?.owner?.email) {
      window.location.href = `mailto:${ad.owner.email}?subject=Inquiry about ${ad.title}`;
    }
  };

  // Memoize location object to prevent infinite re-renders in AdMapView
  // Must be called before early returns to follow Rules of Hooks
  const mapLocation = useMemo(
    () =>
      ad?.location?.lat && ad?.location?.lng
        ? {
            latitude: ad.location.lat,
            longitude: ad.location.lng,
          }
        : null,
    [ad?.location?.lat, ad?.location?.lng],
  );

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!ad) return <div className="error">Ad not found</div>;

  const images = ad.images || [];
  const placeholderImage =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect fill='%23f0f0f0' width='600' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%23999'%3ENo Image Available%3C/text%3E%3C/svg%3E";
  const currentImage = images[selectedImageIndex] || {
    url: placeholderImage,
  };

  return (
    <div className="ad-detail">
      <div className="ad-detail-container">
        {/* Image Carousel */}
        <div className="ad-gallery">
          <div className="gallery-main">
            <img
              src={currentImage.url || currentImage.thumbUrl}
              alt={ad.title}
              className="main-image"
            />
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="gallery-thumbnails">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img.thumbUrl || img.url}
                  alt={`Thumbnail ${idx + 1}`}
                  className={`thumbnail ${idx === selectedImageIndex ? "active" : ""}`}
                  onClick={() => setSelectedImageIndex(idx)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Ad Info */}
        <div className="ad-info">
          <h1>{ad.title}</h1>

          {/* Price */}
          <p className="price">LKR {ad.price}/month</p>

          <p className="address">📍 {ad.address}</p>

          {/* Property Details */}
          <div className="property-details">
            <div className="detail-item">
              <strong>Member Count:</strong>
              <span>{ad.membersCount || 1}</span>
            </div>
            <div className="detail-item">
              <strong>Bills:</strong>
              <span>{ad.billsIncluded ? "Included" : "Not Included"}</span>
            </div>
          </div>

          <div className="description">
            <h3>Description</h3>
            <p>{ad.description}</p>
          </div>

          {/* Owner Contact Info */}
          <div className="owner-info">
            <h3>Contact {ad.owner?.name || "Renter"}</h3>
            <div className="contact-details">
              {ad.owner?.email && (
                <p>
                  <strong>Email:</strong> {ad.owner.email}
                </p>
              )}
              {ad.phoneNumber && (
                <p>
                  <strong>Phone:</strong> 0{ad.phoneNumber}
                </p>
              )}
              {ad.owner?.name && (
                <p>
                  <strong>Name:</strong> {ad.owner.name}
                </p>
              )}
            </div>
            <button className="contact-btn" onClick={handleContactRenter}>
              Contact Renter
            </button>
          </div>

          {/* Report Link */}
          <div className="report-section">
            {reportSubmitted ? (
              <p className="report-success">Report submitted successfully</p>
            ) : reportError ? (
              <p className="report-error">Error: {reportError}</p>
            ) : (
              <button className="report-link" onClick={handleReport}>
                Report this listing
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Map View */}
      {mapLocation && (
        <div className="ad-map">
          <h2>Location</h2>
          <AdMapView location={mapLocation} />
        </div>
      )}
    </div>
  );
};

export default AdDetail;
