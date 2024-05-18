import type { ErrorData, OnlyMethods, Request, ReturnData } from './types'

export function responsable<T>(object: OnlyMethods<T>, self: any = null) {
  listen(self, async (methodName, args) => {
    const method = object[methodName as keyof OnlyMethods<T>]

    if (!method) throw new Error(`Method ${methodName} not found`)
    if (typeof method !== 'function') throw new Error(`Method ${methodName} is not a function`)

    return await method(...args)
  })
}

async function listen(workerSelf: any | null, handler: (method: string, args: any[]) => Promise<any>) {
  const _self = workerSelf || self

  _self.addEventListener('message', async (event: MessageEvent<Request>) => {
    const { method, args, id } = event.data

    try {
      const result = await handler(method, args)

      _self.postMessage(<ReturnData<unknown>>{ return: result, id })
    } catch (error) {
      if ((_self as any).__workerBridgeDebug) console.error('Worker', error)
      _self.postMessage(<ErrorData>{ error: (error as Error).message, id })
    }
  })
}
