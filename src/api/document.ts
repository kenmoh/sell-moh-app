import { DataMessageResponse } from "@/types/auth";
import {
  Document,
  DocumentCreateRequest,
  DocumentListFilters,
  DocumentListResponse,
  DocumentResponse,
} from "@/types/document-types";
import { shareCsv } from "@/lib/export";
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

export const getDocuments = async (filters: DocumentListFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.doc_type) params.append("doc_type", filters.doc_type);
  if (filters.status) params.append("status", filters.status);
  if (filters.customer_id) params.append("customer_id", filters.customer_id);
  if (filters.page) params.append("page", String(filters.page));
  if (filters.page_size) params.append("page_size", String(filters.page_size));
  const qs = params.toString();

  const res = await apiClient.get<DocumentListResponse>(
    `${DOCUMENT_URL}${qs ? `?${qs}` : ""}`,
  );
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
  return res.data!;
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

export const downloadDocumentCsv = async (doc: Document): Promise<void> => {
  const tax = Number(doc.tax ?? 0);
  const rows: (string | number)[][] = [
    ["Document", doc.doc_number],
    ["Type", doc.doc_type],
    ["Status", doc.status],
    ["Customer", doc.customer_name],
    ["Created", new Date(doc.created_at).toLocaleDateString()],
    [
      "Due",
      doc.due_date ? new Date(doc.due_date).toLocaleDateString() : "",
    ],
    [],
    ["Description", "Qty", "Unit price", "Discount %", "Tax %", "Line total"],
    ...doc.items.map((item) => [
      item.description,
      item.qty,
      item.unit_price,
      item.discount_pct,
      item.tax_rate ?? "",
      item.line_total,
    ]),
    [],
    ["Subtotal", doc.subtotal ?? ""],
    ["Discount", doc.discount ?? 0],
    ["Tax", tax],
    ["Total", doc.total],
  ];

  await shareCsv(`${doc.doc_number}.csv`, rows);
};
