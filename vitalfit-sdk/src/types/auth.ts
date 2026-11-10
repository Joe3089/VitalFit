export enum UserGender {
  male = 'male',
  female = 'female',
  preferNotToSay = 'prefer-not-to-say',
}

export type LoginRequest = {
  email: string;
  password: string;
  context?: string;
  device_token?: string;
};

export type LoginResponse = {
  refresh_token: string;
  token: string;
  /** Present when the configured password expiration was reached. */
  password_expired?: boolean;
  /** Dashboard logins may require a second factor (code sent by email). */
  two_factor_required?: boolean;
  challenge_id?: string;
  email_hint?: string;
  expires_at?: string;
};

export type TwoFactorVerifyRequest = {
  challenge_id: string;
  code: string;
};

export type PasswordPolicy = {
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_number: boolean;
  require_special: boolean;
  expiration_days: number;
};

export type SecuritySettings = PasswordPolicy & {
  two_factor_required: boolean;
  updated_by?: string | null;
  updated_at?: string;
};

export type SignUpRequest = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  identity_document: string;
  phone?: string | null;
  birth_date: string;
  gender?: UserGender | null;
  profile_picture_url?: string | null;
  role_name?: string | null;
};

export type Oauth = {
  session_token: string;
};

export type UserSession = {
  id: string;
  user_id: string;
  refresh_token: string;
  user_agent: string;
  client_ip: string;
  is_blocked: boolean;
  expires_at: string;
  created_at: string;
};

export type RenewTokenRequest = {
  refresh_token: string;
};
