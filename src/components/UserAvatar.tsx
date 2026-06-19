import { Car } from 'lucide-react'

interface UserAvatarProps {
  nickname: string
  avatar?: string
  isCarOwner?: boolean
  size?: 'sm' | 'md' | 'lg'
  status?: 'not_arrived' | 'arrived' | 'late'
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
}

const statusBorder: Record<string, string> = {
  arrived: 'ring-2 ring-neon-green/60',
  late: 'ring-2 ring-neon-gold/60',
  not_arrived: 'ring-2 ring-gray-600/60',
}

const gradients = [
  'from-pink-500 to-rose-600',
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-green-600',
  'from-rose-500 to-red-600',
]

function getGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradients[Math.abs(hash) % gradients.length]
}

export default function UserAvatar({ nickname, isCarOwner, size = 'md', status }: UserAvatarProps) {
  const border = status ? statusBorder[status] : ''

  return (
    <div className="relative inline-flex flex-col items-center gap-1">
      <div
        className={`relative rounded-full bg-gradient-to-br ${getGradient(nickname)} ${sizeMap[size]} flex items-center justify-center text-white font-bold ${border}`}
      >
        {nickname.slice(0, 1)}
        {isCarOwner && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-neon-pink rounded-full flex items-center justify-center">
            <Car size={8} className="text-white" />
          </div>
        )}
      </div>
      {size !== 'sm' && (
        <span className="text-xs text-gray-400 max-w-[48px] truncate text-center">
          {nickname}
        </span>
      )}
    </div>
  )
}
