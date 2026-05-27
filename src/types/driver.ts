export interface Driver {
  id: string
  phone: string
  name: string | null
  tin: string | null
  car_code: 1 | 3 | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface Document {
  id: string
  driver_id: string
  document_type: string
  file_url: string
  uploaded_at: string
}

export type CarCode = 1 | 3