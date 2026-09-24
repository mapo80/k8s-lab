import { compose } from './ambiente.js'

/**
 * Prima di tutti i test: via lo stack precedente, con i suoi dati, e su uno
 * nuovo. Il database sta in tmpfs, quindi ogni esecuzione parte vuota:
 * nessun ente, le sei province della migrazione.
 * --wait aspetta gli healthcheck: il backend risponde quando i test partono.
 */
export default function globalSetup() {
  compose('down', '--volumes', '--remove-orphans')
  compose('up', '-d', '--build', '--wait')
}
