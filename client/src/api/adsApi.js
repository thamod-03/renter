import axiosInstance from "./axiosInstance";

const adsApi = {
  createAd: (adData) => axiosInstance.post("/ads", adData),
  getAds: (page = 1, limit = 10) =>
    axiosInstance.get("/ads", { params: { page, limit } }),
  getAdById: (id) => axiosInstance.get(`/ads/${id}`),
  updateAd: (id, adData) => axiosInstance.put(`/ads/${id}`, adData),
  deleteAd: (id) => axiosInstance.delete(`/ads/${id}`),
  searchAds: (query, filters) =>
    axiosInstance.get("/ads/search", { params: { q: query, ...filters } }),
  reportAd: (id, reason = "") =>
    axiosInstance.post(`/ads/${id}/report`, { reason }),
};

export default adsApi;
