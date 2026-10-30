import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export type ExportCell = string | number;
export type ExportRows = ExportCell[][];

export interface PdfSection {
  heading: string;
  columns: ExportCell[];
  rows: ExportRows;
}

const escapeCsvCell = (cell: ExportCell) => {
  const value = String(cell ?? "");
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
};

const toCsv = (rows: ExportRows) =>
  rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");

const escapeHtml = (value: ExportCell) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const tableHtml = (section: PdfSection) => `
  <h2>${escapeHtml(section.heading)}</h2>
  <table>
    <thead>
      <tr>${section.columns.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${section.rows
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
        )
        .join("")}
    </tbody>
  </table>
`;

const buildPdfHtml = (
  title: string,
  subtitleLines: string[],
  sections: PdfSection[],
) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 28px;
      color: #111827;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 11px;
    }
    h1 { margin: 0 0 6px; font-size: 20px; }
    h2 { margin: 22px 0 8px; font-size: 13px; color: #374151; }
    p { margin: 2px 0; color: #4b5563; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    th, td { padding: 6px 7px; border-bottom: 1px solid #e5e7eb; text-align: left; }
    th { background: #f3f4f6; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; }
    td:not(:first-child), th:not(:first-child) { text-align: right; }
    tr { page-break-inside: avoid; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${subtitleLines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
  ${sections.map(tableHtml).join("")}
</body>
</html>`;

export const shareCsv = async (filename: string, rows: ExportRows) => {
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, `\uFEFF${toCsv(rows)}`, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  await Sharing.shareAsync(uri, {
    mimeType: "text/csv",
    dialogTitle: filename,
    UTI: "public.comma-separated-values-text",
  });
};

export const sharePdf = async (
  filename: string,
  title: string,
  subtitleLines: string[],
  sections: PdfSection[],
) => {
  const { uri } = await Print.printToFileAsync({
    html: buildPdfHtml(title, subtitleLines, sections),
  });
  const target = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.deleteAsync(target, { idempotent: true });
  await FileSystem.copyAsync({ from: uri, to: target });
  await Sharing.shareAsync(target, {
    mimeType: "application/pdf",
    dialogTitle: filename,
    UTI: "com.adobe.pdf",
  });
};
