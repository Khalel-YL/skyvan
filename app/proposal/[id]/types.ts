export type ProposalOfferContent = {
  leadName: string;
  caravanModel: string;
  price: number | string;
  status?: string;
  finalPrice?: number;
  selectedExtras?: string[];
  signedAt?: string;
};
