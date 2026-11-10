import { Client } from '../client';
import type {
  DataResponse,
  LoginRequest,
  LoginResponse,
  Oauth,
  PasswordPolicy,
  SecuritySettings,
  TwoFactorVerifyRequest,
  SignUpRequest,
  UserSession,
} from '@/types';

export class AuthService {
  private client: Client;
  constructor(client: Client) {
    this.client = client;
    this.login = this.login.bind(this);
    this.verifyTwoFactor = this.verifyTwoFactor.bind(this);
    this.resendTwoFactor = this.resendTwoFactor.bind(this);
    this.getPasswordPolicy = this.getPasswordPolicy.bind(this);
    this.getSecuritySettings = this.getSecuritySettings.bind(this);
    this.updateSecuritySettings = this.updateSecuritySettings.bind(this);
    this.signUp = this.signUp.bind(this);
    this.signUpStaff = this.signUpStaff.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.validateResetToken = this.validateResetToken.bind(this);
    this.verifyEmail = this.verifyEmail.bind(this);
    this.verifyStaff = this.verifyStaff.bind(this);
    this.oAuthLogin = this.oAuthLogin.bind(this);

    this.logout = this.logout.bind(this);
    this.saveJWT = this.saveJWT.bind(this);
    this.saveTokens = this.saveTokens.bind(this);

    this.renewToken = this.renewToken.bind(this);
    this.revokeAllSessions = this.revokeAllSessions.bind(this);
    this.revokeAllSessionsByUserID = this.revokeAllSessionsByUserID.bind(this);
    this.revokeSession = this.revokeSession.bind(this);
    this.revokeSessionByID = this.revokeSessionByID.bind(this);
    this.getUserSessions = this.getUserSessions.bind(this);
    this.getUserSessionByID = this.getUserSessionByID.bind(this);
  }
  async renewToken(refresh_token: string): Promise<LoginResponse> {
    const response = await this.client.post({
      url: '/auth/refresh',
      data: {
        refresh_token,
      },
    });
    return response as unknown as LoginResponse;
  }

  async revokeAllSessions(jwt: string): Promise<void> {
    await this.client.delete({
      url: '/user/sessions',
      jwt,
    });
  }

  async revokeAllSessionsByUserID(userId: string, jwt: string): Promise<void> {
    await this.client.delete({
      url: `/user/${userId}/sessions`,
      jwt,
    });
  }

  async revokeSession(sessionId: string, jwt: string): Promise<void> {
    await this.client.delete({
      url: `/user/sessions/${sessionId}`,
      jwt,
    });
  }

  async revokeSessionByID(sessionId: string, jwt: string): Promise<void> {
    await this.client.delete({
      url: `/user/sessions/${sessionId}`,
      jwt,
    });
  }
  async getUserSessions(jwt: string): Promise<DataResponse<UserSession[]>> {
    const response = await this.client.get({
      url: '/user/sessions',
      jwt,
    });
    return response as unknown as DataResponse<UserSession[]>;
  }
  async getUserSessionByID(
    userId: string,
    jwt: string,
  ): Promise<DataResponse<UserSession[]>> {
    const response = await this.client.get({
      url: `/user/${userId}/sessions`,
      jwt,
    });
    return response as unknown as DataResponse<UserSession[]>;
  }

  async login({
    email,
    password,
    context,
    device_token,
  }: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post({
      url: '/auth/login',
      data: {
        email,
        password,
        context,
        device_token,
      },
    });
    return response as unknown as LoginResponse;
  }

  /** Completes a login that returned `two_factor_required: true`. */
  async verifyTwoFactor(data: TwoFactorVerifyRequest): Promise<LoginResponse> {
    const response = await this.client.post({ url: '/auth/2fa/verify', data });
    return response as unknown as LoginResponse;
  }

  async resendTwoFactor(challengeId: string): Promise<void> {
    await this.client.post({
      url: '/auth/2fa/resend',
      data: { challenge_id: challengeId },
    });
  }

  async getPasswordPolicy(): Promise<PasswordPolicy> {
    return this.client.get({ url: '/auth/password-policy' });
  }

  async getSecuritySettings(jwt: string): Promise<SecuritySettings> {
    return this.client.get({ url: '/admin/security-settings', jwt });
  }

  async updateSecuritySettings(
    jwt: string,
    data: Omit<SecuritySettings, 'updated_by' | 'updated_at'>,
  ): Promise<SecuritySettings> {
    return this.client.put({ url: '/admin/security-settings', jwt, data });
  }

  logout(): void {
    this.client.removeTokens();
  }

  saveJWT(jwt: string): void {
    // Mantenemos compatibilidad, pero idealmente se debería usar saveTokens
    this.client.setTokens(jwt, '');
  }

  saveTokens(access: string, refresh: string): void {
    this.client.setTokens(access, refresh);
  }

  async signUp(signUpData: SignUpRequest): Promise<void> {
    const birthDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!birthDateRegex.test(signUpData.birth_date)) {
      throw new Error('Birth date must be in the format YYYY-MM-DD');
    }
    await this.client.post({
      url: '/auth/register',
      data: signUpData,
    });
  }

  async signUpStaff(signUpData: SignUpRequest, jwt: string): Promise<void> {
    const birthDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!birthDateRegex.test(signUpData.birth_date)) {
      throw new Error('Birth date must be in the format YYYY-MM-DD');
    }
    await this.client.post({
      url: '/auth/register-staff',
      jwt,
      data: signUpData,
    });
  }
  async forgotPassword(email: string): Promise<void> {
    await this.client.post({
      url: '/auth/password/forgot',
      data: {
        email,
      },
    });
  }

  async resetPassword(
    otp: string,
    password: string,
    repeatPassword: string,
  ): Promise<void> {
    await this.client.post({
      url: '/auth/password/reset',
      data: {
        token: otp,
        password: password,
        confirm_password: repeatPassword,
      },
    });
  }

  async validateResetToken(token: string): Promise<void> {
    await this.client.get({
      url: `/auth/password/validate/${token}`,
    });
  }

  async verifyEmail(otp: string): Promise<void> {
    await this.client.put({
      url: '/auth/activate',
      data: {
        code: otp,
      },
    });
  }

  async verifyStaff(
    token: string,
    password: string,
    repeatPassword: string,
  ): Promise<void> {
    await this.client.put({
      url: `/auth/activate/${token}`,
      data: {
        password: password,
        confirm_password: repeatPassword,
      },
    });
  }
  //comment
  async oAuthLogin(data: Oauth): Promise<LoginResponse> {
    const response = await this.client.post({
      url: '/auth/oauth-login',
      data,
    });
    return response as unknown as LoginResponse;
  }
}
