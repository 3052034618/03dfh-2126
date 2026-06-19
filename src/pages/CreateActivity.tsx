import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, Users, Fuel, MapPin, Clock, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react'
import { useStore } from '@/store/useStore'
import PageHeader from '@/components/PageHeader'

type FieldErrors = Record<string, string>

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
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const scriptTypes = ['恐怖', '欢乐', '情感', '硬核', '阵营', '机制', '还原']

  const validate = useMemo(() => {
    const e: FieldErrors = {}
    if (!title.trim()) e.title = '请填写活动标题'
    if (!scriptName.trim()) e.scriptName = '请填写剧本名称'
    if (!storeName.trim()) e.storeName = '请填写店铺名称'
    if (!startTime) e.startTime = '请选择开本时间'
    return e
  }, [title, scriptName, storeName, startTime])

  const hasErrors = Object.keys(validate).length > 0

  const touch = (field: string) => setTouched((t) => ({ ...t, [field]: true }))

  const showErr = (field: string) => touched[field] && validate[field]

  const fieldCls = (field: string) =>
    `dark-input ${showErr(field) ? '!border-red-500/60 !ring-1 !ring-red-500/30' : ''}`

  const ErrorTip = ({ field }: { field: string }) =>
    showErr(field) ? (
      <p className="mt-1 text-xs text-red-400 flex items-center gap-1 animate-fade-in">
        <AlertCircle size={12} /> {validate[field]}
      </p>
    ) : null

  const ToggleSwitch = ({
    value,
    onChange,
  }: {
    value: boolean
    onChange: (v: boolean) => void
  }) => (
    <button onClick={() => onChange(!value)} className="text-neon-pink">
      {value ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-gray-600" />}
    </button>
  )

  const handleSubmit = () => {
    setTouched({
      title: true,
      scriptName: true,
      storeName: true,
      startTime: true,
    })
    if (hasErrors) return

    const activity = {
      id: `a_${Date.now()}`,
      title,
      scriptName,
      scriptType,
      storeName,
      storeAddress,
      startTime,
      playerCount,
      maxPlayers: playerCount,
      currentPlayers: 1,
      organizer: currentUser,
      carRecruitment: { carsNeeded, seatsPerCar, fuelSubsidy, allowPickup },
      players: [{ user: currentUser, checkinStatus: 'not_arrived' as const }],
      carOffers: [],
      fleetGroups: [],
      reminderBatches: [],
      status: 'recruiting' as const,
      deadline: new Date(new Date(startTime).getTime() - 4 * 60 * 60 * 1000).toISOString(),
      isFriendsOnly,
      notes,
      createdAt: new Date().toISOString(),
    }

    const newId = addActivity(activity)
    navigate(`/activity/${newId}`)
  }

  return (
    <div className="min-h-screen bg-night-900 pb-20">
      <PageHeader
        title="创建活动"
        right={
          <button
            onClick={handleSubmit}
            className="neon-btn text-sm py-2 px-4"
          >
            发布
          </button>
        }
      />

      <div className="max-w-lg mx-auto px-4 space-y-4 mt-4">
        {hasErrors && Object.values(touched).some(Boolean) && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-2 animate-fade-in">
            <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-300">
              有 {Object.keys(validate).length} 项必填信息待填写
            </p>
          </div>
        )}

        <div className="glass-card p-4 space-y-4">
          <h3 className="font-display text-lg text-white flex items-center gap-2">
            <MapPin size={16} className="text-neon-pink" /> 基本信息
          </h3>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              活动标题 <span className="text-red-400">*</span>
            </label>
            <input
              className={fieldCls('title')}
              placeholder="如：周末恐怖本包场"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => touch('title')}
            />
            <ErrorTip field="title" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              剧本名称 <span className="text-red-400">*</span>
            </label>
            <input
              className={fieldCls('scriptName')}
              placeholder="剧本名"
              value={scriptName}
              onChange={(e) => setScriptName(e.target.value)}
              onBlur={() => touch('scriptName')}
            />
            <ErrorTip field="scriptName" />
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
            <label className="text-xs text-gray-400 mb-1 block">
              店铺名称 <span className="text-red-400">*</span>
            </label>
            <input
              className={fieldCls('storeName')}
              placeholder="如：迷雾剧本杀·大学城店"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              onBlur={() => touch('storeName')}
            />
            <ErrorTip field="storeName" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">店铺地址</label>
            <input
              className="dark-input"
              placeholder="详细地址（选填）"
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1">
              <Clock size={12} /> 开本时间 <span className="text-red-400">*</span>
            </label>
            <input
              type="datetime-local"
              className={fieldCls('startTime')}
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value)
                touch('startTime')
              }}
              onBlur={() => touch('startTime')}
            />
            <ErrorTip field="startTime" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1">
              <Users size={12} /> 参与人数
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPlayerCount(Math.max(3, playerCount - 1))}
                className="w-10 h-10 rounded-full bg-night-700 text-white flex items-center justify-center hover:bg-night-600"
              >
                -
              </button>
              <span className="text-xl font-bold text-white w-8 text-center">{playerCount}</span>
              <button
                onClick={() => setPlayerCount(Math.min(12, playerCount + 1))}
                className="w-10 h-10 rounded-full bg-night-700 text-white flex items-center justify-center hover:bg-night-600"
              >
                +
              </button>
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
              <button
                onClick={() => setCarsNeeded(Math.max(1, carsNeeded - 1))}
                className="w-10 h-10 rounded-full bg-night-700 text-white flex items-center justify-center hover:bg-night-600"
              >
                -
              </button>
              <span className="text-xl font-bold text-white w-8 text-center">{carsNeeded}</span>
              <button
                onClick={() => setCarsNeeded(Math.min(6, carsNeeded + 1))}
                className="w-10 h-10 rounded-full bg-night-700 text-white flex items-center justify-center hover:bg-night-600"
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">每车可坐几人</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSeatsPerCar(Math.max(2, seatsPerCar - 1))}
                className="w-10 h-10 rounded-full bg-night-700 text-white flex items-center justify-center hover:bg-night-600"
              >
                -
              </button>
              <span className="text-xl font-bold text-white w-8 text-center">{seatsPerCar}</span>
              <button
                onClick={() => setSeatsPerCar(Math.min(7, seatsPerCar + 1))}
                className="w-10 h-10 rounded-full bg-night-700 text-white flex items-center justify-center hover:bg-night-600"
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1">
              <Fuel size={12} /> 油费补贴（元/车）
            </label>
            <input
              type="number"
              className="dark-input"
              value={fuelSubsidy}
              onChange={(e) => setFuelSubsidy(Number(e.target.value))}
            />
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
            <textarea
              className="dark-input min-h-[80px] resize-none"
              placeholder="活动备注..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className={`w-full py-4 text-lg rounded-full font-bold transition-all ${
            !hasErrors
              ? 'bg-neon-gradient text-white shadow-[0_4px_16px_rgba(233,69,96,0.3)] hover:shadow-[0_6px_24px_rgba(233,69,96,0.5)]'
              : 'bg-night-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {hasErrors ? `还有 ${Object.keys(validate).length} 项未完成` : '发布活动'}
        </button>
      </div>
    </div>
  )
}
