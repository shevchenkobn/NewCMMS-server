import { Maybe } from '../@types';
import { oc } from 'ts-optchain';
import { logger } from './logger.service';

class ListNode {
  // prev: Maybe<Node>;
  next: Maybe<ListNode>;
  handler: Function;

  constructor(handler: Function/*, prev?: Node*/, next?: ListNode) {
    this.handler = handler;
    this.next = next;
  }
}

class List {
  head: Maybe<ListNode>;
  tail: Maybe<ListNode>;
  private _length: number;

  get length() {
    return this._length;
  }

  constructor(head?: Maybe<ListNode>) {
    this.head = head;
    this._length = head ? 1 : 0;
  }

  add(node: ListNode, unshift = false) {
    if (!this.head) {
      this.tail = this.head = node;
    } else if (unshift) {
      node.next = this.head;
      this.head = node;
    } else {
      this.tail!.next = node;
    }
    this._length += 1;
  }

  remove(handler: Function) {
    if (this._length === 0) {
      return false;
    }
    if (this.head!.handler === handler) {
      this.head = this.tail = null;
      return true;
    }
    let prev = this.head!;
    while (prev.next) {
      if (prev.next.handler === handler) {
        prev.next = prev.next.next;
        this._length -= 1;
        return true;
      }
      prev = prev.next;
    }
    return false;
  }

  *[Symbol.iterator]() {
    let prev = this.head;
    while (prev) {
      yield prev.handler;
      prev = prev.next;
    }
  }
}

const list = new List();
let onSignalHandler: Maybe<NodeJS.SignalsListener> = null;
let errorHandler: Maybe<(err: any, p?: Promise<any>) => void> = null;

export function bindOnExitHandler(handler: Function, unshift = false) {
  list.add(new ListNode(handler), unshift);
  if (!onSignalHandler) {
    initListeners();
  }
}

export function unbindOnExitHandler(handler: Function) {
  list.remove(handler);
  if (list.length === 0) {
    removeListeners();
  }
}

function initListeners() {
  onSignalHandler = signal => {
    execHandlers().catch((err) => {
      logger.error(err);
      process.exit(1);
    }).then(() => {
      process.emit(signal, signal);
    });
  };
  process.once('SIGINT', onSignalHandler);
  process.once('SIGTERM', onSignalHandler);
  process.once('SIGQUIT', onSignalHandler);
  process.once('SIGHUP', onSignalHandler);
  process.once('SIGBREAK', onSignalHandler);
  errorHandler = (err, p) => {
    logger.error(
      p ? `Unhandled promise rejection for ${p}` : 'Unhandled exception!',
    );
    logger.error(err);
    execHandlers().catch(err => {
      logger.error('The process is not shut down gracefully! Error while error handling.');
      logger.error(err);
    }).finally(() => {
      process.exit(1);
    });
  };
  process.once('uncaughtException', errorHandler);
  process.once('unhandledRejection', errorHandler);
}

function removeListeners() {
  if (onSignalHandler) {
    process.off('SIGINT', onSignalHandler);
    process.off('SIGTERM', onSignalHandler);
    process.off('SIGQUIT', onSignalHandler);
    process.off('SIGHUP', onSignalHandler);
    process.off('SIGBREAK', onSignalHandler);
  }
  if (errorHandler) {
    process.off('uncaughtException', errorHandler);
    process.off('unhandledRejection', errorHandler);
  }
  onSignalHandler = null;
  errorHandler = null;
}

async function execHandlers() {
  setTimeout(() => {
    logger.error('The process exited due to too long wait for exit handlers!');
    process.exit(1);
  }, 1000);
  logger.info('The process is running exit handlers...');
  for (const handler of list) {
    await handler();
  }
}
