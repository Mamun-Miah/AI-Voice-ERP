export type JwtUser = {
  sub: string; // Standard JWT subject (User ID)
  id: string; // Added for convenience
  branchId: string;
  phone: string;
  username?: string;
  isPhoneVerified: boolean;
  role: string;
  businessId: string;
  iat?: number; // Issued at (added automatically by JWT)
  exp?: number; // Expiration (added automatically by JWT)
};
