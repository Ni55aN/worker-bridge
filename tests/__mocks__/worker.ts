class MessageEmitter {
  listeners: any[];

  constructor() {
    this.listeners = [];
  }

  addEventListener(event: any, handler: any) {
    this.listeners.push([event, handler]);
  }

  postMessage(message: any) {
    this.listeners.forEach(([event, handler]) => {
      if (event === 'message') {
        handler({ data: message });
      }
    });
  }

  removeEventListener(event: any, handler: any) {
    this.listeners = this.listeners.filter(([e, h]) => e !== event && h !== handler);
  }
}

class WorkerSelf extends MessageEmitter {
  parent: MockWorker;

  constructor(parent: MockWorker) {
    super();
    this.parent = parent;
  }

  postMessage(message: any): void {
    this.parent.listeners.forEach(([event, handler]) => {
      if (event === 'message') {
        handler({ data: message });
      }
    })
  }
}

export class MockWorker extends MessageEmitter {
  url: string;
  self: WorkerSelf;

  constructor(stringUrl: string) {
    super();
    this.url = stringUrl;
    this.self = new WorkerSelf(this);
  }

  postMessage(message: any): void {
    this.self.listeners.forEach(([event, handler]) => {
      if (event === 'message') {
        handler({ data: message });
      }
    })
  }

  terminate(): void {
    1
  }
}
