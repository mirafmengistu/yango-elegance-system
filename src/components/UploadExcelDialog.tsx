import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import { Upload, FileSpreadsheet, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import { driverService } from '../services/driverService'

interface UploadExcelDialogProps {
  onUploadComplete: () => void
}

export default function UploadExcelDialog({ onUploadComplete }: UploadExcelDialogProps) {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<any[]>([])
  const [errors, setErrors] = useState<string[]>([])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setErrors([])

    try {
      // Read Excel file
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      // Map Excel columns to our driver format
      // Adjust column names based on your Excel file structure
      const drivers = jsonData.map((row: any) => ({
        phone: row['Phone'] || row['phone'] || row['Phone Number'],
        name: row['Name'] || row['name'],
        tin: row['TIN'] || row['tin'],
        car_code: row['Car Code'] || row['car_code']
      })).filter(d => d.phone) // Only keep rows with phone numbers

      setPreview(drivers.slice(0, 10)) // Show first 10 as preview

      // Ask for confirmation before import
      const confirmed = window.confirm(`Found ${drivers.length} drivers. Import them?`)
      
      if (confirmed) {
        const result = await driverService.importDrivers(drivers)
        
        if (result.errors.length > 0) {
          setErrors(result.errors)
        } else {
          alert(`Successfully imported ${result.success} drivers!`)
          setOpen(false)
          onUploadComplete()
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      setErrors(['Failed to process file: ' + (error as Error).message])
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Excel File
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Drivers from Excel</DialogTitle>
          <DialogDescription>
            Upload an Excel file (.xlsx, .xls) containing driver information.
            Required column: Phone Number. Optional: Name, TIN, Car Code.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="excel-upload"
              disabled={uploading}
            />
            <label htmlFor="excel-upload" className="cursor-pointer block">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600">
                {uploading ? 'Processing...' : 'Click or drag Excel file here'}
              </p>
              <p className="text-xs text-gray-500 mt-1">.xlsx or .xls files only</p>
            </label>
          </div>

          {preview.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Preview (first 10 drivers):</h4>
              <div className="bg-gray-50 rounded p-3 max-h-60 overflow-auto">
                <table className="text-sm w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Phone</th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">TIN</th>
                      <th className="text-left p-2">Car Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((driver, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2">{driver.phone}</td>
                        <td className="p-2">{driver.name || '-'}</td>
                        <td className="p-2">{driver.tin || '-'}</td>
                        <td className="p-2">{driver.car_code || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <h4 className="text-red-800 font-semibold mb-2">Errors:</h4>
              <ul className="text-sm text-red-600 list-disc list-inside">
                {errors.slice(0, 5).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}