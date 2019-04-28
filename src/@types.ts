// NOTE: Make sure to import it in every entry point you have
import 'bluebird-global';

export type Maybe<T> = T | null | undefined;
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export type NullablePartial<T> = {
  [P in keyof T]?: Nullable<T[P]>;
};

export type DeepReadonly<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type DeepNullablePartial<T> = {
  [P in keyof T]?: Nullable<DeepNullablePartial<T[P]>>;
};
