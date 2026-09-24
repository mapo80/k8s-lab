import { Navigate, Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar'
import EntiPage from './pages/EntiPage'
import EnteDettaglioPage from './pages/EnteDettaglioPage'
import NuovoEntePage from './pages/NuovoEntePage'
import ProvincePage from './pages/ProvincePage'
import ProvinciaEntiPage from './pages/ProvinciaEntiPage'
import ImportazionePage from './pages/ImportazionePage'
import PaginaInesistente from './pages/PaginaInesistente'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Routes>
          <Route path="/" element={<Navigate to="/enti" replace />} />
          <Route path="/enti" element={<EntiPage />} />
          {/* le rotte statiche vincono su quelle con parametri: /enti/nuovo non è un id */}
          <Route path="/enti/nuovo" element={<NuovoEntePage />} />
          <Route path="/enti/:id" element={<EnteDettaglioPage />} />
          <Route path="/province" element={<ProvincePage />} />
          <Route path="/province/:id" element={<ProvinciaEntiPage />} />
          <Route path="/importazione" element={<ImportazionePage />} />
          <Route path="*" element={<PaginaInesistente />} />
        </Routes>
      </main>
    </div>
  )
}
