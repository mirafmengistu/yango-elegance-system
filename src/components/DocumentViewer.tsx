import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { documentService } from '../services/documentService'
import { Eye, Download, Trash2, FileText } from 'lucide-react'

interface DocumentViewerProps {
  driverId: string
  driverName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDocumentUpdate: () => void
}

export default function DocumentViewer({ driverId, driverName, open, onOpenChange, onDocumentUpdate }: DocumentViewerProps) {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingUrl, setViewingUrl] = useState<string | null>(null)

  useEffect(() => {
    if (open && driverId) {
      loadDocuments()
    }
  }, [open, driverId])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const docs = await documentService.getDriverDocuments(driverId)
      setDocuments(docs)
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (filePath: string) => {
    try {
      const url = await documentService.getSignedUrl(filePath)
      window.open(url, '_blank')
    } catch (error) {
      alert('Failed to open document: ' + (error as Error).message)
    }
  }

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const url = await documentService.getSignedUrl(filePath)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      alert('Failed to download: ' + (error as Error).message)
    }
  }

  const handleDelete = async (documentId: string, filePath: string) => {
    const confirmed = confirm('Delete this document? This cannot be undone.')
    if (!confirmed) return

    try {
      await documentService.deleteDocument(documentId, filePath)
      await loadDocuments()
      onDocumentUpdate()
      alert('Document deleted successfully')
    } catch (error) {
      alert('Failed to delete: ' + (error as Error).message)
    }
  }

  const getDocumentLabel = (type: string) => {
    const labels: Record<string, string> = {
      license: 'Driver License',
      registration: 'Vehicle Registration',
      tin: 'TIN Certificate',
      representation: 'Representation Letter',
      libre: 'Libre Document'
    }
    return labels[type] || type
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Documents - {driverName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No documents uploaded yet</p>
            <p className="text-sm mt-2">Share the upload link with the driver</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Type</TableHead>
                <TableHead>Uploaded At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">
                    {getDocumentLabel(doc.document_type)}
                  </TableCell>
                  <TableCell>
                    {new Date(doc.uploaded_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleView(doc.file_url)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(doc.file_url, `${doc.document_type}.pdf`)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(doc.id, doc.file_url)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="mt-4 pt-4 border-t">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Upload Link for Driver:</strong><br />
              {`${window.location.origin}/upload/${driverId}`}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => {
                const link = `${window.location.origin}/upload/${driverId}`
                navigator.clipboard.writeText(link)
                alert('Link copied to clipboard!')
              }}
            >
              Copy Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}