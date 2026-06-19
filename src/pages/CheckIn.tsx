import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, CheckCircle, Clock, AlertTriangle, Car, Bell } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useStore } from '@/store/useStore'
import PageHeader from '@/components/PageHeader'
import UserAvatar from '@/components/UserAvatar'

const typeIcons: Record<string, typeof MapPin> = {
  car_offer: Car,
  checkin: CheckCircle,
  change: AlertTriangle,
  late: Clock,
  ride_change: Car,
}

const typeColors: Record<string, string> = {
  car_offer: 'text-neon-pink',
  checkin: 'text-neon-green',
  change: 'text-neon-gold',
  late: 'text-neon-gold',
  ride_change: 'text-neon-blue',
}

const typeDotColors: Record<string, string> = {
  car_offer: 'bg-neon-pink',
  checkin: 'bg-neon-green',
  change: 'bg-neon-gold',
  late: 'bg-neon-gold',
  ride_change: 'bg-neon-blue',
}

export default function CheckIn() {
  const { activityId } = useParams<{ activityId: string }>()
  const navigate = useNavigate()
  const getActivity = useStore((s) => s.getActivity)
  const checkin = useStore((s) => s.checkin)
  const currentUser = useStore((s) => s.currentUser)
  const notifications = useStore((s) => s.notifications)
  const activity = getActivity(activityId || '')

  const activityNotifications = notifications.filter((n) => n.activityId === activityId)
  const sortedNotifications = [...activityNotifications].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  if (!activity) {
    return (
      <div className="min-h-screen bg-night-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <MapPin size={48} className="mx-auto text-gray-600" />
          <p className="text-gray-500">选择一个活动开始打卡</p>
          <button onClick={() => navigate('/')} className="neon-btn">
            查看活动列表
          </button>
        </div>
      </div>
    )
  }

  const arrivedCount = activity.players.filter((p) => p.checkinStatus === 'arrived').length
  const notArrivedPlayers = activity.players.filter((p) => p.checkinStatus === 'not_arrived')
  const isCurrentUserInActivity = activity.players.some((p) => p.user.id === currentUser.id)

  const handleCheckin = () => {
    if (isCurrentUserInActivity) {
      checkin(activity.id, currentUser.id)
    }
  }

  return (
    <div className="min-h-screen bg-night-900 pb-8">
      <PageHeader title="打卡通知" />

      <div className="max-w-lg mx-auto px-4 space-y-4 mt-4">
        <div className="glass-card p-4">
          <h3 className="font-display text-lg text-white mb-2">{activity.title}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MapPin size={12} className="text-neon-pink/60" />
            {activity.storeName}
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg text-white flex items-center gap-2">
              <CheckCircle size={18} className="text-neon-green" />
              集合打卡
            </h3>
            <span className="text-sm text-gray-400">{arrivedCount}/{activity.players.length} 已到</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-neon-green/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-neon-green">{arrivedCount}</p>
              <p className="text-xs text-gray-400">已到</p>
            </div>
            <div className="bg-neon-gold/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-neon-gold">
                {activity.players.filter((p) => p.checkinStatus === 'late').length}
              </p>
              <p className="text-xs text-gray-400">迟到</p>
            </div>
            <div className="bg-gray-600/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-400">{notArrivedPlayers.length}</p>
              <p className="text-xs text-gray-400">未到</p>
            </div>
          </div>

          {isCurrentUserInActivity && (
            <button
              onClick={handleCheckin}
              className="neon-btn w-full flex items-center justify-center gap-2 mb-4"
            >
              <MapPin size={18} /> 我到了，打卡！
            </button>
          )}

          <div className="space-y-2">
            {activity.players.map((player, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-night-700/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    nickname={player.user.nickname}
                    isCarOwner={player.user.isCarOwner}
                    size="sm"
                    status={player.checkinStatus}
                  />
                  <span className="text-sm text-gray-300">{player.user.nickname}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  player.checkinStatus === 'arrived' ? 'bg-neon-green/20 text-neon-green' :
                  player.checkinStatus === 'late' ? 'bg-neon-gold/20 text-neon-gold' :
                  'bg-gray-600/20 text-gray-500'
                }`}>
                  {player.checkinStatus === 'arrived' ? '已到' : player.checkinStatus === 'late' ? '迟到' : '未到'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="font-display text-lg text-white flex items-center gap-2 mb-4">
            <Bell size={18} className="text-neon-gold" />
            变更通知
          </h3>

          {sortedNotifications.length > 0 ? (
            <div className="relative">
              <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-neon-pink via-neon-gold to-neon-blue" />
              <div className="space-y-4">
                {sortedNotifications.map((notification, i) => {
                  const Icon = typeIcons[notification.type] || AlertTriangle
                  const color = typeColors[notification.type] || 'text-gray-400'
                  const dotColor = typeDotColors[notification.type] || 'bg-gray-400'
                  return (
                    <div key={i} className="flex gap-3 relative">
                      <div className={`w-6 h-6 rounded-full ${dotColor}/20 flex items-center justify-center shrink-0 z-10`}>
                        <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                      </div>
                      <div className="flex-1 bg-night-700/30 rounded-xl p-3">
                        <div className="flex items-start gap-2">
                          <Icon size={14} className={`${color} mt-0.5 shrink-0`} />
                          <div className="flex-1">
                            <p className="text-sm text-gray-300">{notification.content}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {format(new Date(notification.timestamp), 'M月d日 HH:mm', { locale: zhCN })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">暂无变更通知</p>
          )}
        </div>
      </div>
    </div>
  )
}
