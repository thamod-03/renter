import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";

const AdCard = ({ ad }) => {
  const imageRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);
  // Use SVG data URI instead of external placeholder
  const placeholderUrl =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23f0f0f0' width='300' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%23999'%3ELoading...%3C/text%3E%3C/svg%3E";

  // Lazy load image using Intersection Observer
  useEffect(() => {
    if (!imageRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const img = entries[0].target;
          const src = img.dataset.src || placeholderUrl;

          // Preload image
          const preloadImg = new Image();
          preloadImg.onload = () => {
            setImageSrc(src);
            img.classList.add("loaded");
          };
          preloadImg.onerror = () => {
            setImageSrc(placeholderUrl);
            img.classList.add("loaded");
          };
          preloadImg.src = src;

          observer.unobserve(img);
        }
      },
      { rootMargin: "50px" },
    );

    observer.observe(imageRef.current);
    return () => observer.disconnect();
  }, []);

  const thumbUrl = ad.thumbUrl || placeholderUrl;
  const displayImage = imageSrc || placeholderUrl;

  return (
    <div className="ad-card">
      <div className="ad-image-container">
        <img
          ref={imageRef}
          data-src={thumbUrl}
          src={displayImage}
          alt={ad.title}
          className="ad-image"
        />
        {ad.billsIncluded && (
          <span className="badge badge-bills">Bills Included</span>
        )}
      </div>
      <div className="ad-content">
        <h3>
          <Link to={`/ads/${ad._id}`}>{ad.title}</Link>
        </h3>
        <p className="ad-price">LKR {ad.price}/month</p>

        {ad.membersCount && (
          <p className="ad-members">
            👥 {ad.membersCount} member{ad.membersCount > 1 ? "s" : ""}
          </p>
        )}

        {ad.descriptionSnippet && (
          <p className="ad-snippet">{ad.descriptionSnippet}</p>
        )}

        {ad.address && <p className="ad-location">📍 {ad.address}</p>}

        <Link to={`/ads/${ad._id}`} className="view-btn">
          View Details
        </Link>
      </div>
    </div>
  );
};

export default AdCard;
