const mongoose = require("mongoose");

const adSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    billsIncluded: {
      type: Boolean,
      default: false,
    },
    membersCount: {
      type: Number,
      default: 1,
    },
    phoneNumber: Number,
    description: String,
    images: [
      {
        url: String,
        thumbUrl: String,
        publicId: String,
      },
    ],
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: [Number], // [longitude, latitude]
    },
    address: String,
    status: {
      type: String,
      enum: ["review", "published", "removed"],
      default: "review",
    },
    publishedAt: Date,
  },
  { timestamps: true },
);

adSchema.index({ "location.coordinates": "2dsphere" });

module.exports = mongoose.model("Ad", adSchema);
