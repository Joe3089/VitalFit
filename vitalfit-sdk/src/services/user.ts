import { Client } from '@/client';
import type {
  UserApiResponse,
  DataResponse,
  User,
  UserPaginationOptions,
  GetUserResponse,
  UpdateUserRequest,
  UpdateUserStaffRequest,
  QrToken,
  PaginatedTotal,
  MedicalProfile,
  BlockUserRequest,
} from '@/types';

export class UserService {
  client: Client;
  constructor(client: Client) {
    this.client = client;
    this.WhoAmI = this.WhoAmI.bind(this);
    this.getBranchAdmins = this.getBranchAdmins.bind(this);
    this.getClientUsers = this.getClientUsers.bind(this);
    this.getStaffUsers = this.getStaffUsers.bind(this);
    this.getUserByEmail = this.getUserByEmail.bind(this);
    this.QrToken = this.QrToken.bind(this);

    this.GetUserByID = this.GetUserByID.bind(this);
    this.updateUserClient = this.updateUserClient.bind(this);
    this.updateUserStaff = this.updateUserStaff.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
    this.resendActivateOtp = this.resendActivateOtp.bind(this);
    this.UpgradePassword = this.UpgradePassword.bind(this);
    this.blockUser = this.blockUser.bind(this);
    this.unblockUser = this.unblockUser.bind(this);
    this.enrollFace = this.enrollFace.bind(this);

    //medical
    this.createMedicalProfile = this.createMedicalProfile.bind(this);
    this.getMedicalProfile = this.getMedicalProfile.bind(this);
    this.updateMedicalProfile = this.updateMedicalProfile.bind(this);
  }

  async getStaffUsers(
    {
      page = 1,
      limit = 10,
      sort = 'desc',
      search,
      role,
    }: UserPaginationOptions,
    jwt: string,
  ): Promise<DataResponse<User[]>> {
    const response = await this.client.get({
      url: '/user/users',
      jwt,
      params: {
        search,
        role,
        page,
        limit,
        sort,
      },
    });

    return response as unknown as DataResponse<User[]>;
  }

  async WhoAmI(jwt: string): Promise<UserApiResponse> {
    const response = await this.client.get({
      url: '/user/whoami',
      jwt,
    });
    return response as unknown as UserApiResponse;
  }
  async getBranchAdmins(jwt: string): Promise<DataResponse<User[]>> {
    const response = await this.client.get({
      url: '/user/branch-admins',
      jwt,
    });
    return response as unknown as DataResponse<User[]>;
  }

  async getClientUsers(
    jwt: string,
    options: UserPaginationOptions = {},
  ): Promise<PaginatedTotal<User[]>> {
    const response = await this.client.get({
      url: '/user/clients',
      jwt,
      params: options,
    });
    return response as unknown as PaginatedTotal<User[]>;
  }

  async GetUserByID(
    userId: string,
    jwt: string,
  ): Promise<DataResponse<GetUserResponse>> {
    const response = await this.client.get({
      url: `/user/${userId}`,
      jwt,
    });
    return response as unknown as DataResponse<GetUserResponse>;
  }

  async updateUserClient(
    userId: string,
    data: UpdateUserRequest,
    jwt: string,
  ): Promise<void> {
    await this.client.put({
      url: `/user/${userId}/client`,
      jwt,
      data,
    });
  }
  async updateUserStaff(
    userId: string,
    data: UpdateUserStaffRequest,
    jwt: string,
  ): Promise<void> {
    await this.client.put({
      url: `/user/${userId}/staff`,
      jwt,
      data,
    });
  }

  async deleteUser(userId: string, jwt: string): Promise<void> {
    await this.client.delete({
      url: `/user/${userId}`,
      jwt,
    });
  }

  async getUserByEmail(
    email: string,
    jwt: string,
  ): Promise<DataResponse<User>> {
    const response = await this.client.post({
      url: `/user/by-email`,
      jwt,
      data: {
        email: email,
      },
    });
    return response as unknown as DataResponse<User>;
  }

  async QrToken(jwt: string): Promise<QrToken> {
    const response = await this.client.get({
      url: `/user/qr-token`,
      jwt,
    });
    return response;
  }

  async resendActivateOtp(email: string): Promise<void> {
    await this.client.post({
      url: `/auth/resend-activation`,
      data: {
        email: email,
      },
    });
  }

  async UpgradePassword(
    jwt: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<void> {
    await this.client.post({
      url: `/user/change-password`,
      jwt,
      data: {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      },
    });
  }

  async blockUser(
    userId: string,
    data: BlockUserRequest,
    jwt: string,
  ): Promise<void> {
    await this.client.put({
      url: `/user/${userId}/block`,
      jwt,
      data,
    });
  }

  async unblockUser(userId: string, jwt: string): Promise<void> {
    await this.client.put({
      url: `/user/${userId}/unblock`,
      jwt,
    });
  }

  async enrollFace(
    jwt: string,
    photo: File | Blob,
  ): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('selfie', photo);

    const response = await this.client.upload({
      url: '/face-auth/enroll',
      jwt,
      data: formData,
    });
    return response as unknown as { message: string };
  }

  //medical
  async createMedicalProfile(
    userId: string,
    data: MedicalProfile,
    jwt: string,
  ): Promise<void> {
    await this.client.post({
      url: `/clients/${userId}/medical-info`,
      jwt,
      data,
    });
  }
  async getMedicalProfile(
    userId: string,
    jwt: string,
  ): Promise<DataResponse<MedicalProfile>> {
    const response = await this.client.get({
      url: `/clients/${userId}/medical-info`,
      jwt,
    });
    return response as unknown as DataResponse<MedicalProfile>;
  }
  async updateMedicalProfile(
    userId: string,
    data: MedicalProfile,
    jwt: string,
  ): Promise<void> {
    await this.client.put({
      url: `/clients/${userId}/medical-info`,
      jwt,
      data,
    });
  }
}
