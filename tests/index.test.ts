import { describe, expect, it, jest } from '@jest/globals'

import { requestable, responsable } from '../src'
import { MockWorker } from './__mocks__/worker'

const createWorker = () => ({
  onmessage: jest.fn(),
  onmessageerror: jest.fn(),
  onerror: jest.fn(),
  dispatchEvent: jest.fn(),
  postMessage: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  terminate: jest.fn(),
  prototype: {},
})

function getMessageListener(worker: ReturnType<typeof createWorker>) {
  const messageListener = worker.addEventListener.mock.calls.find(([name]) => name === 'message')
  const handler = messageListener?.[1]

  return handler as ((event: { data: any }) => void)
}

function getMessageId(worker: ReturnType<typeof createWorker>) {
  return (worker.postMessage.mock.calls?.[0]?.[0] as any)?.id
}

describe('requestable', () => {
  it('returns successfully', async () => {
    type A = { call: (a: number) => Promise<number> }
    const worker = createWorker()
    const client = requestable<A>(worker as unknown as Worker)

    const promise = client.call(1)
    const id = getMessageId(worker)

    getMessageListener(worker)({ data: { return: 1, id } })
    expect(await promise).toBe(1)
  })

  it('fails on error', async () => {
    type A = { call: (a: number) => Promise<number> }
    const worker = createWorker()
    const client = requestable<A>(worker as unknown as Worker)

    const promise = client.call(1)
    const id = getMessageId(worker)

    getMessageListener(worker)({ data: { error: 'error', id } })
    await expect(promise).rejects.toThrow('error')
  })

  it('fails and terminates on timeout', async () => {
    type A = { call: (a: number) => Promise<number> }
    const worker = createWorker()
    const client = requestable<A>(worker as unknown as Worker, { timeout: 1 })

    const promise = client.call(1)

    await expect(promise).rejects.toThrow('timeout')
    expect(worker.terminate).toHaveBeenCalled()
  })

  describe('integration with Worker', () => {
    it('returns response', async () => {
      type A = { call: (a: number) => Promise<number> }
      const worker = new MockWorker('')
      const client = requestable<A>(worker as unknown as Worker)

      responsable<A>({
        async call(a) {
          return a * 2
        }
      }, worker.self)

      const result = await client.call(1)
      expect(result).toBe(2)
    })

    it('fails on method not found', async () => {
      type A = { call: (a: number) => Promise<number> }
      const worker = new MockWorker('')
      const client = requestable<A>(worker as unknown as Worker)

      responsable<A>({
        async call(a) {
          return a * 2
        }
      }, worker.self)

      const promise = (client as any).unknown(1)
      await expect(promise).rejects.toThrow('Method unknown not found')
    })

    it('fails on method not a function', async () => {
      type A = { call: (a: number) => Promise<number> }
      const worker = new MockWorker('')
      const client = requestable<A>(worker as unknown as Worker)

      responsable<any>({
        call: 2,
      }, worker.self)

      const promise = (client as any).call(1)
      await expect(promise).rejects.toThrow('Method call is not a function')
    })
  })
})
