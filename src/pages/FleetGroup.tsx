import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Users, MapPin, Car, UserCheck, ArrowLeftRight, ChevronDown, ChevronUp, Share2, RefreshCw, MoveRight, Plus, X, Clock, UserX, AlertTriangle, UserPlus, Scissors, Phone, Play, Send, CheckCircle2, Navigation, MessageSquare, Gauge, Smartphone, Radio,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { pickupAreas } from '@/data/mock'
import type {
  FleetPassenger, BoardingStatus as BoardingStatusType, CarExecutionStatus, FleetCar, FleetGroup,
} from '@/types'

const boardingMeta: Record<
  BoardingStatusType,
  { label: string; icon: typeof UserCheck; color: string; bg: string; border: string; chip: string }
> = {
  waiting: {
    label: '待上车', icon: Clock, color: 'text-neon-magenta',
    bg: 'bg-neon-magenta/10', border: 'border-neon-magenta/30', chip: 'from-neon-magenta',
  },
  boarded: {
    label: '已上车', icon: UserCheck, color: 'text-neon-green',
    bg: 'bg-neon-green/10', border: 'border-neon-green/30', chip: 'from-neon-green',
  },
  missed: {
    label: '漏接', icon: AlertTriangle, color: 'text-neon-orange',
    bg: 'bg-neon-orange/10', border: 'border-neon-orange/30', chip: 'from-neon-orange',
  },
  no_show: {
    label: '临时不上', icon: UserX, color: 'text-neon-red',
    bg: 'bg-neon-red/10', border: 'border-neon-red/30', chip: 'from-neon-red',
  },
}

const execMeta: Record<
  CarExecutionStatus,
  { label: string; icon: typeof Gauge; color: string; bg: string; border: string }
> = {
  waiting: {
    label: '待发车', icon: Clock, color: 'text-neon-lavender',
    bg: 'bg-neon-lavender/10', border: 'border-neon-lavender/30',
  },
  boarding: {
    label: '接人中', icon: Play, color: 'text-neon-blue',
    bg: 'bg-neon-blue/10', border: 'border-neon-blue/30',
  },
  in_transit: {
    label: '行驶中', icon: Navigation, color: 'text-neon-gold',
    bg: 'bg-neon-gold/10', border: 'border-neon-gold/30',
  },
  arrived: {
    label: '已到达', icon: CheckCircle2, color: 'text-neon-green',
    bg: 'bg-neon-green/10', border: 'border-neon-green/30',
  },
}

function useCountdown(target?: string) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!target) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [target])
  if (!target) return { text: '', urgent: false }
  const diffMs = parseISO(target).getTime() - now
  const diffSec = Math.max(0, Math.floor(diffMs / 1000))
  const h = Math.floor(diffSec / 3600)
  const m = Math.floor((diffSec % 3600) / 60)
  const s = diffSec % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    text: h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`,
    urgent: diffSec < 600,
  }
}

export default function FleetGroup() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { activity, fleetGroups, carOffers, currentUser, setPassengerBoardingStatus, movePassenger, generateFleetGroups, confirmCarOfferAndAddToFleet, updatePlayerPickupArea, setCarExecutionStatus, contactPassenger, buildDriverShareText,
  } = useStore((s) => {
    const a = s.activities.find((act) => act.id === id)
    return {
      activity: a,
      fleetGroups: a?.fleetGroups || [],
      carOffers: a?.carOffers || [],
      currentUser: s.currentUser,
      setPassengerBoardingStatus: s.setPassengerBoardingStatus,
      movePassenger: s.movePassenger,
      generateFleetGroups: s.generateFleetGroups,
      confirmCarOfferAndAddToFleet: s.confirmCarOfferAndAddToFleet,
      updatePlayerPickupArea: s.updatePlayerPickupArea,
      setCarExecutionStatus: s.setCarExecutionStatus,
      contactPassenger: s.contactPassenger,
      buildDriverShareText: s.buildDriverShareText,
    }
  })

  const [activeTab, setActiveTab] = useState<'outbound' | 'return'>('outbound')
  const [driverPerspective, setDriverPerspective] = useState<'dispatcher' | 'driver'>('dispatcher')
  const [expandArea, setExpandArea] = useState(false)
  const [movingPassenger, setMovingPassenger] = useState<FleetPassenger | null>(null)
  const [movingFromCarId, setMovingFromCarId] = useState<string | null>(null)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (saved) { const t = setTimeout(() => setSaved(false), 2500); return () => clearTimeout(t) }
  }, [saved])
  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(null), 3500); return () => clearTimeout(t) }
  }, [error])

  const currentGroup = fleetGroups.find((fg) => fg.type === activeTab)
  const pendingCarOffers = carOffers.filter((co) => co.status === 'pending')

  const isOrganizer = activity && activity.organizer.id === currentUser.id
  const driverCars = activity
    ? fleetGroups.flatMap((g) => g.cars.filter((c) => c.driver.id === currentUser.id).map((car) => ({ group: g, car })))
    : []

  const hasDriverRole = driverCars.length > 0

  const globalBoardingStats = useMemo(() => {
    const stats: Record<BoardingStatusType, number> = { waiting: 0, boarded: 0, missed: 0, no_show: 0 }
    if (!currentGroup) return stats
    for (const car of currentGroup.cars) {
      for (const p of car.passengers) {
        const st = p.boardingStatus || 'waiting'
        stats[st] = (stats[st] || 0) + 1
      }
    }
    return stats
  }, [currentGroup])

  const globalExecStats = useMemo(() => {
    const stats: Record<CarExecutionStatus, number> = { waiting: 0, boarding: 0, in_transit: 0, arrived: 0 }
    if (!currentGroup) return stats
    for (const c of currentGroup.cars) {
      const s = c.executionStatus || 'waiting'
      stats[s] = (stats[s] || 0) + 1
    }
    return stats
  }, [currentGroup])

  const totalPassengers =
    globalBoardingStats.waiting + globalBoardingStats.boarded + globalBoardingStats.missed + globalBoardingStats.no_show

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

  const perspectiveOptions = (
    <div className="flex gap-2 p-1.5 rounded-2xl bg-ink-deep/80 border border-neon-magenta/10 mt-4">
      <button
        onClick={() => setDriverPerspective('dispatcher')}
        className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
          driverPerspective === 'dispatcher'
            ? 'bg-neon-magenta text-ink-deep shadow-glow-magenta'
            : 'text-neon-lavender hover:text-neon-magenta'
        }`}
      >
        <Gauge className="w-4 h-4 inline mr-1.5 align-text-bottom" />
        局头调度
      </button>
      {hasDriverRole && (
        <button
          onClick={() => setDriverPerspective('driver')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
            driverPerspective === 'driver'
              ? 'bg-neon-blue text-ink-deep shadow-[0_0_24px_rgba(59,130,246,0.4)]'
              : 'text-neon-lavender hover:text-neon-blue'
          }`}
        >
          <Car className="w-4 h-4 inline mr-1.5 align-text-bottom" />
          司机视角
        </button>
      )}
    </div>
  )

  const handleShare = () => {
    if (!currentGroup) return
    const text = [
      `🎭 ${activity.scriptName} 拼车名单（${activeTab === 'outbound' ? '去程' : '返程'}）`,
      `⏰ ${format(new Date(currentGroup.departureTime), 'MM月dd日 HH:mm')} 发车`,
      '',
      ...currentGroup.cars.map((car, idx) => {
        const co = activity.carOffers.find((c) => c.id === car.carOfferId)
        const carCap = co?.availableSeats || car.passengers.length
        const b = car.passengers.reduce(
          (acc, p) => {
            const s = p.boardingStatus || 'waiting'
            acc[s] = (acc[s] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        )
        const sp = []
        if (b.boarded) sp.push(`✓${b.boarded}已上车`)
        if (b.waiting) sp.push(`◷${b.waiting}待上车`)
        if (b.missed) sp.push(`⚠${b.missed}漏接`)
        if (b.no_show) sp.push(`✗${b.no_show}临时不上`)
        const ex = car.executionStatus || 'waiting'
        const exLabel = execMeta[ex]?.label || ''
        return [
          `【车${idx + 1}】${car.driver.nickname} 载 ${car.passengers.length}/${carCap}人 [${exLabel}]${sp.length ? `（${sp.join(' / ')}）` : ''}`,
          `路线: ${car.route}`,
          ...car.passengers.map((p, pi) => {
            const st = p.boardingStatus || 'waiting'
            const mark = st === 'boarded' ? '✓' : st === 'missed' ? '⚠' : st === 'no_show' ? '✗' : '◷'
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

  const handleDriverShare = (group: FleetGroup, car: FleetCar, idx: number) => {
    const text = buildDriverShareText(activity, group, car, idx)
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

  const handleContact = (passengerUserId: string) => {
    if (!activity) return
    contactPassenger(activity.id, currentUser.id, passengerUserId)
    showToast('success', '正在联系该乘客')
  }

  const showToast = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') setSaved(true)
    else setError(msg)
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
            ✓ 操作成功
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
          <>
            <div className="grid grid-cols-4 gap-2 mt-3">
              {(Object.keys(boardingMeta) as BoardingStatusType[]).map((st) => {
                const meta = boardingMeta[st]
                const Icon = meta.icon
                return (
                  <div key={st} className={`${meta.bg} ${meta.border} border rounded-2xl p-3 flex flex-col items-center`}>
                    <Icon className={`w-5 h-5 mb-1 ${meta.color}`} />
                    <div className={`text-xl font-bold ${meta.color}`}>{globalBoardingStats[st]}</div>
                    <div className="text-[10px] text-neon-lavender/70">{meta.label}</div>
                  </div>
                )
              })}
            </div>

            <div className="grid grid-cols-4 gap-2 mt-2">
              {(Object.keys(execMeta) as CarExecutionStatus[]).map((st) => {
                const meta = execMeta[st]
                const Icon = meta.icon
                return (
                  <div key={st} className={`${meta.bg} ${meta.border} border rounded-2xl p-2.5 flex items-center gap-2 justify-center`}>
                    <Icon className={`w-4 h-4 ${meta.color}`} />
                    <div className={`text-xs font-semibold ${meta.color}`}>
                      {globalExecStats[st]} {meta.label}
                    </div>
                  </div>
                )
              })}
            </div>

            {perspectiveOptions}

            <div className="mt-3">
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
          </>
        )}
      </header>

      <main className="px-4 pt-6 space-y-5">
        {driverPerspective === 'driver' && (
          <DriverPerspective
            activity={activity}
            driverCars={driverCars}
            activeTab={activeTab}
            handleShare={handleDriverShare}
            setCarExecutionStatus={setCarExecutionStatus}
            setPassengerBoardingStatus={setPassengerBoardingStatus}
            handleContact={handleContact}
            useCountdown={useCountdown}
          />
        )}

        {driverPerspective === 'dispatcher' && (
          <>
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
                        <div key={co.id} className="p-3 rounded-2xl bg-ink-deep/60 border border-neon-blue/20">
                          <div className="flex items-center gap-3 mb-3">
                            <img src={co.driver.avatar} alt={co.driver.nickname} className="w-10 h-10 rounded-full object-cover ring-2 ring-neon-blue/40" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-neon-lavender text-sm">{co.driver.nickname}</div>
                              <div className="text-xs text-neon-lavender/60">
                                📍 {co.pickupArea} · 可坐{co.availableSeats}人{co.waitAfterGame && ' · 包返程'}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => confirmCarOfferAndAddToFleet(activity.id, co.id, 'empty')}
                              className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-neon-blue/15 border border-neon-blue/30 text-neon-blue text-xs font-medium hover:bg-neon-blue/25 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" /> 补空车
                            </button>
                            <button
                              onClick={() => confirmCarOfferAndAddToFleet(activity.id, co.id, 'split')}
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
                      {format(new Date(currentGroup.departureTime), 'MM月dd日 HH:mm')} 发车 · {totalPassengers}人 · 共{currentGroup.cars.length}辆
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { generateFleetGroups(activity.id); setSaved(true); }}
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
                  {currentGroup.cars.map((car, carIdx) => (
                    <DispatcherCarCard
                      key={car.carOfferId}
                      activity={activity}
                      car={car}
                      carIdx={carIdx}
                      currentGroup={currentGroup}
                      movingPassenger={movingPassenger}
                      movingFromCarId={movingFromCarId}
                      editingUserId={editingUserId}
                      setMovingPassenger={setMovingPassenger}
                      setMovingFromCarId={setMovingFromCarId}
                      setEditingUserId={setEditingUserId}
                      handleStatusChange={handleStatusChange}
                      handleMove={handleMove}
                      updatePlayerPickupArea={updatePlayerPickupArea}
                      generateFleetGroups={generateFleetGroups}
                      setCarExecutionStatus={setCarExecutionStatus}
                      handleDriverShare={handleDriverShare}
                      activeTab={activeTab}
                      currentUser={currentUser}
                    />
                  ))}
                </div>
              ) : (
                <EmptyFleetState activity={activity} generateFleetGroups={generateFleetGroups} />
              )
            ) : (
              <EmptyFleetState activity={activity} generateFleetGroups={generateFleetGroups} />
            )}

            <AreaSection areaStats={areaStats} expandArea={expandArea} setExpandArea={setExpandArea} />
          </>
        )}
      </main>

      <AnimatePresence>
        {movingPassenger && movingFromCarId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end"
            onClick={() => { setMovingPassenger(null); setMovingFromCarId(null); }}
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
                <button onClick={() => { setMovingPassenger(null); setMovingFromCarId(null); }} className="p-2 rounded-xl bg-ink-deep/80 text-neon-lavender/60">
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
                            <img src={car.driver.avatar} alt={car.driver.nickname} className="w-9 h-9 rounded-full object-cover" />
                            <div>
                              <div className="text-sm font-semibold text-neon-lavender">
                                {car.driver.nickname} 的车
                              </div>
                              <div className="text-xs text-neon-lavender/60 mt-0.5">📍 {car.driverPickupArea} 出发</div>
                            </div>
                          </div>
                          <div className="text-right">
                            {full ? (
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-neon-red/15 text-neon-red text-xs font-medium">满员</span>
                            ) : (
                              <div className="text-sm font-bold text-neon-green">可坐 {cap - car.passengers.length} 人</div>
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

function EmptyFleetState({ activity, generateFleetGroups }: { activity: any; generateFleetGroups: (id: string) => void }) {
  return (
    <div className="glass-card rounded-3xl p-10 text-center border border-dashed border-neon-magenta/30">
      <Users className="w-16 h-16 mx-auto mb-4 text-neon-magenta/50" />
      <p className="text-neon-lavender/70 mb-6">还未生成车队分组，点击下方按钮按区域智能派车</p>
      <button
        onClick={() => generateFleetGroups(activity.id)}
        className="px-6 py-3 rounded-xl bg-neon-magenta text-ink-deep font-semibold shadow-glow-magenta flex items-center justify-center gap-2 mx-auto"
      >
        <ArrowLeftRight className="w-5 h-5" /> 按区域智能派车
      </button>
    </div>
  )
}

function AreaSection({ areaStats, expandArea, setExpandArea }: any) {
  return (
    <section className="glass-card rounded-3xl p-5 border border-neon-blue/15">
      <button onClick={() => setExpandArea(!expandArea)} className="w-full flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg text-neon-blue">玩家上车区域分布</h3>
          <p className="text-xs text-neon-lavender/70 mt-0.5">共 {areaStats.length} 个区域，点击可手动调整</p>
        </div>
        {expandArea ? <ChevronUp className="w-5 h-5 text-neon-blue" /> : <ChevronDown className="w-5 h-5 text-neon-blue" />}
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
                <div key={area} className="px-4 py-3 rounded-2xl bg-ink-deep/60 border border-neon-blue/20 flex items-center justify-between">
                  <span className="text-sm text-neon-lavender">{area}</span>
                  <span className="text-sm font-semibold text-neon-blue">{count} 人</span>
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
  )
}

function DispatcherCarCard(props: any) {
  const {
    activity, car, carIdx, currentGroup, movingPassenger, movingFromCarId, editingUserId,
    setMovingPassenger, setMovingFromCarId, setEditingUserId,
    handleStatusChange, handleMove, updatePlayerPickupArea, generateFleetGroups,
    setCarExecutionStatus, handleDriverShare, activeTab,
  } = props

  const co = activity.carOffers.find((c: any) => c.id === car.carOfferId)
  const capacity = co?.availableSeats || car.passengers.length
  const overflow = car.passengers.length > capacity
  const available = capacity - car.passengers.length
  const seatColor = available > 1 ? 'text-neon-green' : available === 0 ? 'text-neon-gold' : 'text-neon-orange'
  const ex: CarExecutionStatus = car.executionStatus || 'waiting'
  const exMetaInfo = execMeta[ex]
  const ExecIcon = exMetaInfo.icon

  const carBoardingStats = car.passengers.reduce(
    (acc: Record<string, number>, p: FleetPassenger) => {
      const s = p.boardingStatus || 'waiting'
      acc[s] = (acc[s] || 0) + 1
      return acc
    },
    {}
  )

  return (
    <motion.div
      key={car.carOfferId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: carIdx * 0.08 }}
      className={`glass-card rounded-3xl p-5 ${overflow ? 'border-2 border-neon-red shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'border border-neon-gold/15'}`}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="relative shrink-0">
          <img src={car.driver.avatar} alt={car.driver.nickname} className="w-14 h-14 rounded-full object-cover ring-2 ring-neon-gold/60" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 flex items-center justify-center rounded-full bg-neon-gold text-ink-deep">
            <Car className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-bold text-neon-gold">车{carIdx + 1} · {car.driver.nickname}</div>
              <div className="text-xs text-neon-lavender/70 mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-3 h-3" />
                {car.driverPickupArea} 出发
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className={`text-xs ${seatColor} font-semibold`}>剩 {available} 座</div>
              <div className="text-sm font-bold text-neon-lavender mt-0.5">{car.passengers.length}/{capacity}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(boardingMeta) as BoardingStatusType[]).map((st) => {
            if (!carBoardingStats[st]) return null
            const meta = boardingMeta[st]
            return (
              <span key={st} className={`${meta.bg} ${meta.color} ${meta.border} border px-2.5 py-1 rounded-lg text-xs font-medium`}>
                {meta.label} {carBoardingStats[st]}人
              </span>
            )
          })}
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${exMetaInfo.bg} ${exMetaInfo.color} ${exMetaInfo.border} border`}>
          <ExecIcon className="w-4 h-4" />
          <span className="text-xs font-semibold">{exMetaInfo.label}</span>
        </div>
      </div>

      <div className="mb-4 px-3 py-2.5 rounded-xl bg-gradient-to-r from-neon-gold/10 via-neon-magenta/5 to-neon-gold/10 border border-neon-gold/20">
        <div className="text-[11px] text-neon-gold/90 font-medium mb-0.5">📍 接人顺序路线</div>
        <div className="text-sm text-neon-lavender font-mono">{car.route}</div>
      </div>

      <div className="mb-3 flex gap-2 flex-wrap">
        <button
          onClick={() => setCarExecutionStatus(activity.id, activeTab, car.carOfferId, 'boarding')}
          className="flex-1 min-w-[100px] py-2 px-3 rounded-xl bg-neon-blue/15 border border-neon-blue/30 text-neon-blue text-xs font-medium hover:bg-neon-blue/25 transition-colors"
        >
          <Play className="w-4 h-4 inline mr-1 align-text-bottom" />开始接人
        </button>
        <button
          onClick={() => setCarExecutionStatus(activity.id, activeTab, car.carOfferId, 'in_transit')}
          className="flex-1 min-w-[100px] py-2 px-3 rounded-xl bg-neon-gold/15 border border-neon-gold/30 text-neon-gold text-xs font-medium hover:bg-neon-gold/25 transition-colors"
        >
          <Navigation className="w-4 h-4 inline mr-1 align-text-bottom" />确认发车
        </button>
        <button
          onClick={() => setCarExecutionStatus(activity.id, activeTab, car.carOfferId, 'arrived')}
          className="flex-1 min-w-[100px] py-2 px-3 rounded-xl bg-neon-green/15 border border-neon-green/30 text-neon-green text-xs font-medium hover:bg-neon-green/25 transition-colors"
        >
          <CheckCircle2 className="w-4 h-4 inline mr-1 align-text-bottom" />已到达
        </button>
        <button
          onClick={() => handleDriverShare(activity, currentGroup, car, carIdx)}
          className="py-2 px-3 rounded-xl bg-neon-magenta/15 border border-neon-magenta/30 text-neon-magenta text-xs font-medium hover:bg-neon-magenta/25 transition-colors"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {car.passengers.map((p: FleetPassenger, pi: number) => {
          const st: BoardingStatusType = p.boardingStatus || 'waiting'
          const meta = boardingMeta[st]
          const Icon = meta.icon
          return (
            <div
              key={p.user.id}
              className={`group/item ${meta.border} border ${meta.bg} rounded-2xl p-3 flex items-center gap-3 transition-all`}
            >
              <div className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg bg-ink-deep/70 text-neon-gold font-bold text-sm">{pi + 1}</div>
              <img src={p.user.avatar} alt={p.user.nickname} className="w-9 h-9 rounded-full object-cover shrink-0" />
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
                    {pickupAreas.map((a: string) => <option key={a} value={a}>{a}</option>)}
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
                {(Object.keys(boardingMeta) as BoardingStatusType[]).map((t) => {
                  if (t === st) return null
                  const tMeta = boardingMeta[t]
                  const TIcon = tMeta.icon
                  return (
                    <button
                      key={t}
                      onClick={() => handleStatusChange(car.carOfferId, p.user.id, t)}
                      className={`p-1.5 rounded-lg ${tMeta.bg} ${tMeta.color} hover:brightness-125 transition-all`}
                      title={`标记为${tMeta.label}`}
                    >
                      <TIcon className="w-3.5 h-3.5" />
                    </button>
                  )
                })}
                <button
                  onClick={() => { setMovingPassenger(p); setMovingFromCarId(car.carOfferId); }}
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
          <div className="text-center py-6 text-neon-lavender/40 text-sm italic">这辆车暂无乘客分配</div>
        )}
      </div>
    </motion.div>
  )
}

function DriverPerspective(props: any) {
  const {
    activity, driverCars, activeTab, handleShare, setCarExecutionStatus, setPassengerBoardingStatus, handleContact, useCountdown: useCountdownFn,
  } = props

  const cars = driverCars.filter((x: any) => x.group.type === activeTab)

  if (cars.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-10 text-center border border-neon-blue/20">
        <Car className="w-16 h-16 mx-auto mb-4 text-neon-blue/50" />
        <p className="text-neon-lavender/70">你当前这个方向没有分配车辆</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {cars.map(({ group, car }: any, idx: number) => {
        const { text: countdownText, urgent } = useCountdownFn(group.departureTime)
        const ex: CarExecutionStatus = car.executionStatus || 'waiting'
        const exInfo = execMeta[ex]
        const ExecIcon = exInfo.icon
        const carRouteClass = 'flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-neon-gold/10 via-neon-magenta/5 to-neon-gold/10 border border-neon-gold/20'
        const carStatusClass = `flex items-center gap-2 p-3 rounded-xl ${exInfo.bg} border ${exInfo.border}`

        return (
          <motion.div
            key={car.carOfferId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="glass-card rounded-3xl p-5 border-2 border-neon-blue/30 shadow-[0_0_40px_rgba(59,130,246,0.08)]"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <img
                    src={car.driver.avatar}
                    alt={car.driver.nickname}
                    className="w-16 h-16 rounded-full object-cover ring-4 ring-neon-blue/60"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 flex items-center justify-center rounded-full bg-neon-blue text-ink-deep">
                    <Car className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xl font-bold text-neon-blue">{group.type === 'outbound' ? '去程' : '返程'} · 我的车</div>
                  <div className="text-xs text-neon-lavender/70 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{car.driverPickupArea} 出发</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{car.passengers.length} 位乘客</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className={`text-2xl font-mono font-bold px-3 py-1.5 rounded-xl ${urgent ? 'bg-neon-red/15 text-neon-red border border-neon-red/30 animate-pulse' : 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30'}`}>
                  {countdownText}
                </div>
                <div className="text-[10px] text-neon-lavender/60 mt-1">发车倒计时</div>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2">
              <div className={carRouteClass}>
                <Navigation className="w-4 h-4 text-neon-gold shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-neon-gold/90 font-medium">接人路线</div>
                  <div className="text-xs text-neon-lavender font-mono truncate">{car.route}</div>
                </div>
              </div>
              <div className={carStatusClass}>
                <ExecIcon className={`w-4 h-4 ${exInfo.color} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-[10px] font-medium ${exInfo.color}`}>当前状态</div>
                  <div className="text-xs text-neon-lavender font-bold">{exInfo.label}</div>
                </div>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2">
              <button
                onClick={() => setCarExecutionStatus(activity.id, group.type, car.carOfferId, 'boarding')}
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-neon-blue/15 border border-neon-blue/30 text-neon-blue text-xs font-semibold hover:bg-neon-blue/25 transition-colors"
              >
                <Play className="w-4 h-4" />
                开始接人
              </button>
              <button
                onClick={() => setCarExecutionStatus(activity.id, group.type, car.carOfferId, 'in_transit')}
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-neon-gold/15 border border-neon-gold/30 text-neon-gold text-xs font-semibold hover:bg-neon-gold/25 transition-colors"
              >
                <Navigation className="w-4 h-4" />
                确认发车
              </button>
              <button
                onClick={() => setCarExecutionStatus(activity.id, group.type, car.carOfferId, 'arrived')}
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-neon-green/15 border border-neon-green/30 text-neon-green text-xs font-semibold hover:bg-neon-green/25 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                到达店铺
              </button>
            </div>

            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-display text-sm text-neon-lavender">乘客名单 & 执行</h4>
              <button
                onClick={() => handleShare(activity, group, car, idx)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-blue/15 border border-neon-blue/30 text-neon-blue text-xs font-medium hover:bg-neon-blue/25 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" /> 司机版分享
              </button>
            </div>

            <div className="space-y-2">
              {car.passengers.length === 0 ? (
                <div className="text-center py-5 text-neon-lavender/40 text-sm italic">暂无乘客</div>
              ) : (
                car.passengers.map((p: FleetPassenger, pi: number) => {
                  const st: BoardingStatusType = p.boardingStatus || 'waiting'
                  const meta = boardingMeta[st]
                  const BIcon = meta.icon
                  const pClass = `${meta.bg} ${meta.border} border rounded-2xl p-3 flex items-center gap-3 transition-all`
                  return (
                    <div key={p.user.id} className={pClass}>
                      <div className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg bg-ink-deep/70 text-neon-gold font-bold text-sm">{pi + 1}</div>
                      <img src={p.user.avatar} alt={p.user.nickname} className="w-10 h-10 rounded-full object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-neon-lavender truncate flex items-center gap-2">
                          <BIcon className={`w-4 h-4 shrink-0 ${meta.color}`} />
                          {p.user.nickname}
                        </div>
                        <div className="text-xs text-neon-lavender/60 flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {p.pickupArea}
                          {p.user.phone && (<><Smartphone className="w-3 h-3 ml-2" />{p.user.phone}</>)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleContact(p.user.id)}
                          className="p-2 rounded-lg bg-neon-purple/15 text-neon-purple hover:bg-neon-purple/30"
                          title="联系乘客"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPassengerBoardingStatus(activity.id, group.type, car.carOfferId, p.user.id, 'boarded')}
                          disabled={st === 'boarded'}
                          className={`p-2 rounded-lg ${st === 'boarded' ? 'bg-neon-green/30 text-neon-green/60' : 'bg-neon-green/15 text-neon-green hover:bg-neon-green/30'}`}
                          title="确认已接到"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
