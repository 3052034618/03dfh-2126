import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Car, Users, MapPin, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react'
import { useStore } from '@/store/useStore'
import PageHeader from '@/components/PageHeader'
import { pickupAreas } from '@/data/mock'

export default function CarOffer() {
  const { activityId } = useParams<{ activityId: string }>()
  const navigate = useNavigate()
  const addCarOffer = useStore((s) => s.addCarOffer)
  const currentUser = useStore((s) => s.currentUser)
  const getActivity = useStore((s) => s.getActivity)
  const activity = getActivity(activityId || '')

  const [pickupArea, setPickupArea] = useState('')
  const [availableSeats, setAvailableSeats] = useState(3)
  const [waitAfterGame, setWaitAfterGame] = useState(true)
  const [notes, setNotes] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  if (!activity) {
    return (
      <div className="min-h-screen bg-night-900 flex items-center justify-center">
        <p className="text-gray-500">活动不存在</p>
      </div>
    )
  }

  const showAreaError = touched.pickupArea && !pickupArea

  const handleSubmit = () => {
    setTouched((t) => ({ ...t, pickupArea: true }))
    if (!pickupArea) return

    const offer = {
      id: `co_${Date.now()}`,
      activityId: activity.id,
      driver: currentUser,
      pickupArea,
      availableSeats,
      waitAfterGame,
      status: 'pending' as const,
      notes,
      createdAt: new Date().toISOString(),
    }

    addCarOffer(offer, pickupArea)
    navigate(`/activity/${activity.id}`)
  }

  return (
    <div className="min-h-screen bg-night-900 pb-8">
      <PageHeader title="我可出车" />

      <div className="max-w-lg mx-auto px-4 space-y-4 mt-4">
        <div className="glass-card p-4 space-y-4">
          <h3 className="font-display text-lg text-white">{activity.title}</h3>
          <p className="text-sm text-gray-400">{activity.scriptName} · {activity.storeName}</p>
        </div>

        <div className={`glass-card p-4 space-y-4 ${showAreaError ? 'border border-red-500/50' : ''}`}>
          <h3 className="font-display text-lg text-white flex items-center gap-2">
            <MapPin size={16} className="text-neon-pink" /> 上车区域
            <span className="text-red-400 text-xs">*</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {pickupAreas.map((area) => (
              <button
                key={area}
                onClick={() => {
                  setPickupArea(area)
                  setTouched((t) => ({ ...t, pickupArea: true }))
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  pickupArea === area
                    ? 'bg-neon-gradient text-white shadow-[0_0_8px_rgba(233,69,96,0.3)]'
                    : 'bg-night-700 text-gray-400 border border-night-500/50 hover:text-gray-200'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
          {showAreaError && (
            <p className="text-xs text-red-400 flex items-center gap-1 animate-fade-in">
              <AlertCircle size={12} /> 请选择你的上车区域
            </p>
          )}
        </div>

        <div className="glass-card p-4 space-y-4">
          <h3 className="font-display text-lg text-white flex items-center gap-2">
            <Users size={16} className="text-neon-blue" /> 出车信息
          </h3>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">可带乘客数（不含司机）</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setAvailableSeats(Math.max(1, availableSeats - 1))} className="w-10 h-10 rounded-full bg-night-700 text-white flex items-center justify-center hover:bg-night-600">-</button>
              <span className="text-xl font-bold text-white w-8 text-center">{availableSeats}</span>
              <button onClick={() => setAvailableSeats(Math.min(6, availableSeats + 1))} className="w-10 h-10 rounded-full bg-night-700 text-white flex items-center justify-center hover:bg-night-600">+</button>
            </div>
            <p className="text-xs text-gray-500 mt-1">即除去你自己，还能坐几个人</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm text-gray-300">是否愿意等散场</label>
              <p className="text-xs text-gray-500">散场后送人回去</p>
            </div>
            <button onClick={() => setWaitAfterGame(!waitAfterGame)} className="text-neon-pink">
              {waitAfterGame ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-gray-600" />}
            </button>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">备注</label>
            <textarea
              className="dark-input min-h-[60px] resize-none"
              placeholder="如：可以等散场，顺路接人..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className={`w-full py-4 text-lg rounded-full font-bold transition-all ${
            pickupArea
              ? 'bg-neon-gradient text-white shadow-[0_4px_16px_rgba(233,69,96,0.3)] hover:shadow-[0_6px_24px_rgba(233,69,96,0.5)]'
              : 'bg-night-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {pickupArea ? '确认出车' : '请先选择上车区域'}
        </button>
      </div>
    </div>
  )
}
