import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import UploadExcelDialog from '../components/UploadExcelDialog'
import DriverTable from '../components/DriverTable'
import { driverService } from '../services/driverService'
import type { Driver } from '../types/driver'
import DocumentViewer from '../components/DocumentViewer'
import { Search, RefreshCw, Users } from 'lucide-react'

export default function DashboardPage() {
  const { signOut, user } = useAuth()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [docViewerOpen, setDocViewerOpen] = useState(false)

  const loadDrivers = async () => {
    setLoading(true)
    try {
      const data = await driverService.getDrivers()
      setDrivers(data)
    } catch (error) {
      console.error('Error loading drivers:', error)
      alert('Failed to load drivers: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDrivers()
  }, [])

  useEffect(() => {
    let filtered = drivers

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(driver =>
        driver.phone.includes(searchTerm) ||
        (driver.name && driver.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (driver.tin && driver.tin.includes(searchTerm))
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(driver => driver.status === statusFilter)
    }

    setFilteredDrivers(filtered)
  }, [searchTerm, drivers, statusFilter])

  const stats = {
    total: drivers.length,
    pending: drivers.filter(d => d.status === 'pending').length,
    approved: drivers.filter(d => d.status === 'approved').length,
    rejected: drivers.filter(d => d.status === 'rejected').length
  }

  const handleViewDriver = (driver: Driver) => {
    setSelectedDriver(driver)
    setDocViewerOpen(true)
 }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-gray-900">Yango Elegance - Driver Management</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <Button variant="outline" onClick={signOut}>Sign Out</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Drivers</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Driver List</span>
              <div className="flex gap-2">
                <UploadExcelDialog onUploadComplete={loadDrivers} />
                <Button variant="outline" onClick={loadDrivers} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, phone, or TIN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('pending')}
                  size="sm"
                  className="bg-yellow-500 hover:bg-yellow-600"
                >
                  Pending
                </Button>
                <Button
                  variant={statusFilter === 'approved' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('approved')}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600"
                >
                  Approved
                </Button>
                <Button
                  variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('rejected')}
                  size="sm"
                  className="bg-red-500 hover:bg-red-600"
                >
                  Rejected
                </Button>
              </div>
            </div>

            {/* Driver Table */}
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading drivers...</div>
            ) : (
              <DriverTable
                drivers={filteredDrivers}
                onDriverUpdate={loadDrivers}
                onViewDriver={handleViewDriver}
              />
            )}
          </CardContent>
        </Card>
        {selectedDriver && (
            <DocumentViewer
                driverId={selectedDriver.id}
                driverName={selectedDriver.name || selectedDriver.phone}
                open={docViewerOpen}
                onOpenChange={setDocViewerOpen}
                onDocumentUpdate={loadDrivers}
            />
        )}
      </main>
    </div>
  )
}