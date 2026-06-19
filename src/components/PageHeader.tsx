import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  showBack?: boolean
  right?: React.ReactNode
}

export default function PageHeader({ title, showBack = true, right }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 bg-night-900/90 backdrop-blur-lg border-b border-neon-pink/5">
      <div className="max-w-lg mx-auto flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-night-700 transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-300" />
            </button>
          )}
          <h1 className="font-display text-xl text-white">{title}</h1>
        </div>
        {right && <div>{right}</div>}
      </div>
    </header>
  )
}
