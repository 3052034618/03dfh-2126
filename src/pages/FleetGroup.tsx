import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Users,
  MapPin,
  Car,
  UserCheck,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Share2,
  RefreshCw,
  MoveRight,
  Plus,
  X,
  Clock,
  UserX,
  AlertTriangle,
  UserPlus,
  Scissors,
} from 'lucide-react'
import { format } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { pickupAreas } from '@/data/mock'
import type { FleetPassenger, BoardingStatus as BoardingStatusType } from '@/types'

const statusMeta: Record<
  BoardingStatusType,
  { label: string; icon: typeof UserCheck; color: string; bg: string; border: string }
> = {
  waiting: {
    label: '待上车',
    icon: Clock,
    color: 'text-neon-magenta',
    bg: 'bg-neon-magenta/10',
    border: 'border-neon-magenta/30',
  },
  boarded: {
    label: '已上车',
    icon: UserCheck,
    color: 'text-neon-green',
    bg: 'bg-neon-green/10',
    border: 'border-neon-green/30',
  },
  missed: {
    label: '漏接',
    icon: AlertTriangle,
    color: 'text-neon-orange',
    bg: 'bg-neon-orange/10',
    border: 'border-neon-orange/30',
  },
  no_show: {
    label: '临时不上',
    icon: UserX,
    color: 'text-neon-red',
    bg: 'bg-neon-red/10',
    border: 'border-neon-red/30',
  },
}

export default function FleetGroup() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { activity, fleetGroups, carOffers, setPassengerBoardingStatus, movePassenger, generateFleetGroups, confirmCarOfferAndAddToFleet, updatePlayerPickupArea } = useStore(
    (s) => {
      const a = s.activities.find((act) => act.id === id)
      return {
        activity: a,
        fleetGroups: a?.fleetGroups || [],
        carOffers: a?.carOffers || [],
        setPassengerBoardingStatus: s.setPassengerBoardingStatus,
        movePassenger: s.movePassenger,
        generateFleetGroups: s.generateFleetGroups,
        confirmCarOfferAndAddToFleet: s.confirmCarOfferAndAddToFleet,
        updatePlayerPickupArea: s.updatePlayerPickupArea,
      }
    }
  )

  const [activeTab, setActiveTab] = useState<'outbound' | 'return'>('outbound')
  const [expandArea, setExpandArea] = useState(false)
  const [movingPassenger, setMovingPassenger] = useState<FleetPassenger | null>(null)
  const [movingFromCarId, setMovingFromCarId] = useState<string | null>(null)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 2500)
      return () => clearTimeout(t)
    }
  }, [saved])
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 3500)
      return () => clearTimeout(t)
    }
  }, [error])

  const currentGroup = fleetGroups.find((fg) => fg.type === activeTab)
  const pendingCarOffers = carOffers.filter((co) => co.status === 'pending')

  const globalBoardingStats = useMemo(() => {
    const stats: Record<BoardingStatusType, number> = {
      waiting: 0,
      boarded: 0,
      missed: 0,
      no_show: 0,
    }
    if (!currentGroup) return stats
    for (const car of currentGroup.cars) {
      for (const p of car.passengers) {
        const st = p.boardingStatus || 'waiting'
        stats[st] = (stats[st] || 0) + 1
      }
    }
    return stats
  }, [currentGroup])

  const totalPassengers =
    globalBoardingStats.waiting +
    globalBoardingStats.boarded +
    globalBoardingStats.missed +
    globalBoardingStats.no_show

  const areaStats = useMemo(() => {
    if (!activity) return []
    const counts = new Map<string, number>()
    for (const p of activity.players) {
      const key = p.pickupArea || '未指定'
      counts.set(key, (counts.get(key) || 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [activity])

  if (!activity) {
    return (
      <div className="min-h-screen bg-ink-night flex items-center justify-center text-neon-lavender">
        活动不存在
      </div>
    )
  }

  const handleShare = () => {
    if (!currentGroup) return
    const text = [
      `🎭 ${activity.scriptName} 拼车名单（${activeTab === 'outbound' ? '去程' : '返程'}）`,
      `⏰ ${format(new Date(currentGroup.departureTime), 'MM月dd日 HH:mm')} 发车`,
      '',
      ...currentGroup.cars.map((car, idx) => {
        const co = activity.carOffers.find((c) => c.id === car.carOfferId)
        const carCap = co?.availableSeats || car.passengers.length
        const boardingStats = car.passengers.reduce(
          (acc, p) => {
            const s = p.boardingStatus || 'waiting'
            acc[s] = (acc[s] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        )
        const summaryParts = []
        if (boardingStats.boarded) summaryParts.push(`✓${boardingStats.boarded}已上车`)
        if (boardingStats.waiting) summaryParts.push(`◷${boardingStats.waiting}待上车`)
        if (boardingStats.missed) summaryParts.push(`⚠${boardingStats.missed}漏接`)
        if (boardingStats.no_show) summaryParts.push(`✗${boardingStats.no_show}临时不上`)

        return [
          `【车${idx + 1}】${car.driver.nickname} 载 ${car.passengers.length}/${carCap}人${summaryParts.length ? `（${summaryParts.join(' / ')}）` : ''}`,
          `路线: ${car.route}`,
          ...car.passengers.map((p, pi) => {
            const st = p.boardingStatus || 'waiting'
            const mark =
              st === 'boarded' ? '✓' : st === 'missed' ? '⚠' : st === 'no_show' ? '✗' : '◷'
            return `  ${pi + 1}. ${mark} ${p.user.nickname}（${p.pickupArea}）`
          }),
        ].join('\n')
      }),
      '',
      `📍集合：${currentGroup.meetingPoint}`,
    ].join('\n')
    navigator.clipboard?.writeText(text)
    setSaved(true)
  }

  const handleMove = (toCarOfferId: string) => {
    if (!movingPassenger || !movingFromCarId || !activity) return
    const ok = movePassenger(activity.id, activeTab, movingPassenger.user.id, movingFromCarId, toCarOfferId)
    setMovingPassenger(null)
    setMovingFromCarId(null)
    if (!ok) setError('该车辆已满员或超员，请先减少乘客')
  }

  const handleStatusChange = (carOfferId: string, passengerUserId: string, newStatus: BoardingStatusType) => {
    if (!activity) return
    setPassengerBoardingStatus(activity.id, activeTab, carOfferId, passengerUserId, newStatus)
  }

  return (
    <div className="min-h-screen bg-ink-night pb-24">
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-neon-green/90 text-ink-deep font-semibold shadow-lg shadow-neon-green/30 backdrop-blur-sm"
          >
            ✓ 名单已复制到剪贴板
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-neon-red/90 text-ink-deep font-semibold shadow-lg shadow-neon-red/30 backdrop-blur-sm"
          >
            ⚠ {error}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="glass-card sticky top-0 z-40 px-5 pt-6 pb-4 border-b border-neon-magenta/10">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-ink-deep/80 border border-neon-magenta/20 text-neon-lavender hover:text-neon-magenta"
          >
            <ChevronDown className="w-5 h-5 rotate-90" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-display text-neon-magenta truncate">{activity.scriptName}</h1>
            <p className="text-sm text-neon-lavender/70">
              {fleetGroups.length > 0 ? '车队分组与临场调度' : '尚未生成车队分组'}
            </p>
          </div>
        </div>

        {fleetGroups.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-4">
            {(Object.keys(statusMeta) as BoardingStatusType[]).map((st) => {
              const meta = statusMeta[st]
              const Icon = meta.icon
              return (
                <div
                  key={st}
                  className={`${meta.bg} ${meta.border} border rounded-2xl p-3 flex flex-col items-center`}
                >
                  <Icon className={`w-5 h-5 mb-1 ${meta.color}`} />
                  <div className={`text-xl font-bold ${meta.color}`}>{globalBoardingStats[st]}</div>
                  <div className="text-[10px] text-neon-lavender/70">{meta.label}</div>
                </div>
              )
            })}
          </div>
        )}

        {fleetGroups.length > 0 && (
          <div className="mt-4">
            <div className="flex gap-2 p-1.5 rounded-2xl bg-ink-deep/80 border border-neon-magenta/10">
              <button
                onClick={() => setActiveTab('outbound')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'outbound'
                    ? 'bg-neon-magenta text-ink-deep shadow-glow-magenta'
                    : 'text-neon-lavender hover:text-neon-magenta'
                }`}
              >
                去程
                {fleetGroups.find((g) => g.type === 'outbound') && (
                  <span className="ml-1.5 opacity-70">
                    ({fleetGroups.find((g) => g.type === 'outbound')!.cars.length}车)
                  </span>
                )}
              </button>
              {fleetGroups.find((g) => g.type === 'return') && (
                <button
                  onClick={() => setActiveTab('return')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'return'
                      ? 'bg-neon-magenta text-ink-deep shadow-glow-magenta'
                      : 'text-neon-lavender hover:text-neon-magenta'
                  }`}
                >
                  返程
                  <span className="ml-1.5 opacity-70">
                    ({fleetGroups.find((g) => g.type === 'return')!.cars.length}车)
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="px-4 pt-6 space-y-5">
        {pendingCarOffers.length > 0 && currentGroup && (
          <section className="glass-card rounded-3xl p-5 border-2 border-neon-blue/30 animate-pulse-glow">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-neon-blue/15 text-neon-blue shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-lg text-neon-blue mb-1">待确认车源</h3>
                <p className="text-xs text-neon-lavender/70 mb-4">
                  有 {pendingCarOffers.length} 位车主已响应出车，可并入当前车队
                </p>
                <div className="space-y-3">
                  {pendingCarOffers.map((co) => (
                    <div
                      key={co.id}
                      className="p-3 rounded-2xl bg-ink-deep/60 border border-neon-blue/20"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={co.driver.avatar}
                          alt={co.driver.nickname}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-neon-blue/40"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-neon-lavender text-sm">
                            {co.driver.nickname}
                          </div>
                          <div className="text-xs text-neon-lavender/60">
                            📍 {co.pickupArea} · 可坐{co.availableSeats}人
                            {co.waitAfterGame && ' · 包返程'}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() =>
                            confirmCarOfferAndAddToFleet(activity.id, co.id, 'empty')
                          }
                          className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-neon-blue/15 border border-neon-blue/30 text-neon-blue text-xs font-medium hover:bg-neon-blue/25 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> 补空车
                        </button>
                        <button
                          onClick={() =>
                            confirmCarOfferAndAddToFleet(activity.id, co.id, 'split')
                          }
                          className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-neon-purple/15 border border-neon-purple/30 text-neon-purple text-xs font-medium hover:bg-neon-purple/25 transition-colors"
                        >
                          <Scissors className="w-3.5 h-3.5" /> 分担满车
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {currentGroup && (
          <div className="glass-card rounded-3xl p-5 border border-neon-magenta/15">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl text-neon-magenta mb-1">
                  {activeTab === 'outbound' ? '去程' : '返程'}车队
                </h2>
                <p className="text-xs text-neon-lavender/70">
                  {format(new Date(currentGroup.departureTime), 'MM月dd日 HH:mm')} 发车 · {totalPassengers}人 · 共
                  {currentGroup.cars.length}辆
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    generateFleetGroups(activity.id)
                    setSaved(true)
                  }}
                  className="p-2.5 rounded-xl bg-ink-deep/80 border border-neon-blue/20 text-neon-blue hover:border-neon-blue transition-all"
                  title="重新生成"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neon-magenta text-ink-deep font-semibold text-sm shadow-glow-magenta hover:brightness-110"
                >
                  <Share2 className="w-4 h-4" /> 一键分享
                </button>
              </div>
            </div>
          </div>
        )}

        {currentGroup ? (
          currentGroup.cars.length > 0 ? (
            <div className="space-y-4">
              {currentGroup.cars.map((car, carIdx) => {
                const co = activity.carOffers.find((c) => c.id === car.carOfferId)
                const capacity = co?.availableSeats || car.passengers.length
                const overflow = car.passengers.length > capacity
                const available = capacity - car.passengers.length
                const seatColor =
                  available > 1
                    ? 'text-neon-green'
                    : available === 0
                    ? 'text-neon-gold'
                    : 'text-neon-orange'

                const carBoardingStats = car.passengers.reduce(
                  (acc, p) => {
                    const s = p.boardingStatus || 'waiting'
                    acc[s] = (acc[s] || 0) + 1
                    return acc
                  },
                  {} as Record<string, number>
                )

                return (
                  <motion.div
                    key={car.carOfferId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: carIdx * 0.08 }}
                    className={`glass-card rounded-3xl p-5 ${
                      overflow
                        ? 'border-2 border-neon-red shadow-[0_0_30px_rgba(239,68,68,0.3)]'
                        : 'border border-neon-gold/15'
                    }`}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative shrink-0">
                        <img
                          src={car.driver.avatar}
                          alt={car.driver.nickname}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-neon-gold/60"
                        />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 flex items-center justify-center rounded-full bg-neon-gold text-ink-deep">
                          <Car className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-bold text-neon-gold">
                              车{carIdx + 1} · {car.driver.nickname}
                            </div>
                            <div className="text-xs text-neon-lavender/70 mt-0.5 flex items-center gap-1.5">
                              <MapPin className="w-3 h-3" />
                              {car.driverPickupArea} 出发
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`text-xs ${seatColor} font-semibold`}>
                              剩 {available} 座
                            </div>
                            <div className="text-sm font-bold text-neon-lavender mt-0.5">
                              {car.passengers.length}/{capacity}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                      {(Object.keys(statusMeta) as BoardingStatusType[]).map((st) => {
                        if (!carBoardingStats[st]) return null
                        const meta = statusMeta[st]
                        return (
                          <span
                            key={st}
                            className={`${meta.bg} ${meta.color} ${meta.border} border px-2.5 py-1 rounded-lg text-xs font-medium`}
                          >
                            {meta.label} {carBoardingStats[st]}人
                          </span>
                        )
                      })}
                    </div>

                    <div className="mb-4 px-3 py-2.5 rounded-xl bg-gradient-to-r from-neon-gold/10 via-neon-magenta/5 to-neon-gold/10 border border-neon-gold/20">
                      <div className="text-[11px] text-neon-gold/90 font-medium mb-0.5">
                        📍 接人顺序路线
                      </div>
                      <div className="text-sm text-neon-lavender font-mono">{car.route}</div>
                    </div>

                    <div className="space-y-2">
                      {car.passengers.map((p, pi) => {
                        const st: BoardingStatusType = p.boardingStatus || 'waiting'
                        const meta = statusMeta[st]
                        const Icon = meta.icon
                        return (
                          <div
                            key={p.user.id}
                            className={`group/item ${meta.border} border ${meta.bg} rounded-2xl p-3 flex items-center gap-3 transition-all`}
                          >
                            <div className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg bg-ink-deep/70 text-neon-gold font-bold text-sm">
                              {pi + 1}
                            </div>
                            <img
                              src={p.user.avatar}
                              alt={p.user.nickname}
                              className="w-9 h-9 rounded-full object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-neon-lavender truncate flex items-center gap-2">
                                <Icon className={`w-3.5 h-3.5 shrink-0 ${meta.color}`} />
                                {p.user.nickname}
                              </div>
                              {editingUserId === p.user.id ? (
                                <select
                                  defaultValue={p.pickupArea}
                                  onChange={(e) => {
                                    updatePlayerPickupArea(activity.id, p.user.id, e.target.value)
                                    setEditingUserId(null)
                                    generateFleetGroups(activity.id)
                                  }}
                                  className="mt-1 text-xs bg-ink-deep border border-neon-magenta/30 rounded-lg px-2 py-0.5 text-neon-lavender"
                                >
                                  {pickupAreas.map((a) => (
                                    <option key={a} value={a}>
                                      {a}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div
                                  className="text-xs text-neon-lavender/60 flex items-center gap-1 cursor-pointer hover:text-neon-magenta"
                                  onClick={() => setEditingUserId(p.user.id)}
                                >
                                  <MapPin className="w-3 h-3" />
                                  {p.pickupArea}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                              {(Object.keys(statusMeta) as BoardingStatusType[]).map((t) => {
                                if (t === st) return null
                                const tMeta = statusMeta[t]
                                const TIcon = tMeta.icon
                                return (
                                  <button
                                    key={t}
                                    onClick={() =>
                                      handleStatusChange(car.carOfferId, p.user.id, t)
                                    }
                                    className={`p-1.5 rounded-lg ${tMeta.bg} ${tMeta.color} hover:brightness-125 transition-all`}
                                    title={`标记为${tMeta.label}`}
                                  >
                                    <TIcon className="w-3.5 h-3.5" />
                                  </button>
                                )
                              })}
                              <button
                                onClick={() => {
                                  setMovingPassenger(p)
                                  setMovingFromCarId(car.carOfferId)
                                }}
                                className="p-1.5 rounded-lg bg-neon-blue/15 text-neon-blue hover:bg-neon-blue/30"
                                title="挪到别的车"
                              >
                                <MoveRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )
                      })}

                      {car.passengers.length === 0 && (
                        <div className="text-center py-6 text-neon-lavender/40 text-sm italic">
                          这辆车暂无乘客分配
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-10 text-center border border-dashed border-neon-magenta/30">
              <Users className="w-16 h-16 mx-auto mb-4 text-neon-magenta/50" />
              <p className="text-neon-lavender/70 mb-6">该方向暂无分配车辆</p>
              <button
                onClick={() => generateFleetGroups(activity.id)}
                className="px-6 py-3 rounded-xl bg-neon-magenta text-ink-deep font-semibold shadow-glow-magenta"
              >
                生成车队分组
              </button>
            </div>
          )
        ) : (
          <div className="glass-card rounded-3xl p-10 text-center border border-dashed border-neon-magenta/30">
            <Users className="w-16 h-16 mx-auto mb-4 text-neon-magenta/50" />
            <p className="text-neon-lavender/70 mb-6">
              {fleetGroups.length === 0
                ? '还未生成车队分组，点击下方按钮按区域智能派车'
                : '暂无此方向的车队分组'}
            </p>
            <button
              onClick={() => generateFleetGroups(activity.id)}
              className="px-6 py-3 rounded-xl bg-neon-magenta text-ink-deep font-semibold shadow-glow-magenta flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeftRight className="w-5 h-5" /> 按区域智能派车
            </button>
          </div>
        )}

        <section className="glass-card rounded-3xl p-5 border border-neon-blue/15">
          <button
            onClick={() => setExpandArea(!expandArea)}
            className="w-full flex items-center justify-between"
          >
            <div>
              <h3 className="font-display text-lg text-neon-blue">玩家上车区域分布</h3>
              <p className="text-xs text-neon-lavender/70 mt-0.5">
                共 {areaStats.length} 个区域，点击可手动调整
              </p>
            </div>
            {expandArea ? (
              <ChevronUp className="w-5 h-5 text-neon-blue" />
            ) : (
              <ChevronDown className="w-5 h-5 text-neon-blue" />
            )}
          </button>
          <AnimatePresence>
            {expandArea && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {areaStats.map(([area, count]) => (
                    <div
                      key={area}
                      className="px-4 py-3 rounded-2xl bg-ink-deep/60 border border-neon-blue/20 flex items-center justify-between"
                    >
                      <span className="text-sm text-neon-lavender">{area}</span>
                      <span className="text-sm font-semibold text-neon-blue">
                        {count} 人
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-neon-lavender/50">
                  💡 调整玩家上车区域后，重新生成车队分组可让同区域玩家更集中
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      <AnimatePresence>
        {movingPassenger && movingFromCarId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end"
            onClick={() => {
              setMovingPassenger(null)
              setMovingFromCarId(null)
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full glass-card rounded-t-3xl border-t border-neon-magenta/20 px-5 pt-5 pb-8 max-h-[70vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-neon-lavender/30 rounded-full mx-auto mb-5" />
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <img
                    src={movingPassenger.user.avatar}
                    alt={movingPassenger.user.nickname}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-neon-magenta/50"
                  />
                  <div>
                    <h3 className="font-bold text-neon-lavender">移动乘客</h3>
                    <p className="text-xs text-neon-lavender/60 mt-0.5">
                      {movingPassenger.user.nickname} · {movingPassenger.pickupArea}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMovingPassenger(null)
                    setMovingFromCarId(null)
                  }}
                  className="p-2 rounded-xl bg-ink-deep/80 text-neon-lavender/60"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {currentGroup?.cars
                  .filter((c) => c.carOfferId !== movingFromCarId)
                  .map((car) => {
                    const co = activity.carOffers.find((c) => c.id === car.carOfferId)
                    const cap = co?.availableSeats || car.passengers.length
                    const full = car.passengers.length >= cap
                    return (
                      <button
                        key={car.carOfferId}
                        disabled={full}
                        onClick={() => handleMove(car.carOfferId)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all ${
                          full
                            ? 'bg-neon-red/5 border-neon-red/20 opacity-50 cursor-not-allowed'
                            : 'bg-ink-deep/60 border-neon-magenta/20 hover:bg-neon-magenta/10 hover:border-neon-magenta/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={car.driver.avatar}
                              alt={car.driver.nickname}
                              className="w-9 h-9 rounded-full object-cover"
                            />
                            <div>
                              <div className="text-sm font-semibold text-neon-lavender">
                                {car.driver.nickname} 的车
                              </div>
                              <div className="text-xs text-neon-lavender/60 mt-0.5">
                                📍 {car.driverPickupArea} 出发
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {full ? (
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-neon-red/15 text-neon-red text-xs font-medium">
                                满员
                              </span>
                            ) : (
                              <div className="text-sm font-bold text-neon-green">
                                可坐 {cap - car.passengers.length} 人
                              </div>
                            )}
                            <div className="text-[11px] text-neon-lavender/50 mt-0.5">
                              {car.passengers.length}/{cap}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
