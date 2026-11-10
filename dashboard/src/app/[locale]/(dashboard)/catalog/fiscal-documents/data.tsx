export interface FiscalDocument {
  document_id?: string;
  name: string;
  prefix: string;
}

export const mockFiscalDocuments: FiscalDocument[] = [
  {
    document_id: "1",
    name: "Gold Familiar",
    prefix: "720"
  },
  {
    document_id: "2",
    name: "Factura Electrónica",
    prefix: "001"
  },
  {
    document_id: "3",
    name: "Boleta de Venta",
    prefix: "002"
  },
  {
    document_id: "4",
    name: "Nota de Crédito",
    prefix: "003"
  },
  {
    document_id: "5",
    name: "Nota de Débito",
    prefix: "004"
  }
];