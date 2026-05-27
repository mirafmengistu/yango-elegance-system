import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { documentService } from '../services/documentService'
import { driverService } from '../services/driverService'
import { Upload, FileCheck, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

type DocumentType = {
  id: string
  name: string
  label: string
  required: boolean
}

const DOCUMENT_TYPES: DocumentType[] = [
  { id: 'license', name: 'license', label: 'Driver License', required: true },
  { id: 'registration', name: 'registration', label: 'Vehicle Registration', required: true },
  { id: 'tin', name: 'tin', label: 'TIN Certificate', required: true },
  { id: 'representation', name: 'representation', label: 'Representation Letter', required: true },
  { id: 'libre', name: 'libre', label: 'Libre Document', required: true }
]

export default function DriverUploadPage() {
  const { driverId } = useParams<{ driverId: string }>()
  const navigate = useNavigate()
  const [driver, setDriver] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [uploadedDocs, setUploadedDocs] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (driverId) {
      loadDriver()
      loadExistingDocuments()
    }
  }, [driverId])

  const loadDriver = async () => {
    try {
      const data = await driverService.getDriver(driverId!)
      setDriver(data)
    } catch (err) {
      setError('Driver not found')
    } finally {
      setLoading(false)
    }
  }

  const loadExistingDocuments = async () => {
    try {
      const docs = await documentService.getDriverDocuments(driverId!)
      const uploadedTypes = new Set(docs.map(doc => doc.document_type))
      setUploadedDocs(uploadedTypes)
    } catch (err) {
      console.error('Error loading documents:', err)
    }
  }

  const handleFileUpload = async (documentType: DocumentType, file: File) => {
    if (!driverId) return

    setUploading(documentType.id)
    setError(null)
    setSuccess(null)

    try {
      await documentService.uploadDocument(driverId, documentType.name, file)
      setUploadedDocs(prev => new Set(prev).add(documentType.name))
      setSuccess(`${documentType.label} uploaded successfully!`)
      
      // Refresh after 2 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Failed to upload ${documentType.label}: ${(err as Error).message}`)
      setTimeout(() => setError(null), 5000)
    } finally {
      setUploading(null)
    }
  }

  const allDocumentsUploaded = DOCUMENT_TYPES.every(doc => uploadedDocs.has(doc.name))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!driver) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Invalid Link</h2>
              <p className="text-gray-600">This upload link is invalid or has expired.</p>
              <Button onClick={() => navigate('/')} className="mt-4">Go Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Yango Elegance</CardTitle>
            <CardDescription>
              Driver Document Submission Portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Driver:</strong> {driver.name || 'Not provided'} | 
                <strong> Phone:</strong> {driver.phone}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Please upload all required documents below. Each file should be clear and readable.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            {success}
          </div>
        )}
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Document Upload Cards */}
        <div className="grid gap-4">
          {DOCUMENT_TYPES.map((docType) => {
            const isUploaded = uploadedDocs.has(docType.name)
            const isUploading = uploading === docType.id

            return (
              <Card key={docType.id} className={isUploaded ? 'border-green-300 bg-green-50/30' : ''}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{docType.label}</span>
                    {isUploaded && <FileCheck className="h-5 w-5 text-green-600" />}
                    {docType.required && !isUploaded && (
                      <span className="text-xs text-red-500 font-normal">Required</span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Upload {docType.label.toLowerCase()} (PDF, JPG, or PNG)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!isUploaded ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(docType, file)
                        }}
                        className="hidden"
                        id={`upload-${docType.id}`}
                        disabled={isUploading}
                      />
                      <label
                        htmlFor={`upload-${docType.id}`}
                        className="cursor-pointer block"
                      >
                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          {isUploading ? 'Uploading...' : 'Click to upload file'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PDF, JPG, PNG up to 10MB
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="text-center text-green-600">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Document uploaded successfully!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Completion Message */}
        {allDocumentsUploaded && (
          <Card className="mt-6 border-green-500 bg-green-50">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                All Documents Submitted!
              </h3>
              <p className="text-green-700">
                Thank you. Your documents have been received and will be reviewed by our team.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-8">
          <p>Yango Elegance - Driver Document Management System</p>
          <p className="mt-1">For support, contact your Yango representative</p>
        </div>
      </div>
    </div>
  )
}