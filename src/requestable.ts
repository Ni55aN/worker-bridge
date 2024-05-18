import crypto from 'crypto'

import type { ErrorData, OnlyMethods, Options, Request, ReturnData } from './types'

export function requestable<T>(worker: Worker, options: Options = { timeout: 5000 }): OnlyMethods<T> {
  return new Proxy({} as OnlyMethods<T>, {
    get(_, name) {
      return (...args: any[]) => request(worker, options, name as string, ...args)
    },
  })
}

async function request<T>(worker: Worker, options: Options, method: string, ...args: any[]) {
  const id = crypto.randomBytes(16).toString('hex')

  return new Promise((resolve, reject) => {
    const listen = (event: MessageEvent<ReturnData<T> | ErrorData>) => {
      if (event.data.id === id) {
        worker.removeEventListener('message', listen)
        if ('error' in event.data) {
          reject(new Error(event.data.error))
        } else {
          resolve(event.data.return)
        }
        clearTimeout(timer)
      }
    }
    // fail on timeout
    const timer = setTimeout(() => {
      worker.removeEventListener('message', listen)
      worker.terminate()
      reject(new Error('timeout'))
    }, options.timeout)
    worker.postMessage(<Request>{ args, method, id })
    worker.addEventListener('message', listen)
    worker.addEventListener('error', reject)
  })
}
