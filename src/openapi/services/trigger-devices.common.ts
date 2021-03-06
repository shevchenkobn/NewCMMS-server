import { inject, injectable } from 'inversify';
import { DeepPartial, DeepReadonly, Nullable } from '../../@types';
import {
  ITriggerDevice,
  ITriggerDeviceChange,
  ITriggerDevicesSelectParams,
  TriggerDevicesModel,
} from '../../models/trigger-devices.model';
import { ErrorCode, LogicError } from '../../services/error.service';
import {
  deletePropsFromArray,
  differenceArrays,
  mergeArrays,
} from '../../utils/common';
import { PaginationCursor } from '../../utils/model';

export interface ITriggerDeviceList {
  triggerDevices: ITriggerDevice[];
  cursor: Nullable<string>;
}

export interface IGetTriggerDevicesParams {
  select?: ReadonlyArray<keyof ITriggerDevice>;
  triggerDeviceIds?: ReadonlyArray<number>;
  skip?: number;
  limit?: number;
  sort?: ReadonlyArray<string>;
  cursor?: string;
  generateCursor?: boolean;
}

@injectable()
export class TriggerDevicesCommon {
  readonly triggerDevicesModel: TriggerDevicesModel;

  constructor(
    @inject(TriggerDevicesModel) triggerDevicesModel: TriggerDevicesModel,
  ) {
    this.triggerDevicesModel = triggerDevicesModel;
  }

  createTriggerDevice(device: DeepReadonly<ITriggerDeviceChange>): Promise<{}>;
  createTriggerDevice<T extends DeepPartial<ITriggerDevice> = DeepPartial<ITriggerDevice>>(
    device: DeepReadonly<ITriggerDeviceChange>,
    returning: ReadonlyArray<keyof ITriggerDevice>,
  ): Promise<T>;
  createTriggerDevice(
    device: DeepReadonly<ITriggerDeviceChange>,
    returning?: ReadonlyArray<keyof ITriggerDevice>,
  ): Promise<DeepPartial<ITriggerDevice> | {}> {
    return (returning
      ? this.triggerDevicesModel.createOne(
        device,
        returning,
      )
      : this.triggerDevicesModel.createOne(device));
  }

  async getTriggerDevices(
    params: DeepReadonly<IGetTriggerDevicesParams>,
  ): Promise<ITriggerDeviceList> {
    const args = Object.assign({ generateCursor: true }, params);
    let cursor = null;
    if (args.sort) {
      cursor = new PaginationCursor<ITriggerDevice>(args.sort, args.cursor);
    } else {
      if (args.cursor) {
        throw new LogicError(ErrorCode.SORT_NO);
      }
    }
    const modelParams = {
      triggerDeviceIds: args.triggerDeviceIds,
      orderBy: args.sort,
      offset: args.skip,
      limit: args.limit,
    } as ITriggerDevicesSelectParams;
    if (args.select) {
      modelParams.select = cursor
        ? mergeArrays(args.select, cursor.getFilteredFieldNames())
        : args.select;
    }
    if (cursor) {
      modelParams.comparatorFilters = cursor.filterField
        ? [cursor.filterField]
        : [];
    }
    const devices = await this.triggerDevicesModel.getList(modelParams);
    if (cursor) {
      if (args.generateCursor) {
        cursor.updateFromList(devices);
      }
      cursor.removeIrrelevantFromList(devices);
    }
    if (
      modelParams.select
      && args.select
      && modelParams.select.length !== args.select.length
    ) {
      deletePropsFromArray(
        devices,
        differenceArrays(modelParams.select, args.select),
      );
    }
    return {
      triggerDevices: devices,
      cursor: args.generateCursor && cursor
        ? cursor.toString()
        : null,
    };
  }

  getTriggerDevice(triggerDeviceId: number): Promise<ITriggerDevice>;
  getTriggerDevice<T extends DeepPartial<ITriggerDevice> = DeepPartial<ITriggerDevice>>(
    triggerDeviceId: number,
    select: ReadonlyArray<keyof ITriggerDevice>,
  ): Promise<T>;
  async getTriggerDevice(
    triggerDeviceId: number,
    select?: ReadonlyArray<keyof ITriggerDevice>,
  ) {
    const device = await (!select || select.length === 0
      ? this.triggerDevicesModel.getOne({ triggerDeviceId })
      : this.triggerDevicesModel.getOne({ triggerDeviceId }, select));
    if (!device) {
      throw new LogicError(ErrorCode.NOT_FOUND);
    }
    return device;
  }

  updateTriggerDevice(
    triggerDeviceId: number,
    device: ITriggerDeviceChange,
  ): Promise<{}>;
  updateTriggerDevice<T extends DeepPartial<ITriggerDevice> = DeepPartial<ITriggerDevice>>(
    triggerDeviceId: number,
    device: ITriggerDeviceChange,
    select: ReadonlyArray<keyof ITriggerDevice>,
  ): Promise<T>;
  async updateTriggerDevice(
    triggerDeviceId: number,
    update: ITriggerDeviceChange,
    select?: ReadonlyArray<keyof ITriggerDevice>,
  ): Promise<DeepReadonly<ITriggerDevice> | {}> {
    const device = await (select
      ? this.triggerDevicesModel.updateOne(
        triggerDeviceId,
        update,
        select,
      )
      : this.triggerDevicesModel.updateOne(triggerDeviceId, update));
    if (!device) {
      throw new LogicError(ErrorCode.NOT_FOUND);
    }
    return device;
  }

  deleteTriggerDevice(triggerDeviceId: number): Promise<{}>;
  deleteTriggerDevice<T extends DeepPartial<ITriggerDevice> = DeepPartial<ITriggerDevice>>(
    triggerDeviceId: number,
    select: ReadonlyArray<keyof ITriggerDevice>,
  ): Promise<T>;
  async deleteTriggerDevice(
    triggerDeviceId: number,
    select?: ReadonlyArray<keyof ITriggerDevice>,
  ): Promise<DeepPartial<ITriggerDevice> | {}> {
    const device = await (select
      ? this.triggerDevicesModel.deleteOne(
        triggerDeviceId,
        select,
      )
      : this.triggerDevicesModel.deleteOne(triggerDeviceId));
    if (!device) {
      throw new LogicError(ErrorCode.NOT_FOUND);
    }
    return device;
  }
}
