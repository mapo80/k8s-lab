import { Link } from 'react-router-dom'
import StatoVuoto from '../components/StatoVuoto'

export default function PaginaInesistente() {
  return (
    <StatoVuoto titolo="Pagina inesistente">
      <Link to="/enti" className="font-medium text-emerald-700 underline">Torna all'elenco degli enti</Link>
    </StatoVuoto>
  )
}
