import axiosInstance from "./axiosInstance";

const adminApi = {
  // Ads Management
  getReviewAds: () => axiosInstance.get("/admin/ads/review"),

  getAllAds: (status = "all", search = "") =>
    axiosInstance.get("/admin/ads/all", { params: { status, search } }),

  publishAd: (id) => axiosInstance.post(`/admin/ads/${id}/publish`),

  updateAd: (id, data) => axiosInstance.put(`/admin/ads/${id}`, data),

  deleteAd: (id) => axiosInstance.delete(`/admin/ads/${id}`),

  // Users Management
  getUsers: () => axiosInstance.get("/admin/users"),

  banUser: (id, reason = "") =>
    axiosInstance.post(`/admin/users/${id}/ban`, { reason }),

  unbanUser: (id) => axiosInstance.post(`/admin/users/${id}/unban`),
};

export default adminApi;
