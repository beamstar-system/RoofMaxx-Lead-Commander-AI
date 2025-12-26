
export interface Lead {
  id: string;
  businessName: string;
  address: string;
  phone: string;
  website: string;
  businessType: string;
  roofType: string;
  estimatedRoofArea: string;
  roofCondition: string;
  mapsUri: string;
  rating: number;
  reviewSnippet: string;
  confidenceScore: number;
}

export enum ScanStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface ScanProgress {
  count: number;
  total: number;
  currentNeighborhood: string;
}
