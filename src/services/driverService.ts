import { supabase } from '../lib/supabase'
import type { Driver } from '../types/driver'

export const driverService = {
  // Get all drivers
  async getDrivers(): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Get single driver by ID
  async getDriver(id: string): Promise<Driver | null> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Update driver status and car code
  async updateDriver(id: string, updates: Partial<Driver>): Promise<void> {
    const { error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', id)
    
    if (error) throw error
  },

  // Import drivers from Excel data
  async importDrivers(drivers: Partial<Driver>[]): Promise<{ success: number; errors: string[] }> {
    const errors: string[] = []
    let success = 0

    for (const driver of drivers) {
      // Validate required fields
      if (!driver.phone) {
        errors.push(`Missing phone number for driver: ${JSON.stringify(driver)}`)
        continue
      }

      const { error } = await supabase
        .from('drivers')
        .upsert({
          phone: driver.phone,
          name: driver.name || null,
          tin: driver.tin || null,
          car_code: driver.car_code || null,
          status: 'pending'
        }, {
          onConflict: 'phone'
        })
      
      if (error) {
        errors.push(`Failed to import ${driver.phone}: ${error.message}`)
      } else {
        success++
      }
    }

    return { success, errors }
  },

  // Delete driver
  async deleteDriver(id: string): Promise<void> {
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}