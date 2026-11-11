import ExcelJS from "exceljs";

export interface ExcelSheet {
  name: string;
  rows: Record<string, unknown>[];
}

const MIN_COLUMN_WIDTH = 10;
const MAX_COLUMN_WIDTH = 60;

/** Longitud aproximada de un valor al mostrarse en una celda. */
function displayLength(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (value instanceof Date) return 19;
  return String(value).length;
}

/**
 * Genera un archivo .xlsx con una hoja por cada elemento de `sheets`.
 * Las columnas se toman de las llaves de los objetos (en orden de aparición),
 * con encabezado en negritas y ancho ajustado al contenido.
 */
export async function generateWorkbook(sheets: ExcelSheet[]): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();

  for (const sheet of sheets) {
    const safeName = sheet.name.slice(0, 31).replace(/[\\/?*[\]:]/g, "");
    const ws = wb.addWorksheet(safeName || "Hoja1");

    const headers: string[] = [];
    for (const row of sheet.rows) {
      for (const key of Object.keys(row)) {
        if (!headers.includes(key)) headers.push(key);
      }
    }

    ws.columns = headers.map((header) => {
      const longest = sheet.rows.reduce(
        (max, row) => Math.max(max, displayLength(row[header])),
        header.length,
      );
      return {
        header,
        key:   header,
        width: Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, longest + 2)),
      };
    });

    for (const row of sheet.rows) ws.addRow(row);

    if (headers.length > 0) ws.getRow(1).font = { bold: true };
  }

  const buffer = await wb.xlsx.writeBuffer();
  const ab = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(ab).set(new Uint8Array(buffer as ArrayBuffer));
  return ab;
}

export const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function todayStamp(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}
