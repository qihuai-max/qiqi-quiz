import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/', label: '题库', end: true },
  { to: '/upload', label: '上传出题', end: false },
  { to: '/wrong', label: '错题本', end: false },
  { to: '/stats', label: '统计', end: false },
  { to: '/settings', label: '设置', end: false }
]

export default function AppShell() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-sm font-medium ${
      isActive ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-100'
    }`

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden md:flex flex-col w-56 border-r bg-white p-4 gap-2 fixed h-full">
        <div className="text-lg font-bold text-brand mb-2">七槐刷题</div>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
            {l.label}
          </NavLink>
        ))}
      </aside>

      <main className="flex-1 md:ml-56 pb-16 md:pb-0">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t flex justify-around py-2 z-10">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `text-xs px-2 ${isActive ? 'text-brand font-medium' : 'text-slate-500'}`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
