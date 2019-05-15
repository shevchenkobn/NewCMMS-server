import { DeepPartial } from '../../@types';
import { IActionDevice } from '../../models/action-devices.model';
import {
  ITriggerAction, ITriggerActionWithActionDevice,
  ITriggerActionWithDevices, ITriggerActionWithTriggerDevice,
} from '../../models/trigger-actions.model';
import { ITriggerDevice } from '../../models/trigger-devices.model';
import { getLazyMapper } from '../common';
import { getIdColumn, TableName } from '../db-orchestrator';

export function getAllTriggerActionPropertyNames(): (keyof ITriggerAction)[] {
  return [
    getIdColumn(TableName.TRIGGER_ACTIONS) as 'triggerActionId',
    'triggerDeviceId', 'actionDeviceId',
  ];
}

export function mergeTriggerDevicesIntoTriggerActions<
  Tr extends DeepPartial<ITriggerDevice> & { triggerDeviceId: number } =
    DeepPartial<ITriggerDevice> & { triggerDeviceId: number },
  Ta extends DeepPartial<ITriggerAction> & { triggerDeviceId: number } =
    DeepPartial<ITriggerAction> & { triggerDeviceId: number }
>(
  triggerActions: Ta[],
  triggerDevices: ReadonlyArray<Tr>,
): ITriggerActionWithTriggerDevice<Tr>[] {
  const triggerActionsWithDevices = triggerActions as unknown as
    ITriggerActionWithTriggerDevice<Tr>[];
  const triggerDevicesMap = new Map<number, Tr>(
    getLazyMapper<Tr, [number, Tr]>(
      device => [device.triggerDeviceId, device],
    )(triggerDevices),
  );
  for (const triggerAction of triggerActionsWithDevices) {
    triggerAction.triggerDevice =
      triggerDevicesMap.get(triggerAction.triggerDeviceId)!;
  }
  return triggerActionsWithDevices;
}

export function mergeActionDevicesIntoTriggerActions<
  A extends DeepPartial<IActionDevice> & { actionDeviceId: number } =
      DeepPartial<IActionDevice> & { actionDeviceId: number },
  Ta extends DeepPartial<ITriggerAction> & { actionDeviceId: number } =
      DeepPartial<ITriggerAction> & { actionDeviceId: number }
>(
  triggerActions: Ta[],
  triggerDevices: ReadonlyArray<A>,
): ITriggerActionWithActionDevice<A>[] {
  const triggerActionsWithDevices = triggerActions as unknown as
    ITriggerActionWithActionDevice<A>[];
  const triggerDevicesMap = new Map<number, A>(
    getLazyMapper<A, [number, A]>(
      device => [device.actionDeviceId, device],
    )(triggerDevices),
  );
  for (const triggerAction of triggerActionsWithDevices) {
    triggerAction.actionDevice =
      triggerDevicesMap.get(triggerAction.actionDeviceId)!;
  }
  return triggerActionsWithDevices;
}
