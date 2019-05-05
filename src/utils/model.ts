import { ErrorCode, LogicError } from '../services/error.service';

export function generateCursor() {
  
}

export function assertSortFields(sortFields: ReadonlyArray<string>) {
  const found = new Set<string>();
  for (const sortField of sortFields) {
    const field = sortField.slice(1);
    if (found.has(field)) {
      throw new LogicError(ErrorCode.SORT_BAD);
    }
    found.add(field);
  }
}
