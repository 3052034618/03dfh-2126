import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Car, Users, MapPin, Clock, Share2, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useStore } from '@/store/useStore'
import PageHeader from '@/components/PageHeader'
import UserAvatar from '@/components/UserAvatar'

export default function FleetGroup() {
  const { activityId } = useParams<{ activityId: string }>()
  const navigate = useNavigate()
  const getActivity = useStore((s) => s.getActivity)
  const generateFleetGroups = useStore((s) => s.generateFleetGroups)
  const confirmCarOffer = useStore((s) => s.confirmCarOffer)
  const activity = getActivity(activityId || '')
  const [activeTab, setActiveTab] = useState<'outbound' | 'return'>('outbound')
  const [showSharePreview, setShowSharePreview] = useState(false)

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

  const handleGenerate = () => {
    generateFleetGroups(activity.id)
  }

  const handleConfirm = (offerId: string) => {
    confirmCarOffer(activity.id, offerId)
  }

  const generateShareText = () => {
    if (!currentGroup) return ''
    let text = `🚗 ${activity.title} - ${activeTab === 'outbound' ? '去程' : '返程'}车队\n`
    text += `📍 ${currentGroup.meetingPoint}\n`
    text += `⏰ ${format(new Date(currentGroup.departureTime), 'M月d日 HH:mm', { locale: zhCN })}\n\n`
    currentGroup.cars.forEach((car, i) => {
      text += `🚙 ${i + 1}号车 - ${car.driver.nickname}\n`
      text += `   路线: ${car.route}\n`
      if (car.passengers.length > 0) {
        text += `   乘客: ${car.passengers.map((p) => p.nickname).join(', ')}\n`
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
            <h3 className="font-display text-lg gold-text mb-3">待确认车源</h3>
            <div className="space-y-3">
              {pendingOffers.map((offer) => (
                <div key={offer.id} className="flex items-center justify-between bg-night-700/50 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar nickname={offer.driver.nickname} isCarOwner size="sm" />
                    <div>
                      <p className="text-sm text-white">{offer.driver.nickname}</p>
                      <p className="text-xs text-gray-400">{offer.pickupArea} · 可坐{offer.availableSeats}人{offer.waitAfterGame ? ' · 等散场' : ''}</p>
                    </div>
                  </div>
                  <button onClick={() => handleConfirm(offer.id)} className="px-3 py-1.5 bg-neon-green/20 text-neon-green rounded-full text-xs font-medium hover:bg-neon-green/30 transition-colors flex items-center gap-1">
                    <CheckCircle size={12} /> 确认
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activity.fleetGroups.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Car size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 mb-4">还没有生成车队分组</p>
            <p className="text-xs text-gray-500 mb-4">请先确认车源后生成分组</p>
            <button onClick={handleGenerate} className="neon-btn" disabled={activity.carOffers.filter((co) => co.status === 'confirmed').length === 0}>
              生成分组
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

                {currentGroup.cars.map((car, i) => (
                  <div key={i} className="glass-card p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-neon-gradient rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {i + 1}
                      </div>
                      <div className="flex items-center gap-2">
                        <UserAvatar nickname={car.driver.nickname} isCarOwner size="sm" />
                        <div>
                          <p className="text-sm text-white font-medium">{car.driver.nickname}</p>
                          <p className="text-xs text-neon-pink">司机</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 bg-night-700/30 rounded-lg p-2">
                      <Car size={12} className="text-neon-pink/60" />
                      {car.route}
                    </div>
                    {car.passengers.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {car.passengers.map((p, j) => (
                          <div key={j} className="flex items-center gap-1.5 bg-night-700/50 rounded-full px-3 py-1">
                            <Users size={10} className="text-neon-blue/60" />
                            <span className="text-xs text-gray-300">{p.nickname}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex gap-3">
                  <button
                    onClick={handleGenerate}
                    className="ghost-btn flex-1 flex items-center justify-center gap-2"
                  >
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
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowSharePreview(false)}>
          <div className="glass-card p-6 w-full max-w-sm animate-slide-up" onClick={(e) => e.stopPropagation()}>
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
              <button
                onClick={() => setShowSharePreview(false)}
                className="ghost-btn flex-1"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
