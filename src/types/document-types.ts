export type DocumentType = "quote" | "invoice" | "receipt" | "purchase_order";

export interface DocumentItemLine {
  product_id?: string;
  description: string;
  qty: number;
  unit_price: number;
  discount_pct?: number;
  tax_rate?: number;
}

export interface DocumentCreateRequest {
  // Required
  tenant_id: string;
  actor_id: string;
  doc_type: DocumentType;
  items: DocumentItemLine[];

  // Optional customer info
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;

  // Optional invoice-specific
  due_date?: string;
  notes?: string;
  terms?: string;

  // Optional linking
  linked_sale_id?: string;

  // Optional tracing
  correlation_id?: string;
}

// Response from the API
export interface DocumentResponse {
  id: string;
  tenant_id: string;
  doc_number: string;
  doc_type: DocumentType;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  item_count: number;
  due_date?: string;
  linked_sale_id?: string;
}

// // Example usage:
// const createInvoice: DocumentCreateRequest = {
//     tenant_id: '550e8400-e29b-41d4-a716-446655440000',
//     actor_id: '550e8400-e29b-41d4-a716-446655440001',
//     doc_type: 'invoice',
//     customer_name: 'John Doe',
//     customer_email: string,
//     customer_phone: '+2348012345678',
//     due_date: '2026-09-25T00:00:00Z',
//     terms: 'Payment due within 30 days',
//     items: [
//         {
//         product_id: '550e8400-e29b-41d4-a716-446655440002',
//         description: 'Samsung Galaxy A14 - Black, 128GB',
//         qty: 2,
//         unit_price: 85000,
//         discount_pct: 5,
//         tax_rate: 7.5,
//         },
//         {
//         description: 'Screen Protector',
//         qty: 2,
//         unit_price: 2500,
//         tax_rate: 7.5,
//         },
//     ],
// };
