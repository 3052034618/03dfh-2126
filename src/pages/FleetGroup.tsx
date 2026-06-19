import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Car,
  Users,
  MapPin,
  Clock,
  Share2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  MoveRight,
  UserMinus,
  Save,
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useStore } from '@/store/useStore'
import PageHeader from '@/components/PageHeader'
import UserAvatar from '@/components/UserAvatar'
import { pickupAreas } from '@/data/mock'
import type { FleetPassenger } from '@/types'

export default function FleetGroup() {
  const { activityId } = useParams<{ activityId: string }>()
  const navigate = useNavigate()
  const getActivity = useStore((s) => s.getActivity)
  const generateFleetGroups = useStore((s) => s.generateFleetGroups)
  const confirmCarOffer = useStore((s) => s.confirmCarOffer)
  const updatePlayerPickupArea = useStore((s) => s.updatePlayerPickupArea)
  const movePassenger = useStore((s) => s.movePassenger)
  const activity = getActivity(activityId || '')

  const [activeTab, setActiveTab] = useState<'outbound' | 'return'>('outbound')
  const [showSharePreview, setShowSharePreview] = useState(false)
  const [expandPlayers, setExpandPlayers] = useState(true)
  const [moveTarget, setMoveTarget] = useState<{
    passenger: FleetPassenger
    fromCarOfferId: string
  } | null>(null)

  if (!activity) {
    return (
      <div className="min-h-screen bg-night-900 flex items-center justify-center">
        <p className="text-gray-500">活动不存在</p>
      </div>
    )
  }

  const outboundGroup = activity.fleetGroups.find((fg) => fg.type === 'outbound')
  const returnGroup = activity.fleetGroups.find((fg) => fg.type === 'return')
  const currentGroup = activeTab === 'outbound' ? outboundGroup : returnGroup
  const pendingOffers = activity.carOffers.filter((co) => co.status === 'pending')
  const playersWithNoCar = activity.players.filter(
    (p) => !activity.carOffers.some((co) => co.driver.id === p.user.id)
  )

  const getCarOffer = (carOfferId: string) =>
    activity.carOffers.find((co) => co.id === carOfferId)

  const getRemainingSeats = (carOfferId: string, passengerCount: number) => {
    const offer = getCarOffer(carOfferId)
    if (!offer) return 0
    return offer.availableSeats - passengerCount
  }

  const handleGenerate = () => {
    generateFleetGroups(activity.id)
  }

  const handleConfirm = (offerId: string) => {
    confirmCarOffer(activity.id, offerId)
  }

  const handleMoveClick = (
    passenger: FleetPassenger,
    fromCarOfferId: string
  ) => {
    setMoveTarget({ passenger, fromCarOfferId })
  }

  const handleMoveConfirm = (toCarOfferId: string) => {
    if (!moveTarget) return
    movePassenger(
      activity.id,
      activeTab,
      moveTarget.passenger.user.id,
      moveTarget.fromCarOfferId,
      toCarOfferId
    )
    setMoveTarget(null)
  }

  const generateShareText = () => {
    if (!currentGroup) return ''
    let text = `🚗 ${activity.title} - ${activeTab === 'outbound' ? '去程' : '返程'}车队\n`
    text += `📍 ${currentGroup.meetingPoint}\n`
    text += `⏰ ${format(new Date(currentGroup.departureTime), 'M月d日 HH:mm', { locale: zhCN })}\n\n`
    currentGroup.cars.forEach((car, i) => {
      const allAreas = Array.from(
        new Set([car.driverPickupArea, ...car.passengers.map((p) => p.pickupArea)])
      )
      text += `🚙 ${i + 1}号车 - ${car.driver.nickname}\n`
      text += `   接人区域: ${allAreas.join('、')}\n`
      text += `   路线: ${car.route}\n`
      if (car.passengers.length > 0) {
        text += `   乘客: ${car.passengers.map((p) => `${p.user.nickname}(${p.pickupArea})`).join('、')}\n`
      } else {
        text += `   乘客: 无\n`
      }
      text += '\n'
    })
    return text
  }

  return (
    <div className="min-h-screen bg-night-900 pb-8">
      <PageHeader title="车队分组" />

      <div className="max-w-lg mx-auto px-4 space-y-4 mt-4">
        <div className="glass-card p-4">
          <h3 className="font-display text-lg text-white mb-2">{activity.title}</h3>
          <p className="text-sm text-gray-400">{activity.storeName}</p>
        </div>

        {pendingOffers.length > 0 && (
          <div className="glass-card p-4 border-neon-gold/30">
            <h3 className="font-display text-lg gold-text mb-3 flex items-center gap-2">
              <AlertCircle size={16} /> 待确认车源
            </h3>
            <div className="space-y-3">
              {pendingOffers.map((offer) => (
                <div key={offer.id} className="flex items-center justify-between bg-night-700/50 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar nickname={offer.driver.nickname} isCarOwner size="sm" />
                    <div>
                      <p className="text-sm text-white">{offer.driver.nickname}</p>
                      <p className="text-xs text-gray-400">
                        {offer.pickupArea} · 可坐{offer.availableSeats}人{offer.waitAfterGame ? ' · 等散场' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConfirm(offer.id)}
                    className="px-3 py-1.5 bg-neon-green/20 text-neon-green rounded-full text-xs font-medium hover:bg-neon-green/30 transition-colors flex items-center gap-1"
                  >
                    <CheckCircle size={12} /> 确认
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass-card p-4">
          <button
            onClick={() => setExpandPlayers(!expandPlayers)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="font-display text-lg text-white flex items-center gap-2">
              <Users size={16} className="text-neon-blue" /> 玩家上车区域
              <span className="text-xs text-gray-500 font-body">({playersWithNoCar.length}人)</span>
            </h3>
            {expandPlayers ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </button>
          {expandPlayers && (
            <div className="mt-3 space-y-2">
              {playersWithNoCar.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-night-700/40 rounded-xl">
                  <div className="flex items-center gap-2">
                    <UserAvatar nickname={p.user.nickname} isCarOwner={p.user.isCarOwner} size="sm" status={p.checkinStatus} />
                    <span className="text-sm text-gray-200">{p.user.nickname}</span>
                  </div>
                  <select
                    value={p.pickupArea || ''}
                    onChange={(e) => updatePlayerPickupArea(activity.id, p.user.id, e.target.value)}
                    className="bg-night-800 text-xs text-neon-gold border border-neon-pink/20 rounded-lg px-2 py-1 focus:outline-none focus:border-neon-pink"
                  >
                    <option value="">选择区域</option>
                    {pickupAreas.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        {activity.fleetGroups.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Car size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 mb-4">还没有生成车队分组</p>
            <p className="text-xs text-gray-500 mb-4">确认车源并为玩家设置上车区域后自动排车</p>
            <button
              onClick={handleGenerate}
              disabled={activity.carOffers.filter((co) => co.status === 'confirmed').length === 0}
              className="neon-btn"
            >
              按区域生成分组
            </button>
          </div>
        ) : (
          <>
            <div className="flex bg-night-800 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('outbound')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'outbound' ? 'bg-neon-gradient text-white' : 'text-gray-400'
                }`}
              >
                <ArrowRight size={14} /> 去程车队
              </button>
              <button
                onClick={() => setActiveTab('return')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'return' ? 'bg-neon-blue/30 text-neon-blue border border-neon-blue/30' : 'text-gray-400'
                }`}
              >
                <ArrowLeft size={14} /> 返程车队
              </button>
            </div>

            {currentGroup ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-300 bg-night-800/50 rounded-xl p-3">
                  <MapPin size={14} className="text-neon-pink shrink-0" />
                  <span>集合点: {currentGroup.meetingPoint}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300 bg-night-800/50 rounded-xl p-3">
                  <Clock size={14} className="text-neon-pink shrink-0" />
                  <span>出发: {format(new Date(currentGroup.departureTime), 'M月d日 HH:mm', { locale: zhCN })}</span>
                </div>

                {currentGroup.cars.map((car, i) => {
                  const carOffer = getCarOffer(car.carOfferId)
                  const remaining = carOffer ? carOffer.availableSeats - car.passengers.length : 0
                  const isOverload = remaining < 0
                  return (
                    <div key={i} className={`glass-card p-4 ${isOverload ? 'border-red-500/50' : ''}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-neon-gradient rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {i + 1}
                          </div>
                          <div className="flex items-center gap-2">
                            <UserAvatar nickname={car.driver.nickname} isCarOwner size="sm" />
                            <div>
                              <p className="text-sm text-white font-medium">{car.driver.nickname}</p>
                              <p className="text-xs text-neon-pink">司机 · {car.driverPickupArea}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-medium ${remaining > 0 ? 'text-neon-green' : remaining === 0 ? 'text-neon-gold' : 'text-red-400'}`}>
                            剩 {remaining} 座
                          </p>
                          <p className="text-xs text-gray-500">
                            {car.passengers.length}/{carOffer?.availableSeats || 0}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-400 bg-night-700/30 rounded-lg p-2 mb-2">
                        <Car size={12} className="text-neon-pink/60 shrink-0" />
                        {car.route}
                      </div>

                      <div className="flex items-center gap-2 text-xs gold-text bg-neon-gold/10 rounded-lg p-2 border border-neon-gold/20 mb-3">
                        <MapPin size={12} /> 接人顺序: 
                        {activeTab === 'outbound'
                          ? car.route.split(' → ').slice(0, -1).join(' → ')
                          : car.route.split(' → ').slice(1).join(' → ')}
                      </div>

                      {car.passengers.length > 0 ? (
                        <div className="space-y-1.5">
                          {car.passengers.map((p, j) => (
                            <div
                              key={j}
                              className="flex items-center justify-between bg-night-700/50 rounded-lg px-3 py-2 group"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-neon-gold w-5">{j + 1}</span>
                                <Users size={10} className="text-neon-blue/60" />
                                <span className="text-xs text-gray-300">{p.user.nickname}</span>
                                <span className="text-xs text-neon-gold/70">({p.pickupArea})</span>
                              </div>
                              <button
                                onClick={() => handleMoveClick(p, car.carOfferId)}
                                className="text-gray-500 hover:text-neon-pink transition-colors opacity-0 group-hover:opacity-100"
                                title="移动到其他车"
                              >
                                <MoveRight size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 text-center py-2">暂无乘客</p>
                      )}
                    </div>
                  )
                })}

                <div className="flex gap-3">
                  <button onClick={handleGenerate} className="ghost-btn flex-1 flex items-center justify-center gap-2">
                    重新分组
                  </button>
                  <button
                    onClick={() => setShowSharePreview(true)}
                    className="neon-btn flex-1 flex items-center justify-center gap-2"
                  >
                    <Share2 size={16} /> 一键分享
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-card p-8 text-center">
                <p className="text-gray-500">
                  {activeTab === 'return' ? '暂无返程车队（无车主愿意等散场）' : '暂无去程车队'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {showSharePreview && currentGroup && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setShowSharePreview(false)}
        >
          <div
            className="glass-card p-6 w-full max-w-sm animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl text-white mb-4">分享车队名单</h3>
            <div className="bg-night-700/50 rounded-xl p-4 text-sm text-gray-300 whitespace-pre-line max-h-60 overflow-y-auto">
              {generateShareText()}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateShareText())
                }}
                className="neon-btn flex-1"
              >
                复制文字
              </button>
              <button onClick={() => setShowSharePreview(false)} className="ghost-btn flex-1">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {moveTarget && currentGroup && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center sm:items-center"
          onClick={() => setMoveTarget(null)}
        >
          <div
            className="glass-card p-5 w-full max-w-lg animate-slide-up sm:rounded-2xl rounded-t-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg text-white mb-1">移动乘客</h3>
            <p className="text-sm text-gray-400 mb-4">
              将 <span className="text-neon-pink">{moveTarget.passenger.user.nickname}</span> 移动到哪辆车？
            </p>
            <div className="space-y-2">
              {currentGroup.cars
                .filter((c) => c.carOfferId !== moveTarget.fromCarOfferId)
                .map((car, idx) => {
                  const carOffer = getCarOffer(car.carOfferId)
                  const remaining = carOffer ? carOffer.availableSeats - car.passengers.length : 0
                  const canMove = remaining > 0
                  return (
                    <button
                      key={car.carOfferId}
                      onClick={() => canMove && handleMoveConfirm(car.carOfferId)}
                      disabled={!canMove}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                        canMove
                          ? 'bg-night-700/70 hover:bg-night-600/70 text-white'
                          : 'bg-night-800/50 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-neon-gradient rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {idx + 1}
                        </div>
                        <span className="text-sm">{car.driver.nickname} 的车</span>
                      </div>
                      <span className={`text-xs ${canMove ? 'text-neon-green' : 'text-gray-600'}`}>
                        剩 {remaining} 座
                        {!canMove && ' · 满员'}
                      </span>
                    </button>
                  )
                })}
            </div>
            <button
              onClick={() => setMoveTarget(null)}
              className="ghost-btn w-full mt-4"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
