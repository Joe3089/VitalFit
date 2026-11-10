import { Client } from '../client';
import type {
  AssignRoutineRequest,
  CreateExerciseRequest,
  CreateRoutineRequest,
  Exercise,
  PaginatedTotal,
  PaginationRequest,
  Routine,
  UpdateRoutineRequest,
  UserRoutineResponse,
} from '@/types';

export class RoutineService {
  private client: Client;
  constructor(client: Client) {
    this.client = client;
    this.createRoutine = this.createRoutine.bind(this);
    this.assignRoutine = this.assignRoutine.bind(this);
    this.getMyRoutines = this.getMyRoutines.bind(this);
    this.deleteRoutine = this.deleteRoutine.bind(this);
    this.updateRoutine = this.updateRoutine.bind(this);
    this.createExercise = this.createExercise.bind(this);
    this.getExercises = this.getExercises.bind(this);
    this.getClientRoutines = this.getClientRoutines.bind(this);
    this.getInstructorRoutines = this.getInstructorRoutines.bind(this);
    this.getRoutineById = this.getRoutineById.bind(this);
    this.getAllRoutines = this.getAllRoutines.bind(this);
    this.markRoutineCompletion = this.markRoutineCompletion.bind(this);
  }

  async createRoutine(
    data: CreateRoutineRequest,
    jwt: string,
  ): Promise<Routine> {
    const response = await this.client.post({
      url: '/routines',
      jwt,
      data,
    });
    return response as unknown as Routine;
  }

  async assignRoutine(data: AssignRoutineRequest, jwt: string): Promise<void> {
    await this.client.post({
      url: '/routines/assign',
      jwt,
      data,
    });
  }

  async getMyRoutines(
    jwt: string,
    { page = 1, limit = 10, sort = 'desc', search }: PaginationRequest,
  ): Promise<PaginatedTotal<UserRoutineResponse[]>> {
    const response = await this.client.get({
      url: '/routines/my-routines',
      jwt,
      params: {
        page,
        limit,
        sort,
        search,
      },
    });
    return response as unknown as PaginatedTotal<UserRoutineResponse[]>;
  }

  async deleteRoutine(routineId: string, jwt: string): Promise<void> {
    await this.client.delete({
      url: `/routines/${routineId}`,
      jwt,
    });
  }

  async updateRoutine(
    routineId: string,
    data: UpdateRoutineRequest,
    jwt: string,
  ): Promise<void> {
    await this.client.put({
      url: `/routines/${routineId}`,
      jwt,
      data,
    });
  }

  async createExercise(
    data: CreateExerciseRequest,
    jwt: string,
  ): Promise<Exercise> {
    const response = await this.client.post({
      url: '/exercises',
      jwt,
      data,
    });
    return response as unknown as Exercise;
  }

  async getExercises(
    jwt: string,
    { page = 1, limit = 10, sort = 'asc', search }: PaginationRequest,
  ): Promise<PaginatedTotal<Exercise[]>> {
    const response = await this.client.get({
      url: '/exercises',
      jwt,
      params: {
        page,
        limit,
        sort,
        search,
      },
    });
    return response as unknown as PaginatedTotal<Exercise[]>;
  }

  async getClientRoutines(
    clientId: string,
    jwt: string,
    { page = 1, limit = 10, sort = 'desc', search }: PaginationRequest,
  ): Promise<PaginatedTotal<UserRoutineResponse[]>> {
    const response = await this.client.get({
      url: `/routines/client/${clientId}`,
      jwt,
      params: {
        page,
        limit,
        sort,
        search,
      },
    });
    return response as unknown as PaginatedTotal<UserRoutineResponse[]>;
  }

  async getInstructorRoutines(
    jwt: string,
    { page = 1, limit = 10, sort = 'desc', search }: PaginationRequest,
  ): Promise<PaginatedTotal<Routine[]>> {
    const response = await this.client.get({
      url: '/routines/my-created',
      jwt,
      params: {
        page,
        limit,
        sort,
        search,
      },
    });
    return response as unknown as PaginatedTotal<Routine[]>;
  }

  async getRoutineById(routineId: string, jwt: string): Promise<Routine> {
    const response = await this.client.get({
      url: `/routines/${routineId}`,
      jwt,
    });
    return response as unknown as Routine;
  }

  async getAllRoutines(
    jwt: string,
    { page = 1, limit = 10, sort = 'desc', search }: PaginationRequest,
  ): Promise<PaginatedTotal<Routine[]>> {
    const response = await this.client.get({
      url: '/routines',
      jwt,
      params: {
        page,
        limit,
        sort,
        search,
      },
    });
    return response as unknown as PaginatedTotal<Routine[]>;
  }

  async markRoutineCompletion(
    userRoutineId: string,
    jwt: string,
  ): Promise<void> {
    await this.client.post({
      url: `/routines/my-routines/${userRoutineId}/complete`,
      jwt,
    });
  }
}
