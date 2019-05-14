import { inject, injectable } from 'inversify';
import { DeepPartial, DeepReadonly, Nullable } from '../../@types';
import {
  ITriggerAction,
  ITriggerActionChange,
  ITriggerActionsSelectParams,
  TriggerActionsModel,
} from '../../models/trigger-actions.model';
import { ErrorCode, LogicError } from '../../services/error.service';
import {
  deletePropsFromArray,
  differenceArrays,
  mergeArrays,
} from '../../utils/common';
import { PaginationCursor } from '../../utils/model';

export interface ITriggerActionList {
  triggerActions: ITriggerAction[];
  cursor: Nullable<string>;
}

export interface IGetTriggerActionsParams {
  select?: ReadonlyArray<keyof ITriggerAction>;
  triggerActionIds?: ReadonlyArray<number>;
  skip?: number;
  limit?: number;
  sort?: ReadonlyArray<string>;
  cursor?: string;
  generateCursor?: boolean;
}

@injectable()
export class TriggerActionsCommon {
  readonly triggerActionsModel: TriggerActionsModel;

  constructor(
    @inject(TriggerActionsModel) triggerActionsModel: TriggerActionsModel,
  ) {
    this.triggerActionsModel = triggerActionsModel;
  }

  createTriggerAction(
    triggerAction: DeepReadonly<ITriggerActionChange>,
  ): Promise<{}>;
  createTriggerAction<T extends DeepPartial<ITriggerAction> = DeepPartial<ITriggerAction>>(
    triggerAction: DeepReadonly<ITriggerActionChange>,
    returning: ReadonlyArray<keyof ITriggerAction>,
  ): Promise<T>;
  createTriggerAction(
    triggerAction: DeepReadonly<ITriggerActionChange>,
    returning?: ReadonlyArray<keyof ITriggerAction>,
  ): Promise<DeepPartial<ITriggerAction>> {
    return (returning
      ? this.triggerActionsModel.createOne(
        triggerAction,
        returning,
      )
      : this.triggerActionsModel.createOne(triggerAction));
  }

  async getTriggerActions(
    params: DeepReadonly<IGetTriggerActionsParams>,
  ): Promise<ITriggerActionList> {
    const args = Object.assign({ generateCursor: true }, params);
    let cursor = null;
    if (args.sort) {
      cursor = new PaginationCursor<ITriggerAction>(args.sort, args.cursor);
    } else {
      if (args.cursor) {
        throw new LogicError(ErrorCode.SORT_NO);
      }
    }
    const modelParams = {
      triggerActionIds: args.triggerActionIds,
      orderBy: args.sort,
      offset: args.skip,
      limit: args.limit,
    } as ITriggerActionsSelectParams;
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
    const triggerActions = await this.triggerActionsModel.getList(modelParams);
    if (cursor) {
      if (args.generateCursor) {
        cursor.updateFromList(triggerActions);
      }
      cursor.removeIrrelevantFromList(triggerActions);
    }
    if (
      modelParams.select
      && args.select
      && modelParams.select.length !== args.select.length
    ) {
      deletePropsFromArray(
        triggerActions,
        differenceArrays(modelParams.select, args.select),
      );
    }
    return {
      triggerActions,
      cursor: args.generateCursor && cursor
        ? cursor.toString()
        : null,
    };
  }

  getTriggerAction(triggerActionId: number): Promise<ITriggerAction>;
  getTriggerAction<T extends DeepPartial<ITriggerAction> = DeepPartial<ITriggerAction>>(
    triggerActionId: number,
    select: ReadonlyArray<keyof ITriggerAction>,
  ): Promise<T>;
  async getTriggerAction(
    triggerActionId: number,
    select?: ReadonlyArray<keyof ITriggerAction>,
  ) {
    const triggerAction = await (!select || select.length === 0
      ? this.triggerActionsModel.getOne(triggerActionId)
      : this.triggerActionsModel.getOne(triggerActionId, select));
    if (!triggerAction) {
      throw new LogicError(ErrorCode.NOT_FOUND);
    }
    return triggerAction;
  }

  updateTriggerAction(
    triggerActionId: number,
    triggerAction: ITriggerActionChange,
  ): Promise<{}>;
  updateTriggerAction<T extends DeepPartial<ITriggerAction> = DeepPartial<ITriggerAction>>(
    triggerActionId: number,
    triggerAction: ITriggerActionChange,
    select: ReadonlyArray<keyof ITriggerAction>,
  ): Promise<T>;
  async updateTriggerAction(
    triggerActionId: number,
    update: ITriggerActionChange,
    select?: ReadonlyArray<keyof ITriggerAction>,
  ): Promise<DeepPartial<ITriggerAction>> {
    const triggerAction = await (select
      ? this.triggerActionsModel.updateOne(
        triggerActionId,
        update,
        select,
      )
      : this.triggerActionsModel.updateOne(triggerActionId, update));
    if (!triggerAction) {
      throw new LogicError(ErrorCode.NOT_FOUND);
    }
    return triggerAction;
  }

  deleteTriggerAction(triggerActionId: number): Promise<{}>;
  deleteTriggerAction<T extends DeepPartial<ITriggerAction> = DeepPartial<ITriggerAction>>(
    triggerActionId: number,
    select: ReadonlyArray<keyof ITriggerAction>,
  ): Promise<T>;
  async deleteTriggerAction(
    triggerActionId: number,
    select?: ReadonlyArray<keyof ITriggerAction>,
  ): Promise<DeepPartial<ITriggerAction>> {
    const triggerAction = await (select
      ? this.triggerActionsModel.deleteOne(
        triggerActionId,
        select,
      )
      : this.triggerActionsModel.deleteOne(triggerActionId));
    if (!triggerAction) {
      throw new LogicError(ErrorCode.NOT_FOUND);
    }
    return triggerAction;
  }
}
