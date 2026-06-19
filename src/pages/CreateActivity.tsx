import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, Users, Fuel, MapPin, Clock, ToggleLeft, ToggleRight } from 'lucide-react'
import { useStore } from '@/store/useStore'
import PageHeader from '@/components/PageHeader'
import { mockUsers } from '@/data/mock'

export default function CreateActivity() {
  const navigate = useNavigate()
  const addActivity = useStore((s) => s.addActivity)
  const currentUser = useStore((s) => s.currentUser)

  const [title, setTitle] = useState('')
  const [scriptName, setScriptName] = useState('')
  const [scriptType, setScriptType] = useState('恐怖')
  const [storeName, setStoreName] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [startTime, setStartTime] = useState('')
  const [playerCount, setPlayerCount] = useState(6)
  const [carsNeeded, setCarsNeeded] = useState(2)
  const [seatsPerCar, setSeatsPerCar] = useState(4)
  const [fuelSubsidy, setFuelSubsidy] = useState(30)
  const [allowPickup, setAllowPickup] = useState(true)
  const [isFriendsOnly, setIsFriendsOnly] = useState(false)
  const [notes, setNotes] = useState('')

  const scriptTypes = ['恐怖', '欢乐', '情感', '硬核', '阵营', '机制', '还原']

  const handleSubmit = () => {
    if (!title || !scriptName || !storeName || !startTime) return

    const activity = {
      id: `a_${Date.now()}`,
      title,
      scriptName,
      scriptType,
      storeName,
      storeAddress,
      startTime,
      playerCount,
      currentPlayers: 1,
      organizer: currentUser,
      carRecruitment: { carsNeeded, seatsPerCar, fuelSubsidy, allowPickup },
      players: [{ user: currentUser, checkinStatus: 'not_arrived' as const }],
      carOffers: [],
      fleetGroups: [],
      status: 'recruiting' as const,
      deadline: new Date(new Date(startTime).getTime() - 4 * 60 * 60 * 1000).toISOString(),
      isFriendsOnly,
      notes,
      createdAt: new Date().toISOString(),
    }

    addActivity(activity)
    navigate('/')
  }

  const ToggleSwitch = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)} className="text-neon-pink">
      {value ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-gray-600" />}
    </button>
  )

  return (
    <div className="min-h-screen bg-night-900 pb-20">
      <PageHeader title="创建活动" right={
        <button onClick={handleSubmit} className="neon-btn text-sm py-2 px-4">
          发布
        </button>
      } />

      <div className="max-w-lg mx-auto px-4 space-y-4 mt-4">
        <div className="glass-card p-4 space-y-4">
          <h3 className="font-display text-lg text-white flex items-center gap-2">
            <MapPin size={16} className="text-neon-pink" /> 基本信息
          </h3>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">活动标题</label>
            <input className="dark-input" placeholder="如：周末恐怖本包场" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">剧本名称</label>
            <input className="dark-input" placeholder="剧本名" value={scriptName} onChange={(e) => setScriptName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">剧本类型</label>
            <div className="flex flex-wrap gap-2">
              {scriptTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setScriptType(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    scriptType === t
                      ? 'bg-neon-gradient text-white'
                      : 'bg-night-700 text-gray-400 border border-night-500/50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">店铺名称</label>
            <input className="dark-input" placeholder="如：迷雾剧本杀·大学城店" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">店铺地址</label>
            <input className="dark-input" placeholder="详细地址" value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1"><Clock size={12} /> 开本时间</label>
            <input type="datetime-local" className="dark-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1"><Users size={12} /> 参与人数</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setPlayerCount(Math.max(3, playerCount - 1))} className="w-10 h-10 rounded-full bg-night-700 text-white flex items-center justify-center hover:bg-night-600">-</button>
              <span className="text-xl font-bold text-white w-8 text-center">{playerCount}</span>
              <button onClick={() => setPlayerCount(Math.min(12, playerCount + 1))} className="w-10 h-10 rounded-full bg-night-700 text-white flex items-center justify-center hover:bg-night-600">+</button>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 space-y-4">
          <h3 className="font-display text-lg text-white flex items-center gap-2">
            <Car size={16} className="text-neon-gold" /> 车源招募配置
          </h3>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">需要几辆车</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setCarsNeeded(Math.max(1, carsNeeded - 1))} className="w-10 h-10 rounded-full bg-night-700 text-white flex items-center justify-center hover:bg-night-600">-</button>
              <span className="text-xl font-bold text-white w-8 text-center">{carsNeeded}</span>
              <button onClick={() => setCarsNeeded(Math.min(6, carsNeeded + 1))} className="w-10 h-10 rounded-full bg-night-700 text-white flex items-center justify-center hover:bg-night-600">+</button>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">每车可坐几人</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setSeatsPerCar(Math.max(2, seatsPerCar - 1))} className="w-10 h-10 rounded-full bg-night-700 text-white flex items-center justify-center hover:bg-night-600">-</button>
              <span className="text-xl font-bold text-white w-8 text-center">{seatsPerCar}</span>
              <button onClick={() => setSeatsPerCar(Math.min(7, seatsPerCar + 1))} className="w-10 h-10 rounded-full bg-night-700 text-white flex items-center justify-center hover:bg-night-600">+</button>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1"><Fuel size={12} /> 油费补贴（元/车）</label>
            <input type="number" className="dark-input" value={fuelSubsidy} onChange={(e) => setFuelSubsidy(Number(e.target.value))} />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-300">是否顺路接人</label>
            <ToggleSwitch value={allowPickup} onChange={setAllowPickup} />
          </div>
        </div>

        <div className="glass-card p-4 space-y-4">
          <h3 className="font-display text-lg text-white">高级选项</h3>
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-300">仅限熟人</label>
            <ToggleSwitch value={isFriendsOnly} onChange={setIsFriendsOnly} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">备注</label>
            <textarea className="dark-input min-h-[80px] resize-none" placeholder="活动备注..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <button onClick={handleSubmit} className="neon-btn w-full py-4 text-lg">
          发布活动
        </button>
      </div>
    </div>
  )
}
