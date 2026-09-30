const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan');
  return data as T;
}

export async function uploadFile<T>(endpoint: string, formData: FormData, token?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
    cache: 'no-store',
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan');
  return data as T;
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    request<{ user: import('@/types').User; accessToken: string; refreshToken: string }>(
      '/api/auth/login', { method: 'POST', body: { email, password } }
    ),
  register: (data: { name: string; email: string; password: string; phone?: string; role?: string; idCardNumber?: string; emergencyContact?: string }) =>
    request<{ user: import('@/types').User; accessToken: string; refreshToken: string }>(
      '/api/auth/register', { method: 'POST', body: data }
    ),
  me: (token: string) => request<import('@/types').User>('/api/auth/me', { token }),
  logout: (token: string, refreshToken: string) =>
    request('/api/auth/logout', { method: 'POST', token, body: { refreshToken } }),
  refresh: (refreshToken: string) =>
    request<{ accessToken: string; refreshToken: string }>(
      '/api/auth/refresh', { method: 'POST', body: { refreshToken } }
    ),
};

// Users
export const userApi = {
  updateProfile: (data: Partial<{ name: string; phone: string; themePreference: string }>, token: string) =>
    request('/api/users/profile', { method: 'PATCH', body: data, token }),
  changePassword: (data: { currentPassword: string; newPassword: string }, token: string) =>
    request('/api/users/change-password', { method: 'PATCH', body: data, token }),
};

// Properties
export const propertyApi = {
  list: (token: string, params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    return request<{ data: import('@/types').Property[], meta: { total: number, page: number, limit: number, totalPages: number } }>(`/api/properties?${query.toString()}`, { token });
  },
  get: (id: string, token: string) => request<import('@/types').Property>(`/api/properties/${id}`, { token }),
  create: (formData: FormData, token: string) => uploadFile<import('@/types').Property>('/api/properties', formData, token),
  update: (id: string, formData: FormData, token: string) => uploadFile<import('@/types').Property>(`/api/properties/${id}`, formData, token),
  delete: (id: string, token: string) => request(`/api/properties/${id}`, { method: 'DELETE', token }),
};

// Rooms
export const roomApi = {
  list: (token: string, params?: { propertyId?: string; status?: string; search?: string; minPrice?: number; maxPrice?: number; facility?: string; sort?: string }) => {
    const q = new URLSearchParams();
    if (params?.propertyId) q.set('propertyId', params.propertyId);
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    if (params?.minPrice !== undefined) q.set('minPrice', String(params.minPrice));
    if (params?.maxPrice !== undefined) q.set('maxPrice', String(params.maxPrice));
    if (params?.facility) q.set('facility', params.facility);
    if (params?.sort) q.set('sort', params.sort);
    return request<import('@/types').Room[]>(`/api/rooms?${q}`, { token });
  },
  get: (id: string, token: string) => request<import('@/types').Room>(`/api/rooms/${id}`, { token }),
  create: (formData: FormData, token: string) => uploadFile<import('@/types').Room>('/api/rooms', formData, token),
  update: (id: string, formData: FormData, token: string) => uploadFile<import('@/types').Room>(`/api/rooms/${id}`, formData, token),
  delete: (id: string, token: string) => request(`/api/rooms/${id}`, { method: 'DELETE', token }),
};

// Tenants
export const tenantApi = {
  list: (token: string, propertyId?: string) =>
    request<import('@/types').Tenant[]>(`/api/tenants${propertyId ? `?propertyId=${propertyId}` : ''}`, { token }),
  get: (id: string, token: string) => request<import('@/types').Tenant>(`/api/tenants/${id}`, { token }),
  create: (data: unknown, token: string) => request<import('@/types').Tenant>('/api/tenants', { method: 'POST', body: data, token }),
  update: (id: string, data: unknown, token: string) => request<import('@/types').Tenant>(`/api/tenants/${id}`, { method: 'PATCH', body: data, token }),
};

// Contracts
export const contractApi = {
  list: (token: string, params?: { propertyId?: string; tenantId?: string; isActive?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.propertyId) q.set('propertyId', params.propertyId);
    if (params?.tenantId) q.set('tenantId', params.tenantId);
    if (params?.isActive !== undefined) q.set('isActive', String(params.isActive));
    return request<import('@/types').Contract[]>(`/api/contracts?${q}`, { token });
  },
  get: (id: string, token: string) => request<import('@/types').Contract>(`/api/contracts/${id}`, { token }),
  create: (data: unknown, token: string) => request<import('@/types').Contract>('/api/contracts', { method: 'POST', body: data, token }),
  book: (data: { roomId: string; durationMonths: number; startDate: string }, token: string) => request<import('@/types').Invoice>('/api/contracts/book', { method: 'POST', body: data, token }),
  checkout: (id: string, token: string) => request(`/api/contracts/${id}/checkout`, { method: 'PATCH', token }),
};

// Invoices
export const invoiceApi = {
  list: (token: string, params?: { status?: string; propertyId?: string; period?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.propertyId) q.set('propertyId', params.propertyId);
    if (params?.period) q.set('period', params.period);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return request<import('@/types').PaginatedResponse<import('@/types').Invoice>>(`/api/invoices?${q}`, { token });
  },
  get: (id: string, token: string) => request<import('@/types').Invoice>(`/api/invoices/${id}`, { token }),
  create: (data: unknown, token: string) => request<import('@/types').Invoice>('/api/invoices', { method: 'POST', body: data, token }),
  generate: (token: string) => request('/api/invoices/generate', { method: 'POST', token }),
  payEarly: (contractId: string, token: string, targetPeriod?: string) => request<import('@/types').Invoice>('/api/invoices/pay-early', { method: 'POST', body: { contractId, targetPeriod }, token }),
  cancel: (id: string, token: string) => request(`/api/invoices/${id}/cancel`, { method: 'PATCH', token }),
};

// Payments
export const paymentApi = {
  list: (token: string, params?: { invoiceId?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.invoiceId) q.set('invoiceId', params.invoiceId);
    if (params?.status) q.set('status', params.status);
    return request<import('@/types').Payment[]>(`/api/payments?${q}`, { token });
  },
  submit: (formData: FormData, token: string) => uploadFile<import('@/types').Payment>('/api/payments', formData, token),
  verify: (id: string, data: { action: 'approve' | 'reject'; rejectReason?: string }, token: string) =>
    request(`/api/payments/${id}/verify`, { method: 'PATCH', body: data, token }),
};

// Reports
export const reportApi = {
  summary: (token: string, params?: { propertyId?: string; timeRange?: string }) => {
    const q = new URLSearchParams();
    if (params?.propertyId) q.set('propertyId', params.propertyId);
    if (params?.timeRange) q.set('timeRange', params.timeRange);
    return request<import('@/types').DashboardSummary>(`/api/reports/summary?${q}`, { token });
  },
  exportExcel: async (token: string, params?: { propertyId?: string; period?: string }) => {
    const q = new URLSearchParams({ format: 'excel' });
    if (params?.propertyId) q.set('propertyId', params.propertyId);
    if (params?.period) q.set('period', params.period);
    const res = await fetch(`${API_URL}/api/reports/export?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    return blob;
  },
  notifications: (token: string, unreadOnly = false) =>
    request<import('@/types').Notification[]>(
      `/api/reports/notifications${unreadOnly ? '?unreadOnly=true' : ''}`, { token }
    ),
  readAllNotifications: (token: string) =>
    request('/api/reports/notifications/read-all', { method: 'PATCH', token }),
};
