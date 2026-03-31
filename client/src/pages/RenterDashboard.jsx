import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import adsApi from "../api/adsApi";

const RenterDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [banWarning, setBanWarning] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    adId: null,
    adTitle: "",
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Show warning if user is banned
    if (user && user.banned) {
      setBanWarning(true);
    }
    fetchUserAds();
  }, [user]);

  const fetchUserAds = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all user ads (backend filters by owner via JWT)
      const response = await adsApi.getAds();
      setAds(response.data.ads || []);
    } catch (err) {
      setError(err.message || "Failed to fetch your ads");
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (adId) => {
    navigate(`/edit/${adId}`);
  };

  const handleViewClick = (adId) => {
    navigate(`/ads/${adId}`);
  };

  const handleDeleteClick = (adId, adTitle) => {
    setDeleteModal({
      show: true,
      adId,
      adTitle,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.adId) return;

    try {
      setDeleting(true);
      await adsApi.deleteAd(deleteModal.adId);
      setAds((prev) => prev.filter((ad) => ad._id !== deleteModal.adId));
      setDeleteModal({ show: false, adId: null, adTitle: "" });
    } catch (err) {
      setError(err.message || "Failed to delete ad");
    } finally {
      setDeleting(false);
    }
  };

  // Calculate statistics
  const totalAds = ads.length;
  const publishedAds = ads.filter((ad) => ad.status === "published").length;
  const reviewAds = ads.filter((ad) => ad.status === "review").length;

  // Format status as display text
  const getStatusDisplay = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Get status pill color
  const getStatusColor = (status) => {
    switch (status) {
      case "review":
        return "pill-warning";
      case "published":
        return "pill-success";
      case "removed":
        return "pill-danger";
      default:
        return "";
    }
  };

  if (loading) {
    return <div className="loading">Loading your dashboard...</div>;
  }

  if (deleteModal.show) {
    return (
      <div className="confirmation-modal-overlay">
        <div className="confirmation-modal delete-modal">
          <div className="delete-icon">⚠</div>
          <h2>Delete Listing?</h2>
          <p>Are you sure you want to delete "{deleteModal.adTitle}"?</p>
          <p className="delete-warning">This action cannot be undone.</p>
          <div className="modal-actions">
            <button
              className="cancel-btn"
              onClick={() =>
                setDeleteModal({ show: false, adId: null, adTitle: "" })
              }
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              className="delete-confirm-btn"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="renter-dashboard-page">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>My Rental Listings</h1>
          <p className="header-subtitle">Manage your property listings</p>
        </div>
        <button
          className="create-new-btn"
          onClick={() => navigate("/create")}
          disabled={user && user.banned}
        >
          + Create New Ad
        </button>
      </div>

      {banWarning && (
        <div
          style={{
            margin: "20px",
            padding: "15px 20px",
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c6cb",
            borderRadius: "4px",
            color: "#721c24",
          }}
        >
          <strong>⚠ Warning:</strong> Your account has been banned and you
          cannot post new ads.
        </div>
      )}

      {error && (
        <div className="error-alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Summary Statistics */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>Total Listings</h3>
            <p className="stat-number">{totalAds}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <h3>Published</h3>
            <p className="stat-number">{publishedAds}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Under Review</h3>
            <p className="stat-number">{reviewAds}</p>
          </div>
        </div>
      </div>

      {/* Ads Grid */}
      {totalAds === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h2>No Listings Yet</h2>
          <p>You haven't created any rental listings yet.</p>
          <button className="primary-btn" onClick={() => navigate("/create")}>
            Create Your First Listing
          </button>
        </div>
      ) : (
        <div className="ads-grid">
          {ads.map((ad) => (
            <div key={ad._id} className="ad-dashboard-card">
              {/* Image */}
              <div className="card-image-container">
                <img
                  src={
                    ad.images?.[0]?.thumbUrl ||
                    ad.images?.[0]?.url ||
                    "https://via.placeholder.com/300x200"
                  }
                  alt={ad.title}
                  className="card-image"
                />
                <span className={`status-badge ${getStatusColor(ad.status)}`}>
                  {getStatusDisplay(ad.status)}
                </span>
              </div>

              {/* Content */}
              <div className="card-content">
                <h3 className="card-title">{ad.title}</h3>

                <div className="card-meta">
                  {ad.billsIncluded && (
                    <span className="meta-badge">💡 Bills Included</span>
                  )}
                  {ad.membersCount && (
                    <span className="meta-badge">
                      👥 {ad.membersCount} rooms
                    </span>
                  )}
                </div>

                <p className="card-price">
                  LKR {ad.price}
                  <span className="price-period">/month</span>
                </p>

                {ad.address && <p className="card-address">📍 {ad.address}</p>}
              </div>

              {/* Actions */}
              <div className="card-actions">
                <button
                  className="action-btn edit-btn"
                  onClick={() => handleEditClick(ad._id)}
                  title="Edit this listing"
                >
                  Edit
                </button>
                <button
                  className="action-btn view-btn"
                  onClick={() => handleViewClick(ad._id)}
                  title="View this listing"
                >
                  View
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDeleteClick(ad._id, ad.title)}
                  title="Delete this listing"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RenterDashboard;
