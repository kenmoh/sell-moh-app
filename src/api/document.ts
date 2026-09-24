import { DataMessageResponse } from "@/types/auth";
import {
  DocumentCreateRequest,
  DocumentResponse,
} from "@/types/document-types";
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

export interface DocumentPdfPayload {
  filename: string;
  mime_type: string;
  pdf_base64: string;
}

export const downloadDocumentPdf = async (
  docId: string,
  docType: string,
  docNumber: string,
): Promise<void> => {
  const res = await apiClient.get<{ data: DocumentPdfPayload }>(
    `${DOCUMENT_URL}/${docId}/pdf`,
  );
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  const payload = res.data?.data;
  const base64 = payload?.pdf_base64 ?? "";
  if (!base64.startsWith("JVBERi")) {
    throw new Error("Downloaded file is not a valid PDF");
  }

  const fileUri = `${FileSystem.cacheDirectory}${payload?.filename || `${docType}_${docNumber}.pdf`}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  await Sharing.shareAsync(fileUri, {
    mimeType: "application/pdf",
    dialogTitle: `${docType} ${docNumber}`,
  });
};
