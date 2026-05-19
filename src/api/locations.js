import { http } from "./client";

export const locationsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams({ limit: 50, ...params }).toString();
    return http.get(`/locations?${qs}`);
  },
  create: (data) => http.post("/locations", data),
  delete: (id) => http.delete(`/locations/${id}`),
};
