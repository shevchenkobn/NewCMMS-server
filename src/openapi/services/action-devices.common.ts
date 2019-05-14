import { inject, injectable } from 'inversify';
import { DeepPartial, DeepReadonly, Nullable } from '../../@types';
import {
  ActionDevicesModel,
  IActionDevice,
  IActionDeviceChange,
  IActionDevicesSelectParams,
} from '../../models/action-devices.model';
import { ErrorCode, LogicError } from '../../services/error.service';
import {
  deletePropsFromArray,
  differenceArrays,
  mergeArrays,
} from '../../utils/common';
import { PaginationCursor } from '../../utils/model';

export interface IActionDeviceList {
  actionDevices: IActionDevice[];
  cursor: Nullable<string>;
}

export interface IGetActionDevicesParams {
  select?: ReadonlyArray<keyof IActionDevice>;
  actionDeviceIds?: ReadonlyArray<number>;
  skip?: number;
  limit?: number;
  sort?: ReadonlyArray<string>;
  cursor?: string;
  generateCursor?: boolean;
}

@injectable()
export class ActionDevicesCommon {
  readonly actionDevicesModel: ActionDevicesModel;

  constructor(
    @inject(ActionDevicesModel) actionDevicesModel: ActionDevicesModel,
  ) {
    this.actionDevicesModel = actionDevicesModel;
  }

  createActionDevice(device: DeepReadonly<IActionDeviceChange>): Promise<{}>;
  createActionDevice<T extends DeepPartial<IActionDevice> = DeepPartial<IActionDevice>>(
    device: DeepReadonly<IActionDeviceChange>,
    returning: ReadonlyArray<keyof IActionDevice>,
  ): Promise<T>;
  createActionDevice(
    device: DeepReadonly<IActionDeviceChange>,
    returning?: ReadonlyArray<keyof IActionDevice>,
  ): Promise<DeepPartial<IActionDevice>> {
    return (returning
      ? this.actionDevicesModel.createOne(
        device,
        returning,
      )
      : this.actionDevicesModel.createOne(device));
  }

  async getActionDevices(
    params: DeepReadonly<IGetActionDevicesParams>,
  ): Promise<IActionDeviceList> {
    const args = Object.assign({ generateCursor: true }, params);
    let cursor = null;
    if (args.sort) {
      cursor = new PaginationCursor<IActionDevice>(args.sort, args.cursor);
    } else {
      if (args.cursor) {
        throw new LogicError(ErrorCode.SORT_NO);
      }
    }
    const modelParams = {
      actionDeviceIds: args.actionDeviceIds,
      orderBy: args.sort,
      offset: args.skip,
      limit: args.limit,
    } as IActionDevicesSelectParams;
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
    const devices = await this.actionDevicesModel.getList(modelParams);
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
      actionDevices: devices,
      cursor: args.generateCursor && cursor
        ? cursor.toString()
        : null,
    };
  }

  getActionDevice(actionDeviceId: number): Promise<IActionDevice>;
  getActionDevice<T extends DeepPartial<IActionDevice> = DeepPartial<IActionDevice>>(
    actionDeviceId: number,
    select: ReadonlyArray<keyof IActionDevice>,
  ): Promise<T>;
  async getActionDevice(
    actionDeviceId: number,
    select?: ReadonlyArray<keyof IActionDevice>,
  ) {
    const device = await (!select || select.length === 0
      ? this.actionDevicesModel.getOne(actionDeviceId)
      : this.actionDevicesModel.getOne(actionDeviceId, select));
    if (!device) {
      throw new LogicError(ErrorCode.NOT_FOUND);
    }
    return device;
  }

  updateActionDevice(
    actionDeviceId: number,
    device: IActionDeviceChange,
  ): Promise<{}>;
  updateActionDevice<T extends DeepPartial<IActionDevice> = DeepPartial<IActionDevice>>(
    actionDeviceId: number,
    device: IActionDeviceChange,
    select: ReadonlyArray<keyof IActionDevice>,
  ): Promise<T>;
  async updateActionDevice(
    actionDeviceId: number,
    update: IActionDeviceChange,
    select?: ReadonlyArray<keyof IActionDevice>,
  ): Promise<DeepPartial<IActionDevice> | {}> {
    const device = await (select
      ? this.actionDevicesModel.updateOne(
        actionDeviceId,
        update,
        select,
      )
      : this.actionDevicesModel.updateOne(actionDeviceId, update));
    if (!device) {
      throw new LogicError(ErrorCode.NOT_FOUND);
    }
    return device;
  }

  deleteActionDevice(actionDeviceId: number): Promise<{}>;
  deleteActionDevice<T extends DeepPartial<IActionDevice> = DeepPartial<IActionDevice>>(
    actionDeviceId: number,
    select: ReadonlyArray<keyof IActionDevice>,
  ): Promise<T>;
  async deleteActionDevice(
    actionDeviceId: number,
    select?: ReadonlyArray<keyof IActionDevice>,
  ): Promise<DeepPartial<IActionDevice>> {
    const device = await (select
      ? this.actionDevicesModel.deleteOne(
        actionDeviceId,
        select,
      )
      : this.actionDevicesModel.deleteOne(actionDeviceId));
    if (!device) {
      throw new LogicError(ErrorCode.NOT_FOUND);
    }
    return device;
  }
}
