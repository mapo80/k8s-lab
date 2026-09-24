/**
 * L'ambiente dei test end-to-end: PostgreSQL, la finta sorgente open data e il
 * backend vero, da e2e/docker-compose.yml. Il progetto Compose ha un nome suo,
 * così non tocca lo stack di sviluppo.
 */
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const COMPOSE_FILE = fileURLToPath(new URL('../docker-compose.yml', import.meta.url))
const PROGETTO = 'impianti-e2e'

export const API_E2E = 'http://localhost:18080'

export function compose(...argomenti) {
  execFileSync('docker', ['compose', '-p', PROGETTO, '-f', COMPOSE_FILE, ...argomenti], { stdio: 'inherit' })
}

/** Spegne la finta sorgente open data: il backend risponderà 503 all'import. */
export function spegniSorgente() {
  compose('stop', 'open-data')
}

/** Riaccende la finta sorgente e aspetta che risponda. */
export function accendiSorgente() {
  compose('up', '-d', '--wait', 'open-data')
}
