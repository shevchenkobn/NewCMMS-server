import { IActionDevice } from '../../models/action-devices.model';
import { getIdColumn, TableName } from '../db-orchestrator';

export enum ActionDeviceStatus {
  CONNECTED = 1,
  ONLINE = 2,
  DISCONNECTED = 3,
}

export function getAllActionDevicePropertyNames(): (keyof IActionDevice)[] {
  return [
    getIdColumn(TableName.ACTION_DEVICES) as 'actionDeviceId',
    'physicalAddress', 'status', 'hourlyRate', 'name', 'type',
  ];
}
