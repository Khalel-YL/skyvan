export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";

export type LeadFormState = {
  ok: boolean;
  message: string;
  values?: {
    id?: string;
    buildVersionId?: string;
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    whatsappOptIn?: boolean;
    status?: LeadStatus;
  };
  errors?: {
    buildVersionId?: string;
    fullName?: string;
    email?: string;
  };
};

export const initialLeadFormState: LeadFormState = {
  ok: false,
  message: "",
};