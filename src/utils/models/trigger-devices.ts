import { DeepReadonly } from '../../@types';
import {
  ITriggerDevice,
  ITriggerDeviceId,
  ITriggerDeviceName,
} from '../../models/trigger-devices.model';
import { getIdColumn, TableName } from '../db-orchestrator';

export enum TriggerDeviceStatus {
  CONNECTED = 1,
  DISCONNECTED = 2,
}

export function getAllTriggerDevicePropertyNames(): (keyof ITriggerDevice)[] {
  return [
    getIdColumn(TableName.TRIGGER_DEVICES) as 'triggerDeviceId',
    'physicalAddress', 'status', 'name', 'type',
  ];
}

export function isValidTriggerDeviceUniqueIdentifier(
  nameOrTriggerDeviceId: DeepReadonly<ITriggerDeviceId | ITriggerDeviceName>,
): nameOrTriggerDeviceId is DeepReadonly<
  ITriggerDeviceId | ITriggerDeviceName
> {
  return Object.keys(nameOrTriggerDeviceId).length === 1 && (
    'name' in nameOrTriggerDeviceId
    || getIdColumn(TableName.TRIGGER_DEVICES) in nameOrTriggerDeviceId
  );
}
