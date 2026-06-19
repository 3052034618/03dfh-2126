import { useParams, useNavigate } from 'react-router-dom'
import { Car, Users, Fuel, MapPin, Clock, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useStore } from '@/store/useStore'
import PageHeader from '@/components/PageHeader'
import UserAvatar from '@/components/UserAvatar'
import BottomNav from '@/components/BottomNav'

const typeColors: Record<string, string> = {
  '恐怖': 'bg-red-500/20 text-red-400 border-red-500/30',
  '欢乐': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  '情感': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  '硬核': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  '阵营': 'bg-green-500/20 text-green-400 border-green-500/30',
  '机制': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  '还原': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
}

export default function ActivityDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const getActivity = useStore((s) => s.getActivity)
  const activity = getActivity(id || '')

  if (!activity) {
    return (
      <div className="min-h-screen bg-night-900 flex items-center justify-center">
        <p className="text-gray-500">活动不存在</p>
      </div>
    )
  }

  const confirmedCars = activity.carOffers.filter((co) => co.status === 'confirmed').length
  const pendingCars = activity.carOffers.filter((co) => co.status === 'pending').length
  const arrivedCount = activity.players.filter((p) => p.checkinStatus === 'arrived').length
  const typeColor = typeColors[activity.scriptType] || typeColors['硬核']

  return (
    <div className="min-h-screen bg-night-900 pb-20">
      <PageHeader
        title="活动详情"
        right={
          <button
            onClick={() => navigate(`/fleet/${activity.id}`)}
            className="text-neon-pink text-sm font-medium flex items-center gap-1"
          >
            车队分组 <ChevronRight size={14} />
          </button>
        }
      />

      <div className="max-w-lg mx-auto px-4 space-y-4 mt-4">
        <div className="glass-card p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="font-display text-2xl text-white">{activity.title}</h2>
              <p className="text-gray-400 text-sm mt-1">{activity.scriptName}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs border ${typeColor}`}>
              {activity.scriptType}
            </span>
          </div>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-neon-pink/60 shrink-0" />
              <span>{activity.storeName}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-neon-pink/60 shrink-0 opacity-0" />
              <span className="text-gray-500 text-xs">{activity.storeAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-neon-pink/60 shrink-0" />
              <span>{format(new Date(activity.startTime), 'yyyy年M月d日 HH:mm', { locale: zhCN })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={14} className="text-neon-pink/60 shrink-0" />
              <span>{activity.currentPlayers}/{activity.playerCount}人</span>
            </div>
          </div>
          {activity.notes && (
            <p className="mt-3 text-xs text-gray-500 bg-night-700/50 rounded-lg p-3">{activity.notes}</p>
          )}
        </div>

        <div className="glass-card p-4">
          <h3 className="font-display text-lg text-white mb-3 flex items-center gap-2">
            <Car size={18} className="text-neon-pink" />
            车源招募
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-night-700/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{activity.carRecruitment.carsNeeded}</p>
              <p className="text-xs text-gray-400 mt-1">需要车辆</p>
            </div>
            <div className="bg-night-700/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{activity.carRecruitment.seatsPerCar}</p>
              <p className="text-xs text-gray-400 mt-1">每车座位</p>
            </div>
            <div className="bg-night-700/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold gold-text">{activity.carRecruitment.fuelSubsidy}元</p>
              <p className="text-xs text-gray-400 mt-1">油费补贴</p>
            </div>
            <div className="bg-night-700/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-neon-blue">
                {activity.carRecruitment.allowPickup ? '是' : '否'}
              </p>
              <p className="text-xs text-gray-400 mt-1">顺路接人</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-neon-green">
                <CheckCircle size={14} /> 已确认 {confirmedCars}
              </span>
              {pendingCars > 0 && (
                <span className="flex items-center gap-1 text-neon-gold">
                  <AlertCircle size={14} /> 待确认 {pendingCars}
                </span>
              )}
            </div>
          </div>

          {activity.carOffers.length > 0 && (
            <div className="space-y-2 mb-4">
              {activity.carOffers.map((offer) => (
                <div
                  key={offer.id}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    offer.status === 'confirmed'
                      ? 'bg-neon-green/5 border-neon-green/20'
                      : offer.status === 'pending'
                      ? 'bg-neon-gold/5 border-neon-gold/20'
                      : 'bg-night-700/30 border-gray-700/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar nickname={offer.driver.nickname} isCarOwner size="sm" />
                    <div>
                      <p className="text-sm text-white">{offer.driver.nickname}</p>
                      <p className="text-xs text-gray-400">{offer.pickupArea} · 可坐{offer.availableSeats}人{offer.waitAfterGame ? ' · 等散场' : ''}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    offer.status === 'confirmed' ? 'bg-neon-green/20 text-neon-green' :
                    offer.status === 'pending' ? 'bg-neon-gold/20 text-neon-gold' :
                    'bg-gray-600/20 text-gray-500'
                  }`}>
                    {offer.status === 'confirmed' ? '已确认' : offer.status === 'pending' ? '待确认' : '已取消'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => navigate(`/car-offer/${activity.id}`)}
            className="neon-btn w-full flex items-center justify-center gap-2"
          >
            <Car size={18} />
            我可出车
          </button>
        </div>

        <div className="glass-card p-4">
          <h3 className="font-display text-lg text-white mb-3 flex items-center gap-2">
            <Users size={18} className="text-neon-blue" />
            玩家列表
            <span className="text-xs text-gray-500 font-body ml-auto">{arrivedCount}/{activity.players.length} 已到</span>
          </h3>
          <div className="space-y-2">
            {activity.players.map((player, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2 rounded-lg bg-night-700/30"
              >
                <UserAvatar
                  nickname={player.user.nickname}
                  isCarOwner={player.user.isCarOwner}
                  size="sm"
                  status={player.checkinStatus}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">
                    {player.user.nickname}
                    {player.checkinStatus === 'ride_share' && (
                      <span className="ml-2 text-xs text-neon-blue">·网约车</span>
                    )}
                    {player.checkinStatus === 'late' && (
                      <span className="ml-2 text-xs text-neon-gold">·迟到</span>
                    )}
                  </p>
                  {player.pickupArea && (
                    <p className="text-xs text-gray-500">上车: {player.pickupArea}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/fleet/${activity.id}`)}
            className="ghost-btn flex-1 flex items-center justify-center gap-2"
          >
            <Car size={16} /> 查看车队
          </button>
          <button
            onClick={() => navigate(`/checkin/${activity.id}`)}
            className="ghost-btn flex-1 flex items-center justify-center gap-2"
          >
            <MapPin size={16} /> 打卡通知
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
