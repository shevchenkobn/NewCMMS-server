import { inject, injectable } from 'inversify';
import { Nullable } from '../../@types';
import {
  IUserTrigger,
  UserTriggerHistoryModel,
} from '../../models/user-trigger-history.model';
import { UsersModel } from '../../models/users.model';
import { ErrorCode, LogicError } from '../../services/error.service';

export interface IUserTriggerList {
  userTriggers: IUserTrigger[];
  cursor: Nullable<string>;
}

@injectable()
export class UserTriggerHistoryCommon {
  readonly userTriggerHistoryModel: UserTriggerHistoryModel;
  readonly usersModel: UsersModel;

  constructor(
    @inject(
      UserTriggerHistoryModel,
    ) userTriggerHistoryModel: UserTriggerHistoryModel,
    @inject(UsersModel) usersModel: UsersModel,
  ) {
    this.userTriggerHistoryModel = userTriggerHistoryModel;
    this.usersModel = usersModel;
  }

  async getUserTriggers(userId: number): Promise<IUserTriggerList> {
    if (!await this.usersModel.getOne({ userId })) {
      throw new LogicError(ErrorCode.NOT_FOUND);
    }
    return {
      userTriggers: await this.userTriggerHistoryModel.getList({
        userIds: [userId],
      }),
      cursor: null,
    };
  }

  async getUserTrigger(
    userId: number,
    userTriggerId: number,
  ): Promise<IUserTrigger> {
    const userTrigger = await this.userTriggerHistoryModel.getOne(
      userTriggerId,
      userId,
    );
    if (!userTrigger) {
      throw new LogicError(ErrorCode.NOT_FOUND);
    }
    return userTrigger;
  }

  async deleteUserTrigger(
    userId: number,
    userTriggerId: number,
  ): Promise<IUserTrigger> {
    const userTrigger = await this.userTriggerHistoryModel.deleteOne(
      userTriggerId,
      userId,
    );
    if (!userTrigger) {
      throw new LogicError(ErrorCode.NOT_FOUND);
    }
    return userTrigger;
  }
}
