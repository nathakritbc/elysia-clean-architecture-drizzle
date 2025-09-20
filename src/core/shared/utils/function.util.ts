export type OmitFunctions<T> = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};
export type PartialWithRequired<T, K extends keyof T> = Partial<Omit<T, K>> & Required<Pick<T, K>>;
