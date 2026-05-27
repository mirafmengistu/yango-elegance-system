import { supabase } from '../lib/supabase'

export interface DocumentUpload {
  driver_id: string
  document_type: string
  file: File
}

export const documentService = {
  // Upload a document for a driver
  async uploadDocument(driverId: string, documentType: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${driverId}/${documentType}_${Date.now()}.${fileExt}`
    const filePath = fileName

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('driver-documents')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Get public URL (even though bucket is private, we'll use signed URLs)
    const { data: { publicUrl } } = supabase.storage
      .from('driver-documents')
      .getPublicUrl(filePath)

    // Save document record in database
    const { error: dbError } = await supabase
      .from('documents')
      .insert({
        driver_id: driverId,
        document_type: documentType,
        file_url: filePath
      })

    if (dbError) throw dbError

    return publicUrl
  },

  // Get all documents for a driver
  async getDriverDocuments(driverId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('driver_id', driverId)
      .order('uploaded_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get signed URL for viewing (for private files)
  async getSignedUrl(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('driver-documents')
      .createSignedUrl(filePath, 3600) // 1 hour expiry

    if (error) throw error
    return data.signedUrl
  },

  // Delete a document
  async deleteDocument(documentId: string, filePath: string): Promise<void> {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('driver-documents')
      .remove([filePath])

    if (storageError) throw storageError

    // Delete from database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (dbError) throw dbError
  }
}