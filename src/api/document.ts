import { DataMessageResponse } from "@/types/auth";
import {
  DocumentCreateRequest,
  DocumentResponse,
} from "@/types/document-types";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { fetch as expoFetch } from "expo/fetch";
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

  const response = await expoFetch(url, {
    headers: session?.accessToken
      ? { Authorization: `Bearer ${session.accessToken}` }
      : {},
    redirect: "error",
  });

  if (!response.ok) {
    throw new Error("Failed to download document");
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/pdf")) {
    throw new Error("Server did not return a PDF");
  }

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const CHUNK = 8192;
  for (let i = 0; i < bytes.byteLength; i += CHUNK) {
    const slice = bytes.subarray(i, i + CHUNK);
    binary += String.fromCharCode(...slice);
  }
  const base64 = btoa(binary);

  if (!base64.startsWith("JVBERi")) {
    throw new Error("Downloaded file is not a valid PDF");
  }

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  await Sharing.shareAsync(fileUri, {
    mimeType: "application/pdf",
    dialogTitle: `${docType} ${docNumber}`,
  });
};
