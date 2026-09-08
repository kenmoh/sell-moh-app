import { apiClient } from "./client";
import type { BusinessSettings, BusinessUpdate } from "@/types/business";

const URL = "/business/settings";

const getErrorMessage = (res: any): string => {
  if (res.data && typeof res.data === "object" && res.data.message) {
    return res.data.message;
  }
  return res.problem || "An unknown error occurred";
};

export const fetchBusinessSettings = async (): Promise<BusinessSettings> => {
  const res = await apiClient.get<{ data: BusinessSettings }>(URL);
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
  return res.data?.data!;
};

export const updateBusinessSettings = async (
  data: BusinessUpdate,
): Promise<BusinessSettings> => {
  const res = await apiClient.patch<{ data: BusinessSettings }>(URL, data);
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
  return res.data?.data!;
};

export const uploadBusinessLogo = async (
  fileUri: string,
): Promise<BusinessSettings> => {
  const formData = new FormData();
  const filename = fileUri.split("/").pop() || "logo.jpg";
  const ext = filename.split(".").pop()?.toLowerCase() || "jpeg";
  const mimeType = ext === "png" ? "image/png" : "image/jpeg";
  formData.append("file", {
    uri: fileUri,
    name: filename,
    type: mimeType,
  } as any);

  const res = await apiClient.post<{ data: BusinessSettings }>(
    "/business/logo",
    formData as any,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};
