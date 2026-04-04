export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "converted"
  | "lost";

export type LeadFormValues = {
  id: string;
  buildVersionId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  whatsappOptIn: boolean;
  status: LeadStatus;
};

export type LeadFormErrors = {
  buildVersionId: string;
  fullName: string;
  email: string;
};

export type LeadFormState = {
  ok: boolean;
  message: string;
  values: LeadFormValues;
  errors: LeadFormErrors;
};

export const initialLeadFormValues: LeadFormValues = {
  id: "",
  buildVersionId: "",
  fullName: "",
  email: "",
  phoneNumber: "",
  whatsappOptIn: false,
  status: "new",
};

export const initialLeadFormErrors: LeadFormErrors = {
  buildVersionId: "",
  fullName: "",
  email: "",
};

export const initialLeadFormState: LeadFormState = {
  ok: false,
  message: "",
  values: initialLeadFormValues,
  errors: initialLeadFormErrors,
};