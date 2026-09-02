import api from "./api";

export const statusService = {
  getPublicStatus: () => api.get("/status"),
};
