export interface OrderItem {
  id: string
  title: string
  price: number
  quantity: number
  _id: string
}

export interface OrderUser {
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

export interface Order {
  _id: string
  orderNumber?: string | number
  estado?: string
  status?: string
  createdAt: string
  total?: number
  user?: OrderUser
  items?: OrderItem[]
  __v?: number
}