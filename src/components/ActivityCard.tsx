import { useNavigate } from 'react-router-dom'
import { Car, Users, Clock, Fuel } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { Activity } from '@/types'

const typeColors: Record<string, string> = {
  '恐怖': 'bg-red-500/20 text-red-400 border-red-500/30',
  '欢乐': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  '情感': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  '硬核': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  '阵营': 'bg-green-500/20 text-green-400 border-green-500/30',
  '机制': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  '还原': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
}

const statusLabels: Record<string, { text: string; color: string }> = {
  recruiting: { text: '招募中', color: 'bg-neon-pink/20 text-neon-pink border-neon-pink/30' },
  confirmed: { text: '已确认', color: 'bg-neon-green/20 text-neon-green border-neon-green/30' },
  in_progress: { text: '进行中', color: 'bg-neon-blue/20 text-neon-blue border-neon-blue/30' },
  completed: { text: '已结束', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
}

interface ActivityCardProps {
  activity: Activity
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const navigate = useNavigate()
  const confirmedCars = activity.carOffers.filter((co) => co.status === 'confirmed').length
  const totalCarsNeeded = activity.carRecruitment.carsNeeded
  const status = statusLabels[activity.status] || statusLabels.recruiting
  const typeColor = typeColors[activity.scriptType] || typeColors['硬核']

  return (
    <button
      onClick={() => navigate(`/activity/${activity.id}`)}
      className="w-full text-left glass-card p-4 hover:neon-border transition-all duration-300 hover:-translate-y-0.5 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg text-white truncate group-hover:text-neon-pink transition-colors">
            {activity.title}
          </h3>
          <p className="text-sm text-gray-400 mt-0.5">{activity.scriptName}</p>
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-xs border ${typeColor}`}>
            {activity.scriptType}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs border ${status.color}`}>
            {status.text}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
        <span className="flex items-center gap-1">
          <Clock size={12} className="text-neon-pink/60" />
          {format(new Date(activity.startTime), 'M月d日 HH:mm', { locale: zhCN })}
        </span>
        <span className="flex items-center gap-1">
          <Users size={12} className="text-neon-blue/60" />
          {activity.currentPlayers}/{activity.playerCount}人
        </span>
      </div>

      <p className="text-xs text-gray-500 mb-3 truncate">{activity.storeName}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs">
            <Car size={14} className={confirmedCars >= totalCarsNeeded ? 'text-neon-green' : 'text-neon-gold'} />
            <span className={confirmedCars >= totalCarsNeeded ? 'text-neon-green' : 'text-neon-gold'}>
              {confirmedCars}/{totalCarsNeeded}车
            </span>
          </span>
          {activity.carRecruitment.fuelSubsidy > 0 && (
            <span className="flex items-center gap-1 text-xs gold-text">
              <Fuel size={12} />
              补{activity.carRecruitment.fuelSubsidy}元
            </span>
          )}
        </div>
        {activity.isFriendsOnly && (
          <span className="text-xs text-neon-purple border border-neon-purple/30 px-2 py-0.5 rounded-full">
            熟人局
          </span>
        )}
      </div>
    </button>
  )
}
