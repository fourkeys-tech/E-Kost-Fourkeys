export type Role = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'TENANT';

export type RoomStatus = 'EMPTY' | 'OCCUPIED' | 'MAINTENANCE';

export type InvoiceStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'PARTIAL'
  | 'WAITING_VERIFICATION'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export type PaymentMethod = 'MANUAL' | 'MIDTRANS';
export type PaymentStatus =
  | 'PENDING'
  | 'WAITING_VERIFICATION'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  themePreference: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Property {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  provinceId?: string;
  province?: string;
  regencyId?: string;
  regency?: string;
  districtId?: string;
  district?: string;
  villageId?: string;
  village?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  facilities: string[];
  photos: string[];
  lateFeePct: number;
  maxLateFee: number;
  isActive: boolean;
  type?: string;
  billingCycle?: string;
  createdAt: string;
  owner?: Pick<User, 'id' | 'name' | 'email'>;
  roomStats?: { empty: number; occupied: number; maintenance: number };
  _count?: { rooms: number };
  rooms?: Room[];
}

export interface Room {
  id: string;
  propertyId: string;
  roomNumber: string;
  type: string;
  category?: string;
  price: number;
  depositAmount?: number;
  floor?: number;
  description?: string;
  facilities: string[];
  photos: string[];
  status: RoomStatus;
  createdAt: string;
  contracts?: Contract[];
}

export interface Tenant {
  id: string;
  userId: string;
  phone?: string;
  idCardNumber?: string;
  emergencyContact?: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'phone'>;
  contracts?: Contract[];
}

export interface Contract {
  id: string;
  tenantId: string;
  roomId: string;
  startDate: string;
  endDate?: string;
  durationMonths: number;
  rentAmount: number;
  deposit: number;
  depositStatus?: string;
  balance?: number;
  dueDay: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  tenant?: Tenant;
  room?: Room & { property?: Pick<Property, 'id' | 'name' | 'address'> };
  invoices?: Invoice[];
}

export interface Invoice {
  id: string;
  contractId: string;
  period: string;
  amount: number;
  lateFee: number;
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  contract?: Contract;
  allocations?: PaymentAllocation[];
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  amount: number;
  createdAt: string;
  payment?: Payment;
  invoice?: Invoice;
}

export interface Payment {
  id: string;
  contractId: string;
  method: PaymentMethod;
  amount: number;
  proofUrl?: string;
  midtransToken?: string;
  midtransOrderId?: string;
  status: PaymentStatus;
  verifiedById?: string;
  verifiedAt?: string;
  rejectReason?: string;
  notes?: string;
  createdAt: string;
  contract?: Contract;
  allocations?: PaymentAllocation[];
  verifiedBy?: Pick<User, 'id' | 'name'>;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  channel: string;
  message: string;
  isRead: boolean;
  sentAt?: string;
  status: string;
  createdAt: string;
}

export interface DashboardSummary {
  totalProperties: number;
  totalRooms: number;
  occupied: number;
  empty: number;
  maintenance: number;
  occupancyRate: number;
  currentMonthRevenue: number;
  totalOverdue: number;
  overdueCount: number;
  waitingVerification: number;
  revenueChart: { period: string; revenue: number; count: number }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
}
