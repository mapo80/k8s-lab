import { compose } from './ambiente.js'

/** Dopo i test si spegne tutto; con E2E_MANTIENI=1 lo stack resta su per guardarci dentro. */
export default function globalTeardown() {
  if (process.env.E2E_MANTIENI) return
  compose('down', '--volumes', '--remove-orphans')
}
