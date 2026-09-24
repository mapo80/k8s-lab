import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PosizioneCorrente from './PosizioneCorrente'

/** Il percorso e la query string attuali, come li vede il router. */
export function posizione(screen) {
  return screen.getByTestId('posizione').textContent
}

/**
 * Renderizza una pagina dentro un router in memoria, alla rotta indicata.
 * altreRotte: { '/enti/:id': <Segnaposto /> } per verificare una navigazione.
 */
export function renderPagina(elemento, { percorso = '/', rotta = '*', stato, altreRotte = {} } = {}) {
  return render(
    <MemoryRouter initialEntries={[stato ? { pathname: percorso, state: stato } : percorso]}>
      <Routes>
        <Route path={rotta} element={elemento} />
        {Object.entries(altreRotte).map(([path, el]) => (
          <Route key={path} path={path} element={el} />
        ))}
      </Routes>
      <PosizioneCorrente />
    </MemoryRouter>,
  )
}
