import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Check, X, Eye, Trash2, AlertCircle } from 'lucide-react'
import type { Driver } from '../types/driver'
import { driverService } from '../services/driverService'

interface DriverTableProps {
  drivers: Driver[]
  onDriverUpdate: () => void
  onViewDriver: (driver: Driver) => void
}

export default function DriverTable({ drivers, onDriverUpdate, onViewDriver }: DriverTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>
    }
  }

  const getCarCodeBadge = (code: number | null) => {
    if (!code) return <Badge variant="outline">Not set</Badge>
    if (code === 1 || code === 3) {
      return <Badge className="bg-blue-500">{code}</Badge>
    }
    return <Badge variant="destructive">Invalid ({code})</Badge>
  }

  const handleApprove = async (driver: Driver) => {
    if (driver.car_code !== 1 && driver.car_code !== 3) {
      alert('Only drivers with Car Code 1 or 3 can be approved. Please update car code first.')
      return
    }

    const confirmed = confirm(`Approve driver ${driver.name || driver.phone}?`)
    if (!confirmed) return

    setUpdatingId(driver.id)
    try {
      await driverService.updateDriver(driver.id, { status: 'approved' })
      onDriverUpdate()
    } catch (error) {
      alert('Failed to approve driver: ' + (error as Error).message)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleReject = async (driver: Driver) => {
    const confirmed = confirm(`Reject driver ${driver.name || driver.phone}?`)
    if (!confirmed) return

    setUpdatingId(driver.id)
    try {
      await driverService.updateDriver(driver.id, { status: 'rejected' })
      onDriverUpdate()
    } catch (error) {
      alert('Failed to reject driver: ' + (error as Error).message)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (driver: Driver) => {
    const confirmed = confirm(`Delete driver ${driver.name || driver.phone}? This cannot be undone.`)
    if (!confirmed) return

    setUpdatingId(driver.id)
    try {
      await driverService.deleteDriver(driver.id)
      onDriverUpdate()
    } catch (error) {
      alert('Failed to delete driver: ' + (error as Error).message)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>TIN</TableHead>
            <TableHead>Car Code</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-500">
                No drivers found. Upload an Excel file to get started.
              </TableCell>
            </TableRow>
          ) : (
            drivers.map((driver) => (
              <TableRow key={driver.id}>
                <TableCell className="font-medium">{driver.name || '—'}</TableCell>
                <TableCell>{driver.phone}</TableCell>
                <TableCell>{driver.tin || '—'}</TableCell>
                <TableCell>{getCarCodeBadge(driver.car_code)}</TableCell>
                <TableCell>{getStatusBadge(driver.status)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewDriver(driver)}
                      disabled={updatingId === driver.id}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {driver.status !== 'approved' && (
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => handleApprove(driver)}
                        disabled={updatingId === driver.id}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {driver.status !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(driver)}
                        disabled={updatingId === driver.id}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => handleDelete(driver)}
                      disabled={updatingId === driver.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}