export interface Paged<T> { data: T[]; meta: { total: number; page: number; pageSize: number; pages: number } }

export interface CustomerRow {
  id: string; customerNumber: string; fullName: string; preferredName: string | null; mobile: string | null; email: string | null;
  city: string | null; postalCode: string | null; status: string; lastVisitAt: string | null; tags: string[];
  members: { id: string; fullName: string; relationship: string }[];
  matchedMembers: { id: string; fullName: string; relationship: string }[];
}

export interface Member { id: string; fullName: string; relationship: string; dateOfBirth: string | null; notes: string | null }

export interface CustomerDetail {
  id: string; customerNumber: string; fullName: string; preferredName: string | null; mobile: string | null; alternateMobile: string | null;
  email: string | null; addressLine1: string | null; addressLine2: string | null; landmark: string | null; city: string | null; state: string | null;
  postalCode: string | null; country: string | null; notes: string | null; acquisitionSource: string | null; marketingConsent: boolean;
  status: string; version: number; tags: string[]; members: Member[]; createdAt: string;
  consents: { channel: string; purpose: string; granted: boolean }[];
  dateOfBirth: string | null; anniversary: string | null;
}

export interface TemplateField { id: string; key: string; label: string; helpText: string | null; required: boolean; minWarnMm: string | null; maxWarnMm: string | null }
export interface Template { id: string; name: string; category: string; isSystem: boolean; sections: { id: string; name: string; fields: TemplateField[] }[] }

export interface RevisionValue { display: string; unit: string; canonicalMm: string; entered: string }
export interface RevisionDetail {
  id: string; revisionNo: number; effectiveDate: string; isDraft: boolean; changeReason: string | null; enteredUnit: string;
  postureNotes: string | null; fitNotes: string | null; warnings: { label: string; message: string }[] | null; warningOverrideReason: string | null;
  createdAt: string; values: Record<string, RevisionValue>; styles: Record<string, string>; changedFields: Record<string, unknown>;
}
export interface ProfileDetail {
  id: string; name: string; unit: 'cm' | 'in'; currentRevisionNo: number;
  member: { id: string; fullName: string; relationship: string; customerId: string };
  template: Template | null; latest: RevisionDetail | null;
  revisions: { id: string; revisionNo: number; effectiveDate: string; changeReason: string | null; isDraft: boolean; createdAt: string; enteredUnit: string; restoredFromRevisionNo: number | null; warningOverrideReason: string | null }[];
}
export interface ProfileSummary { id: string; name: string; templateId: string; currentRevisionNo: number }

export interface TimelineEvent { at: string; type: string; title: string; ref?: string; amount?: string }

export interface OrderRow {
  id: string; orderNumber: string; status: string; kind: string; priority: string; total: string; deliveryDate: string | null;
  createdAt: string; itemCount: number; customer: { id: string; fullName: string; customerNumber: string };
}
export interface OrderList extends Paged<OrderRow> { statusCounts: Record<string, number> }
export interface OrderDetail {
  id: string; orderNumber: string; status: string; kind: string; priority: string; version: number; notes: string | null;
  orderDate: string; trialDate: string | null; deliveryDate: string | null;
  subtotal: string; discount: string; tax: string; total: string; paidAmount: string; paymentStatus: string; deliveryStatus: string;
  customer: { id: string; fullName: string; customerNumber: string; mobile: string | null };
  allowedTransitions: string[];
  items: { id: string; garmentType: string; quantity: number; unitPrice: string; discount: string; taxPercent: string; taxAmount: string; lineTotal: string; stage: string; fabricSource: string | null; fabricDetails: string | null }[];
  history: { id: string; fromStatus: string | null; toStatus: string; note: string | null; at: string; by: string | null }[];
}
