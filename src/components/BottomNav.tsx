import { useLocation, useNavigate } from 'react-router-dom'
import { Home, PlusCircle, MapPin, User } from 'lucide-react'

const tabs = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/create', icon: PlusCircle, label: '发布' },
  { path: '/checkin/default', icon: MapPin, label: '打卡' },
  { path: '/profile', icon: User, label: '我的' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-night-800/95 backdrop-blur-lg border-t border-neon-pink/10">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = isActive(tab.path)
          const Icon = tab.icon
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all duration-200 ${
                active ? 'text-neon-pink' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon
                size={22}
                className={active ? 'drop-shadow-[0_0_8px_rgba(233,69,96,0.6)]' : ''}
              />
              <span className="text-xs font-medium">{tab.label}</span>
              {active && (
                <div className="absolute top-0 w-8 h-0.5 bg-neon-gradient rounded-full" />
              )}
            </button>
          )
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
