import { ReteOptions } from 'rete-cli'

export default <ReteOptions>{
  input: 'src/index.ts',
  name: 'WorkerBridge',
  globals: {
    crypto: 'crypto',
  },
}
