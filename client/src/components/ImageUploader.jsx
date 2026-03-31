import React, { useState, useEffect } from "react";

const ImageUploader = ({
  onImagesUploaded,
  maxFiles = 8,
  initialImages = [],
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [uploadedImages, setUploadedImages] = useState([]);
  const [error, setError] = useState(null);

  // Initialize with existing images
  useEffect(() => {
    if (initialImages && initialImages.length > 0) {
      setUploadedImages(initialImages);
      onImagesUploaded(initialImages);
    }
  }, []);

  // Cloudinary configuration - using unsigned upload preset (Vite env vars)
  const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET =
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "renter_unsigned";

  const uploadToCloudinary = async (file) => {
    const fileName = `${Date.now()}_${file.name}`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("public_id", fileName.replace(/\.[^/.]+$/, ""));

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();

      return {
        url: data.secure_url,
        publicId: data.public_id,
        thumbUrl: data.secure_url.replace(
          "/upload/",
          "/upload/w_200,h_200,c_fill/",
        ),
      };
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      throw err;
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);

    if (uploadedImages.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} images allowed`);
      return;
    }

    setError(null);
    setUploading(true);

    const uploadPromises = files.map(async (file) => {
      try {
        setProgress((prev) => ({
          ...prev,
          [file.name]: 0,
        }));

        const uploadedImage = await uploadToCloudinary(file);

        setProgress((prev) => ({
          ...prev,
          [file.name]: 100,
        }));

        return uploadedImage;
      } catch (err) {
        setError(`Failed to upload ${file.name}`);
        setProgress((prev) => ({
          ...prev,
          [file.name]: -1,
        }));
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter((img) => img !== null);

    const newImages = [...uploadedImages, ...successfulUploads];
    setUploadedImages(newImages);
    onImagesUploaded(newImages);

    setUploading(false);
    setProgress({});

    // Reset file input
    e.target.value = "";
  };

  const removeImage = (index) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    onImagesUploaded(newImages);
  };

  return (
    <div className="image-uploader">
      <label htmlFor="image-input" className="upload-label">
        Upload Images ({uploadedImages.length}/{maxFiles})
      </label>
      {error && <p className="upload-error">{error}</p>}
      <input
        id="image-input"
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading || uploadedImages.length >= maxFiles}
        className="image-input"
      />
      <div className="image-previews">
        {uploadedImages.map((image, index) => (
          <div key={index} className="preview-item">
            <img src={image.thumbUrl} alt={`Preview ${index}`} />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="remove-btn"
              disabled={uploading}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {uploading && <p className="upload-status">Uploading images...</p>}
    </div>
  );
};

export default ImageUploader;
