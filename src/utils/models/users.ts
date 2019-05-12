import * as randomatic from 'randomatic';
import { DeepReadonly } from '../../@types';
import { IUser, IUserEmail, IUserId } from '../../models/users.model';
import { getIdColumn, TableName } from '../db-orchestrator';

export enum UserRole {
  EMPLOYEE = 1,
  ADMIN = 2,
}

export function getUserRoleLimits(): [number, number] {
  return [UserRole.EMPLOYEE, UserRole.ADMIN];
}

export const maxBcryptStringToHashLength = 72;
export const bcryptOptimalHashCycles = 13;

export function getRandomPassword() {
  return randomatic('aA0!', maxBcryptStringToHashLength);
}

export function isValidUserUniqueIdentifier(
  emailOrUserId: DeepReadonly<IUserEmail | IUserId>,
): emailOrUserId is DeepReadonly<IUserEmail | IUserId> {
  return Object.keys(emailOrUserId).length === 1 && (
    'email' in emailOrUserId
    || getIdColumn(TableName.USERS) in emailOrUserId
  );
}

export function getAllSafeUserPropertyNames(): (keyof IUser)[] {
  return [getIdColumn(TableName.USERS) as 'userId', 'email', 'role', 'fullName'];
}
