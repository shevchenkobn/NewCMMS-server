import * as randomatic from 'randomatic';
import { DeepReadonly } from '../../@types';
import { IUser, IUserEmail, IUserId } from '../../models/users.model';

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
): emailOrUserId is (IUserEmail | IUserId) {
  return Object.keys(emailOrUserId).length === 1 && (
    'email' in emailOrUserId
    || 'userId' in emailOrUserId
  );
}

export function getAllSafeUserPropertyNames(): (keyof IUser)[] {
  return ['userId', 'email', 'role', 'fullName'];
}

export function getSortFields() {
  return getAllSafeUserPropertyNames()
    .flatMap(p => [`-${p}`, `+${p}`]);
}
