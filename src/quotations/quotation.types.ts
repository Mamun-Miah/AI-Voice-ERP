// Shared types for the Quotations module.
// Exported here so both service and controller can reference them
// without TypeScript's "cannot be named from external module" error.

export interface StoredQuotationItem {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface QuotationResponse {
  id: string;
  businessId: string;
  quotationNo: string;
  partyId: string | null;
  partyName: string | null;
  items: StoredQuotationItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  validityDate: Date;
  quotationDate: Date;
  status: string;
  notes: string | null;
  convertedToSaleId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
