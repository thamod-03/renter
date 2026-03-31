import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import adminApi from "../api/adminApi";
import "../styles/globals.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  // Tab state
  const [activeTab, setActiveTab] = useState("ads");

  // Ads state
  const [reviewAds, setReviewAds] = useState([]);
  const [allAds, setAllAds] = useState([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const [adsError, setAdsError] = useState("");
  const [adStatus, setAdStatus] = useState("all");
  const [adSearch, setAdSearch] = useState("");

  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");

  // Modal states
  const [publishModal, setPublishModal] = useState({
    show: false,
    adId: null,
    adTitle: "",
  });
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    adId: null,
    adTitle: "",
  });
  const [editModal, setEditModal] = useState({
    show: false,
    ad: null,
    formData: {},
  });
  const [banModal, setBanModal] = useState({
    show: false,
    userId: null,
    userName: "",
  });
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [banning, setBanning] = useState(false);
  const [banReason, setBanReason] = useState("");

  // Fetch review ads
  const fetchReviewAds = async () => {
    try {
      setAdsLoading(true);
      setAdsError("");
      const response = await adminApi.getReviewAds();
      setReviewAds(response.data.ads || []);
    } catch (err) {
      setAdsError(
        err.response?.data?.message || "Failed to fetch review queue",
      );
    } finally {
      setAdsLoading(false);
    }
  };

  // Fetch all ads
  const fetchAllAds = async () => {
    try {
      setAdsLoading(true);
      setAdsError("");
      const response = await adminApi.getAllAds(adStatus, adSearch);
      setAllAds(response.data.ads || []);
    } catch (err) {
      setAdsError(err.response?.data?.message || "Failed to fetch ads");
    } finally {
      setAdsLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setUsersError("");
      const response = await adminApi.getUsers();
      setUsers(response.data.users || []);
    } catch (err) {
      setUsersError(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setUsersLoading(false);
    }
  };

  // Load data on tab change
  useEffect(() => {
    if (activeTab === "ads") {
      fetchReviewAds();
    } else if (activeTab === "all-ads") {
      fetchAllAds();
    } else if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab, adStatus, adSearch]);

  // Publish ad handler
  const handlePublishClick = (adId, adTitle) => {
    setPublishModal({ show: true, adId, adTitle });
  };

  const handleConfirmPublish = async () => {
    try {
      setPublishing(true);
      await adminApi.publishAd(publishModal.adId);
      setReviewAds((prev) => prev.filter((ad) => ad._id !== publishModal.adId));
      setPublishModal({ show: false, adId: null, adTitle: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to publish ad");
    } finally {
      setPublishing(false);
    }
  };

  // Delete ad handler
  const handleDeleteClick = (adId, adTitle) => {
    setDeleteModal({ show: true, adId, adTitle });
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      await adminApi.deleteAd(deleteModal.adId);
      setReviewAds((prev) => prev.filter((ad) => ad._id !== deleteModal.adId));
      setAllAds((prev) => prev.filter((ad) => ad._id !== deleteModal.adId));
      setDeleteModal({ show: false, adId: null, adTitle: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete ad");
    } finally {
      setDeleting(false);
    }
  };

  // Edit ad handler
  const handleEditClick = (ad) => {
    setEditModal({
      show: true,
      ad,
      formData: {
        title: ad.title,
        price: ad.price,
        description: ad.description,
        address: ad.address,
        billsIncluded: ad.billsIncluded,
        membersCount: ad.membersCount,
        status: ad.status,
      },
    });
  };

  const handleConfirmEdit = async () => {
    try {
      setEditing(true);
      await adminApi.updateAd(editModal.ad._id, editModal.formData);
      setAllAds((prev) =>
        prev.map((ad) =>
          ad._id === editModal.ad._id ? { ...ad, ...editModal.formData } : ad,
        ),
      );
      setEditModal({ show: false, ad: null, formData: {} });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update ad");
    } finally {
      setEditing(false);
    }
  };

  // Ban user handler
  const handleBanClick = (userId, userName) => {
    setBanModal({ show: true, userId, userName });
    setBanReason("");
  };

  const handleConfirmBan = async () => {
    try {
      setBanning(true);
      await adminApi.banUser(banModal.userId, banReason);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === banModal.userId ? { ...u, banned: true } : u,
        ),
      );
      setBanModal({ show: false, userId: null, userName: "" });
      setBanReason("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to ban user");
    } finally {
      setBanning(false);
    }
  };

  if (user && user.role !== "admin") {
    return <div>Access Denied</div>;
  }

  const isBanned = (user) => user.banned || user.isActive === false;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <p className="admin-subtitle">Manage listings and users</p>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === "ads" ? "active" : ""}`}
          onClick={() => setActiveTab("ads")}
        >
          📋 Review Queue ({reviewAds.length})
        </button>
        <button
          className={`tab-button ${activeTab === "all-ads" ? "active" : ""}`}
          onClick={() => setActiveTab("all-ads")}
        >
          📚 All Ads ({allAds.length})
        </button>
        <button
          className={`tab-button ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          👥 Users ({users.length})
        </button>
      </div>

      {/* Review Queue Tab */}
      {activeTab === "ads" && (
        <div className="admin-tab-content">
          {adsError && <div className="error-banner">{adsError}</div>}

          {adsLoading ? (
            <div className="loading">Loading review queue...</div>
          ) : reviewAds.length === 0 ? (
            <div className="empty-state">
              <p>✓ No ads pending review</p>
            </div>
          ) : (
            <div className="review-queue">
              {reviewAds.map((ad) => (
                <div key={ad._id} className="review-card">
                  {/* Ad Thumbnail */}
                  <div className="review-card-image">
                    {ad.images && ad.images.length > 0 ? (
                      <img
                        src={ad.images[0].thumbUrl || ad.images[0].url}
                        alt={ad.title}
                      />
                    ) : (
                      <div className="image-placeholder">No Image</div>
                    )}
                  </div>

                  {/* Ad Details */}
                  <div className="review-card-content">
                    <div className="review-card-header">
                      <h3>{ad.title}</h3>
                      <span className="badge-price">LKR {ad.price}/mo</span>
                    </div>

                    <p className="review-renter">
                      <strong>Renter:</strong> {ad.owner?.name || "Unknown"} (
                      {ad.owner?.email})
                    </p>

                    <p className="review-address">
                      📍 {ad.address || "No address provided"}
                    </p>

                    <p className="review-excerpt">
                      {ad.description?.substring(0, 150)}...
                    </p>

                    <div className="review-meta">
                      <span className="meta-item">
                        👥 {ad.membersCount} members
                      </span>
                      {ad.billsIncluded && (
                        <span className="meta-item pill-success">
                          💡 Bills Included
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="review-card-actions">
                    <button
                      className="action-btn btn-success"
                      onClick={() => handlePublishClick(ad._id, ad.title)}
                    >
                      ✓ Publish
                    </button>
                    <button
                      className="action-btn btn-danger"
                      onClick={() => handleDeleteClick(ad._id, ad.title)}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All Ads Tab */}
      {activeTab === "all-ads" && (
        <div className="admin-tab-content">
          {adsError && <div className="error-banner">{adsError}</div>}

          <div
            className="filter-controls"
            style={{
              marginBottom: "20px",
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <select
              value={adStatus}
              onChange={(e) => setAdStatus(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            >
              <option value="all">All Status</option>
              <option value="review">Review</option>
              <option value="published">Published</option>
              <option value="removed">Removed</option>
            </select>
            <input
              type="text"
              placeholder="Search ads..."
              value={adSearch}
              onChange={(e) => setAdSearch(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                flex: 1,
                minWidth: "200px",
              }}
            />
          </div>

          {adsLoading ? (
            <div className="loading">Loading ads...</div>
          ) : allAds.length === 0 ? (
            <div className="empty-state">
              <p>No ads found</p>
            </div>
          ) : (
            <div className="review-queue">
              {allAds.map((ad) => (
                <div key={ad._id} className="review-card">
                  {/* Ad Thumbnail */}
                  <div className="review-card-image">
                    {ad.images && ad.images.length > 0 ? (
                      <img
                        src={ad.images[0].thumbUrl || ad.images[0].url}
                        alt={ad.title}
                      />
                    ) : (
                      <div className="image-placeholder">No Image</div>
                    )}
                  </div>

                  {/* Ad Details */}
                  <div className="review-card-content">
                    <div className="review-card-header">
                      <h3>{ad.title}</h3>
                      <span className="badge-price">LKR {ad.price}/mo</span>
                    </div>

                    <p className="review-renter">
                      <strong>Renter:</strong> {ad.owner?.name || "Unknown"} (
                      {ad.owner?.email})
                    </p>

                    <p className="review-address">
                      📍 {ad.address || "No address provided"}
                    </p>

                    <p className="review-excerpt">
                      {ad.description?.substring(0, 150)}...
                    </p>

                    <div className="review-meta">
                      <span className="meta-item">
                        👥 {ad.membersCount} members
                      </span>
                      {ad.billsIncluded && (
                        <span className="meta-item pill-success">
                          💡 Bills Included
                        </span>
                      )}
                      <span
                        className="meta-item"
                        style={{
                          backgroundColor:
                            ad.status === "published"
                              ? "#4CAF50"
                              : ad.status === "review"
                                ? "#FF9800"
                                : "#F44336",
                          color: "white",
                          padding: "4px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        {ad.status === "review" && "⏳ Review"}
                        {ad.status === "published" && "✓ Published"}
                        {ad.status === "removed" && "🗑 Removed"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="review-card-actions">
                    <button
                      className="action-btn btn-primary"
                      onClick={() => handleEditClick(ad)}
                    >
                      ✎ Edit
                    </button>
                    <button
                      className="action-btn btn-danger"
                      onClick={() => handleDeleteClick(ad._id, ad.title)}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="admin-tab-content">
          {usersError && <div className="error-banner">{usersError}</div>}

          {usersLoading ? (
            <div className="loading">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <p>No users found</p>
            </div>
          ) : (
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className={isBanned(user) ? "banned-user" : ""}
                    >
                      <td className="user-name">{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge role-${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="status">
                        {isBanned(user) ? (
                          <span className="status-badge status-banned">
                            🚫 Banned
                          </span>
                        ) : (
                          <span className="status-badge status-active">
                            ✓ Active
                          </span>
                        )}
                      </td>
                      <td className="joined-date">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="user-actions">
                        <button
                          className="action-btn btn-danger"
                          disabled={isBanned(user)}
                          onClick={() => handleBanClick(user._id, user.name)}
                        >
                          🚫 Ban
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Ad Modal */}
      {editModal.show && (
        <div
          className="modal-overlay"
          onClick={() =>
            !editing && setEditModal({ show: false, ad: null, formData: {} })
          }
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "500px", maxHeight: "80vh", overflowY: "auto" }}
          >
            <h2>✎ Edit Ad</h2>
            <div className="form-group">
              <label htmlFor="edit-title">Title</label>
              <input
                id="edit-title"
                type="text"
                className="form-control"
                value={editModal.formData.title}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    formData: { ...editModal.formData, title: e.target.value },
                  })
                }
                disabled={editing}
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-price">Price (LKR)</label>
              <input
                id="edit-price"
                type="number"
                className="form-control"
                value={editModal.formData.price}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    formData: {
                      ...editModal.formData,
                      price: parseFloat(e.target.value),
                    },
                  })
                }
                disabled={editing}
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-address">Address</label>
              <input
                id="edit-address"
                type="text"
                className="form-control"
                value={editModal.formData.address}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    formData: {
                      ...editModal.formData,
                      address: e.target.value,
                    },
                  })
                }
                disabled={editing}
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-description">Description</label>
              <textarea
                id="edit-description"
                className="form-control"
                value={editModal.formData.description}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    formData: {
                      ...editModal.formData,
                      description: e.target.value,
                    },
                  })
                }
                disabled={editing}
                rows="3"
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-members">Members Count</label>
              <input
                id="edit-members"
                type="number"
                className="form-control"
                value={editModal.formData.membersCount}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    formData: {
                      ...editModal.formData,
                      membersCount: parseInt(e.target.value),
                    },
                  })
                }
                disabled={editing}
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={editModal.formData.billsIncluded}
                  onChange={(e) =>
                    setEditModal({
                      ...editModal,
                      formData: {
                        ...editModal.formData,
                        billsIncluded: e.target.checked,
                      },
                    })
                  }
                  disabled={editing}
                />
                Bills Included
              </label>
            </div>
            <div className="form-group">
              <label htmlFor="edit-status">Status</label>
              <select
                id="edit-status"
                className="form-control"
                value={editModal.formData.status}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    formData: { ...editModal.formData, status: e.target.value },
                  })
                }
                disabled={editing}
              >
                <option value="review">Review</option>
                <option value="published">Published</option>
                <option value="removed">Removed</option>
              </select>
            </div>
            <div className="modal-actions">
              <button
                className="modal-btn modal-cancel"
                onClick={() =>
                  setEditModal({ show: false, ad: null, formData: {} })
                }
                disabled={editing}
              >
                Cancel
              </button>
              <button
                className="modal-btn modal-confirm"
                onClick={handleConfirmEdit}
                disabled={editing}
              >
                {editing ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {publishModal.show && (
        <div
          className="modal-overlay"
          onClick={() =>
            !publishing &&
            setPublishModal({ show: false, adId: null, adTitle: "" })
          }
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>🚀 Publish Ad?</h2>
            <p>Are you sure you want to publish this ad?</p>
            <p className="modal-ad-title">"{publishModal.adTitle}"</p>
            <div className="modal-actions">
              <button
                className="modal-btn modal-cancel"
                onClick={() =>
                  setPublishModal({ show: false, adId: null, adTitle: "" })
                }
                disabled={publishing}
              >
                Cancel
              </button>
              <button
                className="modal-btn modal-confirm"
                onClick={handleConfirmPublish}
                disabled={publishing}
              >
                {publishing ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div
          className="modal-overlay"
          onClick={() =>
            !deleting &&
            setDeleteModal({ show: false, adId: null, adTitle: "" })
          }
        >
          <div
            className="modal-content modal-danger"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>⚠ Delete Ad?</h2>
            <p>
              This action cannot be undone. The ad will be permanently removed.
            </p>
            <p className="modal-ad-title">"{deleteModal.adTitle}"</p>
            <div className="modal-actions">
              <button
                className="modal-btn modal-cancel"
                onClick={() =>
                  setDeleteModal({ show: false, adId: null, adTitle: "" })
                }
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="modal-btn modal-danger-btn"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban User Confirmation Modal */}
      {banModal.show && (
        <div
          className="modal-overlay"
          onClick={() =>
            !banning && setBanModal({ show: false, userId: null, userName: "" })
          }
        >
          <div
            className="modal-content modal-danger"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>🚫 Ban User?</h2>
            <p>Ban this user from the platform?</p>
            <p className="modal-ad-title">{banModal.userName}</p>
            <div className="form-group">
              <label htmlFor="ban-reason">Reason (optional)</label>
              <textarea
                id="ban-reason"
                className="form-control"
                placeholder="Spam, inappropriate content, etc."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows="3"
                disabled={banning}
              />
            </div>
            <div className="modal-actions">
              <button
                className="modal-btn modal-cancel"
                onClick={() =>
                  setBanModal({ show: false, userId: null, userName: "" })
                }
                disabled={banning}
              >
                Cancel
              </button>
              <button
                className="modal-btn modal-danger-btn"
                onClick={handleConfirmBan}
                disabled={banning}
              >
                {banning ? "Banning..." : "Ban User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
