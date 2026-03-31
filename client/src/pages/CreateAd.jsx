import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../contexts/AuthContext";
import ImageUploader from "../components/ImageUploader";
import MapPicker from "../components/MapPicker";
import adsApi from "../api/adsApi";

const CreateAd = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapLocation, setMapLocation] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      price: "",
      membersCount: 1,
      billsIncluded: false,
      phoneNumber: "",
      address: "",
    },
  });

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  // Check if user is banned
  if (user && user.banned) {
    return (
      <div className="page-container">
        <div
          className="error-banner"
          style={{
            margin: "20px",
            padding: "20px",
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c6cb",
            borderRadius: "4px",
            color: "#721c24",
          }}
        >
          <h2>🚫 Account Banned</h2>
          <p>Your account has been banned and you cannot post new ads.</p>
          <p>
            If you believe this is a mistake, please contact the administrator.
          </p>
        </div>
      </div>
    );
  }

  const handleMapLocationSelect = (location) => {
    // location has: { latitude, longitude }
    setMapLocation({
      lat: location.latitude,
      lng: location.longitude,
    });
    // Update selectedLocation with coordinates only (keep address from search)
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
    // Validation
    if (!selectedImages || selectedImages.length === 0) {
      setError("Please upload at least one image");
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
      setLoading(true);
      setError(null);

      const adPayload = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        membersCount: parseInt(formData.membersCount) || 1,
        phoneNumber: formData.phoneNumber ? formData.phoneNumber.trim() : null,
        billsIncluded: formData.billsIncluded === true,
        images: selectedImages,
        location: {
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
        },
        address: formData.address.trim(),
      };

      await adsApi.createAd(adPayload);

      // Show confirmation modal
      setShowConfirmation(true);

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to create ad");
      setLoading(false);
    }
  };

  if (showConfirmation) {
    return (
      <div className="confirmation-modal-overlay">
        <div className="confirmation-modal">
          <div className="confirmation-icon">✓</div>
          <h2>Ad Submitted for Review!</h2>
          <p>
            Your listing has been submitted successfully and is awaiting
            moderation.
          </p>
          <p className="confirmation-note">
            You'll be able to view it in your dashboard once it's approved.
          </p>
          <button
            className="confirmation-btn"
            onClick={() => navigate("/dashboard")}
          >
            View Dashboard
          </button>
        </div>
      </div>
    );
  }

  const billsIncludedValue = watch("billsIncluded");

  return (
    <div className="create-ad-page">
      <div className="create-ad-container">
        <h1>Post Your Rental Listing</h1>
        <p className="create-ad-subtitle">
          Fill in the details below to create your listing
        </p>

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
            <div className="form-group">
              <label htmlFor="address">
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
              First image will be used as thumbnail
            </p>
            <ImageUploader onImagesUploaded={handleImagesUploaded} />
            {selectedImages.length > 0 && (
              <p className="upload-confirmation">
                ✓ {selectedImages.length} image
                {selectedImages.length !== 1 ? "s" : ""} uploaded
              </p>
            )}
          </fieldset>

          {/* Submit Button */}
          <div className="form-actions">
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? "Submitting..." : "Submit Listing for Review"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="cancel-btn"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAd;
