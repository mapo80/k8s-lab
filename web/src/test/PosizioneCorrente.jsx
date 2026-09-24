import { useLocation } from 'react-router-dom'

/** Mostra percorso e query string correnti: serve a verificare che lo stato stia nell'URL. */
export default function PosizioneCorrente() {
  const { pathname, search } = useLocation()
  return <div data-testid="posizione" hidden>{pathname}{search}</div>
}
