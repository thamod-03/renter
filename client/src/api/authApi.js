import axiosInstance from "./axiosInstance";

const authApi = {
  register: (userData) => axiosInstance.post("/auth/register", userData),
  login: (email, password) =>
    axiosInstance.post("/auth/login", { email, password }),
  getProfile: () => axiosInstance.get("/auth/me"),
};

export default authApi;
