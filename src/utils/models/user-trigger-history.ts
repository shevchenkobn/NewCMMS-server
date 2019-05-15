import { IUserTrigger } from '../../models/user-trigger-history.model';
import { getIdColumn, TableName } from '../db-orchestrator';

export enum UserTriggerType {
  UNSPECIFIED = 0,
  ENTER = 1,
  LEAVE = 2,
}

export function getAllUserTriggerPropertyNames(): (keyof IUserTrigger)[] {
  return [
    getIdColumn(TableName.USER_TRIGGER_HISTORY) as 'userTriggerId',
    'triggerDeviceId', 'triggerTime', 'triggerType', 'userId',
  ];
}
