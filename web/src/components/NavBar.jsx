import { NavLink } from 'react-router-dom'

const links = [
  { to: '/enti', label: 'Enti', end: true },
  { to: '/province', label: 'Province' },
  { to: '/enti/nuovo', label: 'Nuovo ente' },
  { to: '/importazione', label: 'Importazione' },
]

function linkClasses({ isActive }) {
  return [
    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-white text-emerald-800 shadow-sm'
      : 'text-emerald-50 hover:bg-white/10 hover:text-white',
  ].join(' ')
}

export default function NavBar() {
  return (
    <header className="bg-gradient-to-r from-emerald-700 via-emerald-700 to-teal-600 shadow-lg">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <NavLink to="/enti" className="flex items-center gap-2 text-white">
          <span className="text-2xl" aria-hidden="true">🏟️</span>
          <span className="text-lg font-bold tracking-tight">Impianti sportivi in Puglia</span>
        </NavLink>
        <div className="flex flex-wrap gap-1">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClasses}>
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  )
}
