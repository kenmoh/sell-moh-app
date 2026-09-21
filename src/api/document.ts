import { DataMessageResponse } from "@/types/auth";
import {
  DocumentCreateRequest,
  DocumentResponse,
} from "@/types/document-types";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { getErrorMessage } from "./auth";
import { apiClient } from "./client";

const DOCUMENT_URL = "/documents";

// _________________________DOCUMENT OPERATIONS__________________________

export const createDocument = async (data: DocumentCreateRequest) => {
  const res = await apiClient.post<DataMessageResponse>(
    `${DOCUMENT_URL}/`,
    data,
  );
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data;
};

export const getDocuments = async () => {
  const res = await apiClient.get<DocumentResponse>(`${DOCUMENT_URL}`);
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
  return res.data;
};

export const getDocumentById = async (id: string) => {
  const res = await apiClient.get<DocumentResponse>(`${DOCUMENT_URL}/${id}`);
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
  return res.data;
};

export const updateDocumentStatus = async (id: string, status: string) => {
  const res = await apiClient.patch(`${DOCUMENT_URL}/${id}/status`, { status });
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
  return res.data;
};

export const convertDocumentToSale = async (id: string) => {
  const res = await apiClient.post(`${DOCUMENT_URL}/${id}/convert-to-sale`);
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
  return res.data;
};

export const downloadDocumentPdf = async (
  docId: string,
  docType: string,
  docNumber: string,
): Promise<void> => {
  const session = JSON.parse(SecureStore.getItem("session") ?? "{}");
  const { BASE_URL } = await import("./client");
  const url = `${BASE_URL}/documents/${docId}/download`;
  const fileUri = `${FileSystem.cacheDirectory}${docType}_${docNumber}.pdf`;

  const result = await FileSystem.downloadAsync(url, fileUri, {
    headers: session?.accessToken
      ? { Authorization: `Bearer ${session.accessToken}` }
      : {},
  });

  if (result.status !== 200) {
    throw new Error("Failed to download document");
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: "application/pdf",
    dialogTitle: `${docType} ${docNumber}`,
  });
};
