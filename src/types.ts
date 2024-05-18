
export type OnlyMethods<T> = {
  [K in keyof T]-?: T[K] extends (...args: any[]) => any ? T[K] : never
};

export type ID = string
export type ReturnData<T> = { return: T, id: ID }
export type ErrorData = { error: string, id: ID }
export type Request = { args: any[], method: string, id: ID }
export type Options = { timeout: number }
