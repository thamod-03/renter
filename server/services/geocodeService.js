const nominatim = require("nominatim-geocoder");

const geocoder = new nominatim();

const geocodeAddress = async (address) => {
  try {
    const results = await geocoder.search({ q: address, limit: 1 });

    if (results.length === 0) {
      throw new Error("Address not found");
    }

    const { lat, lon } = results[0];
    return {
      coordinates: [parseFloat(lon), parseFloat(lat)],
      address,
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
    };
  } catch (error) {
    console.error("Geocode error:", error);
    throw new Error(`Geocoding failed: ${error.message}`);
  }
};

const reverseGeocode = async (lat, lon) => {
  try {
    const results = await geocoder.reverse({ lat, lon, limit: 1 });

    if (results.length === 0) {
      throw new Error("Location not found");
    }

    return results[0];
  } catch (error) {
    console.error("Reverse geocode error:", error);
    throw new Error(`Reverse geocoding failed: ${error.message}`);
  }
};

module.exports = {
  geocodeAddress,
  reverseGeocode,
};
