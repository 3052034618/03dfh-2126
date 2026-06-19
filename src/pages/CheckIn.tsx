import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MapPin, CheckCircle, Clock, AlertTriangle, Car, Bell, CarFront, X,
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useStore } from '@/store/useStore'
import PageHeader from '@/components/PageHeader'
import UserAvatar from '@/components/UserAvatar'
import type { CheckinStatus, Player } from '@/types'

const typeIcons: Record<string, typeof MapPin> = {
  car_offer: Car,
  checkin: CheckCircle,
  change: AlertTriangle,
  late: Clock,
  ride_change: CarFront,
  restore: AlertTriangle,
}

const typeColors: Record<string, string> = {
  car_offer: 'text-neon-pink',
  checkin: 'text-neon-green',
  change: 'text-neon-gold',
  late: 'text-neon-gold',
  ride_change: 'text-neon-blue',
  restore: 'text-gray-400',
}

const typeDotColors: Record<string, string> = {
  car_offer: 'bg-neon-pink',
  checkin: 'bg-neon-green',
  change: 'bg-neon-gold',
  late: 'bg-neon-gold',
  ride_change: 'bg-neon-blue',
  restore: 'bg-gray-500',
}

const statusLabels: Record<CheckinStatus, { label: string; cls: string }> = {
  not_arrived: { label: '未到', cls: 'bg-gray-600/20 text-gray-500' },
  arrived: { label: '已到', cls: 'bg-neon-green/20 text-neon-green' },
  late: { label: '迟到', cls: 'bg-neon-gold/20 text-neon-gold' },
  ride_share: { label: '网约车', cls: 'bg-neon-blue/20 text-neon-blue' },
}

export default function CheckIn() {
  const { activityId } = useParams<{ activityId: string }>()
  const navigate = useNavigate()
  const getActivity = useStore((s) => s.getActivity)
  const checkin = useStore((s) => s.checkin)
  const setPlayerStatus = useStore((s) => s.setPlayerStatus)
  const currentUser = useStore((s) => s.currentUser)
  const notifications = useStore((s) => s.notifications)
  const activity = getActivity(activityId || '')
  const [menuPlayer, setMenuPlayer] = useState<Player | null>(null)

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
  const lateCount = activity.players.filter((p) => p.checkinStatus === 'late').length
  const rideShareCount = activity.players.filter((p) => p.checkinStatus === 'ride_share').length
  const notArrivedCount = activity.players.filter((p) => p.checkinStatus === 'not_arrived').length
  const isCurrentUserInActivity = activity.players.some((p) => p.user.id === currentUser.id)

  const handleCheckin = () => {
    if (isCurrentUserInActivity) {
      checkin(activity.id, currentUser.id)
    }
  }

  const applyStatus = (status: CheckinStatus) => {
    if (!menuPlayer) return
    setPlayerStatus(activity.id, menuPlayer.user.id, status)
    setMenuPlayer(null)
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
            <span className="text-sm text-gray-400">
              {arrivedCount}/{activity.players.length} 已到
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-neon-green/10 rounded-xl p-2.5 text-center">
              <p className="text-xl font-bold text-neon-green">{arrivedCount}</p>
              <p className="text-[10px] text-gray-400">已到</p>
            </div>
            <div className="bg-neon-gold/10 rounded-xl p-2.5 text-center">
              <p className="text-xl font-bold text-neon-gold">{lateCount}</p>
              <p className="text-[10px] text-gray-400">迟到</p>
            </div>
            <div className="bg-neon-blue/10 rounded-xl p-2.5 text-center">
              <p className="text-xl font-bold text-neon-blue">{rideShareCount}</p>
              <p className="text-[10px] text-gray-400">网约车</p>
            </div>
            <div className="bg-gray-600/10 rounded-xl p-2.5 text-center">
              <p className="text-xl font-bold text-gray-400">{notArrivedCount}</p>
              <p className="text-[10px] text-gray-400">未到</p>
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
              <button
                key={i}
                onClick={() => setMenuPlayer(player)}
                className="w-full text-left flex items-center justify-between p-2.5 bg-night-700/30 rounded-xl hover:bg-night-700/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar
                    nickname={player.user.nickname}
                    isCarOwner={player.user.isCarOwner}
                    size="sm"
                    status={player.checkinStatus}
                  />
                  <div>
                    <span className="text-sm text-gray-200">{player.user.nickname}</span>
                    {player.pickupArea && (
                      <p className="text-[10px] text-gray-500">{player.pickupArea}</p>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusLabels[player.checkinStatus].cls}`}>
                  {statusLabels[player.checkinStatus].label}
                </span>
              </button>
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
                      <div
                        className={`w-6 h-6 rounded-full ${dotColor}/20 flex items-center justify-center shrink-0 z-10`}
                      >
                        <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                      </div>
                      <div className="flex-1 bg-night-700/30 rounded-xl p-3">
                        <div className="flex items-start gap-2">
                          <Icon size={14} className={`${color} mt-0.5 shrink-0`} />
                          <div className="flex-1">
                            <p className="text-sm text-gray-300">{notification.content}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {format(new Date(notification.timestamp), 'M月d日 HH:mm', {
                                locale: zhCN,
                              })}
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

      {menuPlayer && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-end"
          onClick={() => setMenuPlayer(null)}
        >
          <div
            className="w-full bg-night-800 border-t border-neon-pink/20 rounded-t-3xl p-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <UserAvatar
                  nickname={menuPlayer.user.nickname}
                  isCarOwner={menuPlayer.user.isCarOwner}
                  status={menuPlayer.checkinStatus}
                />
                <div>
                  <p className="text-white font-medium">{menuPlayer.user.nickname}</p>
                  <p className="text-xs text-gray-500">
                    当前状态：{statusLabels[menuPlayer.checkinStatus].label}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMenuPlayer(null)}
                className="w-8 h-8 rounded-full bg-night-700 flex items-center justify-center"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-3">选择要设置的状态：</p>
            <div className="space-y-2">
              <button
                onClick={() => applyStatus('arrived')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                  menuPlayer.checkinStatus === 'arrived'
                    ? 'bg-neon-green/20 border border-neon-green/40'
                    : 'bg-night-700/50 hover:bg-night-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-neon-green" />
                  <span className="text-gray-200 text-sm">标记已到</span>
                </div>
                {menuPlayer.checkinStatus === 'arrived' && (
                  <CheckCircle size={16} className="text-neon-green" />
                )}
              </button>

              <button
                onClick={() => applyStatus('late')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                  menuPlayer.checkinStatus === 'late'
                    ? 'bg-neon-gold/20 border border-neon-gold/40'
                    : 'bg-night-700/50 hover:bg-night-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-neon-gold" />
                  <span className="text-gray-200 text-sm">标记迟到</span>
                </div>
                {menuPlayer.checkinStatus === 'late' && (
                  <CheckCircle size={16} className="text-neon-gold" />
                )}
              </button>

              <button
                onClick={() => applyStatus('ride_share')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                  menuPlayer.checkinStatus === 'ride_share'
                    ? 'bg-neon-blue/20 border border-neon-blue/40'
                    : 'bg-night-700/50 hover:bg-night-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CarFront size={16} className="text-neon-blue" />
                  <span className="text-gray-200 text-sm">改坐网约车</span>
                </div>
                {menuPlayer.checkinStatus === 'ride_share' && (
                  <CheckCircle size={16} className="text-neon-blue" />
                )}
              </button>

              <button
                onClick={() => applyStatus('not_arrived')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                  menuPlayer.checkinStatus === 'not_arrived'
                    ? 'bg-gray-500/20 border border-gray-500/40'
                    : 'bg-night-700/50 hover:bg-night-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-gray-400" />
                  <span className="text-gray-200 text-sm">恢复未到</span>
                </div>
                {menuPlayer.checkinStatus === 'not_arrived' && (
                  <CheckCircle size={16} className="text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
