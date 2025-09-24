'use client'
import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Phone, MapPin, Calendar, CreditCard, FileText } from 'lucide-react'

interface UserInfoModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    _id?: string
    firstName?: string
    middleName?: string
    lastName?: string
    email?: string
    phoneNumber?: string
    birthDate?: string
    streetAddress?: string
    apartmentNumber?: string
    city?: string
    state?: string
    zipCode?: string
    sex?: string
    licenseNumber?: string
    hasLicense?: boolean
    role?: string
    createdAt?: string
    howDidYouHear?: string
    privateNotes?: string
  }
}

export default function UserInfoModal({ isOpen, onClose, user }: UserInfoModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getFullAddress = () => {
    const parts = []
    if (user.streetAddress) parts.push(user.streetAddress)
    if (user.apartmentNumber) parts.push(`Apt ${user.apartmentNumber}`)
    if (user.city) parts.push(user.city)
    if (user.state) parts.push(user.state)
    if (user.zipCode) parts.push(user.zipCode)
    return parts.join(', ')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Information
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold border-b pb-2">Personal Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">
                    {[user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ')}
                  </p>
                </div>
              </div>

              {/* Email */}
              {user.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
              )}

              {/* Phone Number */}
              {user.phoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone Number</p>
                    <p className="font-medium">{user.phoneNumber}</p>
                  </div>
                </div>
              )}

              {/* Birth Date */}
              {user.birthDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Birth Date</p>
                    <p className="font-medium">{formatDate(user.birthDate)}</p>
                  </div>
                </div>
              )}

              {/* Sex */}
              {user.sex && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Sex</p>
                    <p className="font-medium">{user.sex}</p>
                  </div>
                </div>
              )}

              {/* Role */}
              {user.role && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{user.role}</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Address Information */}
          {getFullAddress() && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold border-b pb-2">Address</h3>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{getFullAddress()}</p>
                </div>
              </div>
            </div>
          )}

          {/* License Information */}
          {(user.hasLicense || user.licenseNumber) && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold border-b pb-2">License Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.hasLicense !== undefined && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Has License</p>
                      <Badge variant={user.hasLicense ? "default" : "secondary"}>
                        {user.hasLicense ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                )}
                
                {user.licenseNumber && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">License Number</p>
                      <p className="font-medium">{user.licenseNumber}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold border-b pb-2">Additional Information</h3>
            
            {user.howDidYouHear && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">How did you hear about us?</p>
                  <p className="font-medium">{user.howDidYouHear}</p>
                </div>
              </div>
            )}

            {user.createdAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Customer Since</p>
                  <p className="font-medium">{formatDate(user.createdAt)}</p>
                </div>
              </div>
            )}

            {user.privateNotes && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Private Notes</p>
                  <p className="font-medium bg-muted p-3 rounded-lg">{user.privateNotes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}