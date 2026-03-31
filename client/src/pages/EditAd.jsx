import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../contexts/AuthContext";
import ImageUploader from "../components/ImageUploader";
import MapPicker from "../components/MapPicker";
import adsApi from "../api/adsApi";

const EditAd = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Form and data states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [ad, setAd] = useState(null);
  const [initialImages, setInitialImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapLocation, setMapLocation] = useState(null);

  // Modal states
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      price: "",
      membersCount: 1,
      phoneNumber: "",
      billsIncluded: false,
      address: "",
    },
  });

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  // Fetch ad data on mount
  useEffect(() => {
    const fetchAd = async () => {
      try {
        setLoading(true);
        const response = await adsApi.getAdById(id);
        const adData = response.data.ad;
        setAd(adData);

        // Pre-fill form
        setValue("title", adData.title);
        setValue("description", adData.description);
        setValue("price", adData.price);
        setValue("membersCount", adData.membersCount || 1);
        setValue("billsIncluded", adData.billsIncluded || false);
        setValue("address", adData.address || "");
        setValue("phoneNumber", adData.phoneNumber || "");
        // Set initial images
        const formattedImages = (adData.images || []).map((img) => ({
          url: img.url,
          publicId: img.publicId,
          thumbUrl: img.thumbUrl || img.url,
        }));
        setInitialImages(formattedImages);
        setSelectedImages(formattedImages);

        // Set initial location
        if (adData.location && adData.location.lat && adData.location.lng) {
          const location = {
            address: adData.address || "",
            lat: adData.location.lat,
            lng: adData.location.lng,
          };
          setSelectedLocation(location);
          setMapLocation({
            lat: adData.location.lat,
            lng: adData.location.lng,
          });
        }
      } catch (err) {
        setError(err.message || "Failed to fetch ad");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAd();
    }
  }, [id, setValue]);

  const handleMapLocationSelect = (location) => {
    setMapLocation({
      lat: location.latitude,
      lng: location.longitude,
    });
    setSelectedLocation((prev) => ({
      ...prev,
      lat: location.latitude,
      lng: location.longitude,
    }));
  };

  const handleImagesUploaded = (images) => {
    setSelectedImages(images);
  };

  const onSubmit = async (formData) => {
    if (!selectedImages || selectedImages.length === 0) {
      setError("Please have at least one image");
      return;
    }

    if (!selectedLocation || !selectedLocation.lat || !selectedLocation.lng) {
      setError("Please select a location on the map");
      return;
    }

    if (!formData.address || !formData.address.trim()) {
      setError("Address is required");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const adPayload = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        membersCount: parseInt(formData.membersCount) || 1,
        billsIncluded: formData.billsIncluded === true,
        phoneNumber: formData.phoneNumber ? formData.phoneNumber.trim() : null,
        images: selectedImages,
        location: {
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
        },
        address: formData.address.trim(),
      };

      await adsApi.updateAd(id, adPayload);

      // Show confirmation
      setShowConfirmation(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate(`/ads/${id}`);
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to update ad");
      setSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      await adsApi.deleteAd(id);
      // Redirect to dashboard after deletion
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to delete ad");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading ad details...</div>;
  }

  if (error && !showConfirmation) {
    return (
      <div className="error-page">
        <div className="error-message">Error: {error}</div>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="confirmation-modal-overlay">
        <div className="confirmation-modal">
          <div className="confirmation-icon">✓</div>
          <h2>Changes Saved!</h2>
          <p>Your listing has been updated successfully.</p>
          <button
            className="confirmation-btn"
            onClick={() => navigate(`/ads/${id}`)}
          >
            View Listing
          </button>
        </div>
      </div>
    );
  }

  if (showDeleteModal) {
    return (
      <div className="confirmation-modal-overlay">
        <div className="confirmation-modal delete-modal">
          <div className="delete-icon">⚠</div>
          <h2>Delete Listing?</h2>
          <p>Are you sure you want to delete this listing?</p>
          <p className="delete-warning">This action cannot be undone.</p>
          <div className="modal-actions">
            <button
              className="cancel-btn"
              onClick={() => setShowDeleteModal(false)}
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

  const statusColor = {
    review: "pill-warning",
    published: "pill-success",
    removed: "pill-danger",
  };

  return (
    <div className="edit-ad-page">
      <div className="edit-ad-container">
        <div className="edit-ad-header">
          <h1>Edit Your Listing</h1>
          {ad?.status && (
            <span className={`status-pill ${statusColor[ad.status] || ""}`}>
              Status: {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
            </span>
          )}
        </div>

        {error && (
          <div className="error-alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="create-ad-form">
          {/* Basic Information Section */}
          <fieldset className="form-section">
            <legend>Basic Information</legend>

            <div className="form-group">
              <label htmlFor="title">
                Title <span className="required">*</span>
              </label>
              <input
                id="title"
                type="text"
                placeholder="e.g., Cozy 2-Bed Flat in City Center"
                {...register("title", {
                  required: "Title is required",
                  minLength: {
                    value: 10,
                    message: "Title must be at least 10 characters",
                  },
                  maxLength: {
                    value: 150,
                    message: "Title must be less than 150 characters",
                  },
                })}
              />
              {errors.title && (
                <span className="field-error">{errors.title.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="price">
                Monthly Rent (LKR) <span className="required">*</span>
              </label>
              <input
                id="price"
                type="number"
                placeholder="e.g., 1500"
                {...register("price", {
                  required: "Price is required",
                  min: { value: 1, message: "Price must be greater than 0" },
                  max: { value: 999999, message: "Price is too high" },
                })}
              />
              {errors.price && (
                <span className="field-error">{errors.price.message}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="membersCount">
                  Number of Members <span className="required">*</span>
                </label>
                <input
                  id="membersCount"
                  type="number"
                  placeholder="e.g., 2"
                  {...register("membersCount", {
                    required: "Number of rooms is required",
                    min: { value: 1, message: "Minimum 1 room required" },
                    max: { value: 20, message: "Maximum 20 rooms" },
                  })}
                />
                {errors.membersCount && (
                  <span className="field-error">
                    {errors.membersCount.message}
                  </span>
                )}
              </div>

              <div className="form-group checkbox-group">
                <label htmlFor="billsIncluded">
                  <input
                    id="billsIncluded"
                    type="checkbox"
                    {...register("billsIncluded")}
                  />
                  <span>Bills Included</span>
                </label>
                <p className="checkbox-help">
                  Include this if utilities are covered in rent
                </p>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">
                Phone Number <span className="required">*</span>
              </label>
              <input
                id="phoneNumber"
                type="text"
                placeholder="e.g., 077 123 4567"
                {...register("phoneNumber", {
                  required: "Phone number is required",
                  minLength: {
                    value: 10,
                    message: "Phone number must be at least 10 characters",
                  },
                })}
              />
              {errors.phoneNumber && (
                <span className="field-error">{errors.phoneNumber.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Description <span className="required">*</span>
              </label>
              <textarea
                id="description"
                placeholder="Describe your property, amenities, house rules, etc..."
                {...register("description", {
                  required: "Description is required",
                  minLength: {
                    value: 20,
                    message: "Description must be at least 20 characters",
                  },
                  maxLength: {
                    value: 3000,
                    message: "Description must be less than 3000 characters",
                  },
                })}
                rows="6"
              />
              {errors.description && (
                <span className="field-error">
                  {errors.description.message}
                </span>
              )}
            </div>
          </fieldset>

          {/* Location Section */}
          <fieldset className="form-section">
            <legend>Location</legend>

            <div className="form-group">
              <label htmlFor="address">
                Address <span className="required">*</span>
              </label>
              <input
                id="address"
                type="text"
                placeholder="e.g., 123 Main Street, London, UK"
                {...register("address", {
                  required: "Address is required",
                  minLength: {
                    value: 5,
                    message: "Address must be at least 5 characters",
                  },
                  maxLength: {
                    value: 255,
                    message: "Address must be less than 255 characters",
                  },
                })}
              />
              {errors.address && (
                <span className="field-error">{errors.address.message}</span>
              )}
            </div>

            <div className="form-group">
              <label>
                Pinpoint Location on Map <span className="required">*</span>
              </label>
              <p className="location-help">
                Click on the map to place a pin at your exact location
              </p>
              <MapPicker onLocationSelect={handleMapLocationSelect} />
              {mapLocation && (
                <p className="selected-value">
                  ✓ Map marker placed at ({mapLocation.lat.toFixed(4)},{" "}
                  {mapLocation.lng.toFixed(4)})
                </p>
              )}
            </div>
          </fieldset>

          {/* Images Section */}
          <fieldset className="form-section">
            <legend>Images</legend>
            <p className="section-help">
              Add or remove images for your listing
            </p>
            <ImageUploader
              onImagesUploaded={handleImagesUploaded}
              initialImages={selectedImages}
            />
            {selectedImages.length > 0 && (
              <p className="upload-confirmation">
                ✓ {selectedImages.length} image
                {selectedImages.length !== 1 ? "s" : ""} total
              </p>
            )}
          </fieldset>

          {/* Submit Buttons */}
          <div className="form-actions">
            <button type="submit" disabled={submitting} className="submit-btn">
              {submitting ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="cancel-btn"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteClick}
              className="delete-btn"
              disabled={submitting}
            >
              Delete Listing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAd;
