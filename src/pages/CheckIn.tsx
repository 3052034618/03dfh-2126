import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Car as CarIcon,
  Send,
  Bell,
  MapPin,
  ChevronDown,
  UserCheck,
  RefreshCw,
  Megaphone,
  CarFront,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '@/store/useStore'
import type { CheckinStatus, NotificationType } from '@/types'

const statusMeta: Record<
  CheckinStatus,
  { label: string; icon: typeof CheckCircle; color: string; bg: string; ring: string; border: string }
> = {
  arrived: {
    label: '已到',
    icon: CheckCircle,
    color: 'text-neon-green',
    bg: 'bg-neon-green/10',
    ring: 'ring-neon-green/60',
    border: 'border-neon-green/30',
  },
  late: {
    label: '迟到',
    icon: Clock,
    color: 'text-neon-orange',
    bg: 'bg-neon-orange/10',
    ring: 'ring-neon-orange/60',
    border: 'border-neon-orange/30',
  },
  ride_share: {
    label: '网约车',
    icon: CarIcon,
    color: 'text-neon-blue',
    bg: 'bg-neon-blue/10',
    ring: 'ring-neon-blue/60',
    border: 'border-neon-blue/30',
  },
  not_arrived: {
    label: '未到',
    icon: Users,
    color: 'text-neon-lavender/70',
    bg: 'bg-neon-lavender/5',
    ring: 'ring-neon-lavender/40',
    border: 'border-neon-lavender/20',
  },
}

const isReminderType = (t: NotificationType) =>
  t === 'reminder_not_arrived' || t === 'reminder_late' || t === 'reminder_ride_share'

const reminderMeta: Record<string, { label: string; icon: typeof Bell; bg: string; border: string; color: string }> = {
  reminder_not_arrived: {
    label: '🔔 未到提醒',
    icon: Bell,
    bg: 'from-neon-magenta/20 via-neon-magenta/10 to-transparent',
    border: 'border-neon-magenta/40',
    color: 'text-neon-magenta',
  },
  reminder_late: {
    label: '📣 迟到催促',
    icon: Megaphone,
    bg: 'from-neon-orange/20 via-neon-orange/10 to-transparent',
    border: 'border-neon-orange/40',
    color: 'text-neon-orange',
  },
  reminder_ride_share: {
    label: '🚗 网约车提醒',
    icon: CarFront,
    bg: 'from-neon-blue/20 via-neon-blue/10 to-transparent',
    border: 'border-neon-blue/40',
    color: 'text-neon-blue',
  },
}

const getReminderMeta = (type: NotificationType) => {
  if (isReminderType(type)) {
    return (
      reminderMeta[type] || {
        label: '🔔 提醒消息',
        icon: Bell,
        bg: 'from-neon-magenta/20 via-neon-magenta/10 to-transparent',
        border: 'border-neon-magenta/40',
        color: 'text-neon-magenta',
      }
    )
  }
  return null
}

export default function CheckIn() {
  const { id } = useParams<{ id: string }>()
  const { activity, notifications, setPlayerStatus, sendReminder } = useStore((s) => {
    const a = s.activities.find((act) => act.id === id)
    return {
      activity: a,
      notifications: s.notifications.filter((n) => n.activityId === id),
      setPlayerStatus: s.setPlayerStatus,
      sendReminder: s.sendReminder,
    }
  })

  const [activeFilter, setActiveFilter] = useState<'all' | CheckinStatus>('all')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  const stats = useMemo(() => {
    const base: Record<CheckinStatus, number> = {
      arrived: 0,
      late: 0,
      ride_share: 0,
      not_arrived: 0,
    }
    if (!activity) return base
    for (const p of activity.players) {
      base[p.checkinStatus] = (base[p.checkinStatus] || 0) + 1
    }
    return base
  }, [activity])

  const filteredPlayers = useMemo(() => {
    if (!activity) return []
    if (activeFilter === 'all') return activity.players
    return activity.players.filter((p) => p.checkinStatus === activeFilter)
  }, [activity, activeFilter])

  if (!activity) {
    return (
      <div className="min-h-screen bg-ink-night flex items-center justify-center text-neon-lavender">
        活动不存在
      </div>
    )
  }

  const reminderTargets = [
    {
      key: 'not_arrived' as const,
      label: '未到',
      count: stats.not_arrived,
      icon: Clock,
      bg: 'bg-neon-magenta/15',
      border: 'border-neon-magenta/40',
      hover: 'hover:bg-neon-magenta/25',
      color: 'text-neon-magenta',
    },
    {
      key: 'late' as const,
      label: '迟到',
      count: stats.late,
      icon: AlertTriangle,
      bg: 'bg-neon-orange/15',
      border: 'border-neon-orange/40',
      hover: 'hover:bg-neon-orange/25',
      color: 'text-neon-orange',
    },
    {
      key: 'ride_share' as const,
      label: '网约车',
      count: stats.ride_share,
      icon: CarFront,
      bg: 'bg-neon-blue/15',
      border: 'border-neon-blue/40',
      hover: 'hover:bg-neon-blue/25',
      color: 'text-neon-blue',
    },
  ]

  return (
    <div className="min-h-screen bg-ink-night pb-24">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.9 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl font-semibold backdrop-blur-md shadow-lg animate-slide-down ${
              toast.type === 'success'
                ? 'bg-neon-green/90 text-ink-deep shadow-neon-green/40'
                : 'bg-neon-red/90 text-ink-deep shadow-neon-red/40'
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="glass-card sticky top-0 z-40 px-5 pt-6 pb-5 border-b border-neon-magenta/10">
        <h1 className="text-2xl font-display text-neon-magenta mb-1 truncate">
          {activity.scriptName}
        </h1>
        <div className="flex items-center gap-3 text-xs text-neon-lavender/70">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {format(new Date(activity.startTime), 'MM/dd HH:mm')}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {activity.storeName.split('·')[1] || activity.storeName}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {activity.currentPlayers}/{activity.maxPlayers}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-5">
          {(Object.keys(statusMeta) as CheckinStatus[]).map((key) => {
            const meta = statusMeta[key]
            const Icon = meta.icon
            const active = activeFilter === key
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(active ? 'all' : key)}
                className={`relative rounded-2xl p-3 transition-all border ${
                  active
                    ? `${meta.bg} ${meta.border || ''} scale-[1.02]`
                    : 'border-transparent hover:border-neon-magenta/20'
                }`}
              >
                <Icon className={`w-5 h-5 mx-auto mb-1 ${meta.color}`} />
                <div className={`text-xl font-bold ${meta.color}`}>{stats[key]}</div>
                <div className="text-[10px] text-neon-lavender/70">{meta.label}</div>
                {active && (
                  <motion.div
                    layoutId="checkin-filter-dot"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-neon-magenta"
                  />
                )}
              </button>
            )
          })}
        </div>
      </header>

      <main className="px-4 pt-6 space-y-6">
        <section className="glass-card rounded-3xl p-5 border-2 border-neon-magenta/30 shadow-[0_0_40px_rgba(233,69,96,0.08)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-neon-magenta to-neon-orange/80 text-ink-deep shadow-lg shadow-neon-magenta/30">
              <Megaphone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-xl text-neon-magenta">发车前提醒</h2>
              <p className="text-xs text-neon-lavender/70 mt-0.5">
                局头一键催促对应状态的玩家
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {reminderTargets.map((t) => {
              const Icon = t.icon
              const disabled = t.count === 0
              return (
                <button
                  key={t.key}
                  disabled={disabled}
                  onClick={() => {
                    const n = sendReminder(activity.id, t.key)
                    showToast('success', `已向 ${n} 位${t.label}玩家发送提醒`)
                  }}
                  className={`relative flex flex-col items-center p-3.5 rounded-2xl border-2 transition-all ${
                    disabled
                      ? 'opacity-40 cursor-not-allowed border-neon-lavender/10 bg-ink-deep/40'
                      : `${t.bg} ${t.border} ${t.hover} active:scale-[0.97] shadow-[0_0_25px_rgba(0,0,0,0.3)]`
                  }`}
                >
                  <div className={`${disabled ? 'text-neon-lavender/40' : t.color} mb-1.5 relative`}>
                    <Icon className="w-6 h-6" />
                    {!disabled && t.count > 0 && (
                      <span className="absolute -top-2 -right-3 px-1.5 py-0.5 rounded-full bg-neon-red text-white text-[9px] font-bold shadow-md">
                        {t.count}
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-xs font-semibold ${
                      disabled ? 'text-neon-lavender/40' : t.color
                    }`}
                  >
                    催{t.label}
                  </div>
                  <div className="text-[10px] text-neon-lavender/50 mt-0.5">
                    {disabled ? `无人${t.label}` : `${t.count}人待催`}
                  </div>
                </button>
              )
            })}
          </div>
          <div className="mt-4 px-3 py-2 rounded-xl bg-ink-deep/60 border border-neon-lavender/10 flex items-start gap-2">
            <Bell className="w-4 h-4 text-neon-gold shrink-0 mt-0.5" />
            <p className="text-[11px] text-neon-lavender/60 leading-relaxed">
              玩家会收到对应提醒推送，下方时间线会自动记录每一条提醒消息，并使用粉/橙/蓝霓虹色明显区分于普通状态变更
            </p>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between px-1 mb-3">
            <h2 className="font-display text-lg text-neon-lavender">
              {activeFilter === 'all'
                ? `全部玩家 (${activity.players.length})`
                : `${statusMeta[activeFilter].label} (${filteredPlayers.length})`}
            </h2>
            {activeFilter !== 'all' && (
              <button
                onClick={() => setActiveFilter('all')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ink-deep/60 text-xs text-neon-lavender/70 hover:text-neon-magenta"
              >
                <RefreshCw className="w-3 h-3" />
                清除筛选
              </button>
            )}
          </div>
          <div className="space-y-2.5">
            {filteredPlayers.map((p) => {
              const meta = statusMeta[p.checkinStatus]
              const Icon = meta.icon
              const isDriver = activity.carOffers.some(
                (co) => co.driver.id === p.user.id && co.status !== 'cancelled'
              )
              return (
                <motion.div
                  key={p.user.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`glass-card rounded-2xl p-3.5 border ${meta.bg} ${
                    meta.ring ? '' : 'border-neon-lavender/10'
                  } relative overflow-hidden group transition-all hover:border-neon-magenta/30`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={p.user.avatar}
                        alt={p.user.nickname}
                        className={`w-11 h-11 rounded-full object-cover ring-2 ${meta.ring}`}
                      />
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 flex items-center justify-center rounded-full border-2 border-ink-night ${meta.bg}`}
                      >
                        <Icon className={`w-3 h-3 ${meta.color}`} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-neon-lavender truncate">
                          {p.user.nickname}
                        </span>
                        {isDriver && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neon-gold/15 text-neon-gold text-[10px] border border-neon-gold/30">
                            🚗 车主
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neon-lavender/60 mt-0.5 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" />
                        {p.pickupArea || '未指定上车区域'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {(
                        [
                          'arrived',
                          'late',
                          'ride_share',
                          'not_arrived',
                        ] as CheckinStatus[]
                      )
                        .filter((s) => s !== p.checkinStatus)
                        .map((s) => {
                          const sMeta = statusMeta[s]
                          const SIcon = sMeta.icon
                          return (
                            <button
                              key={s}
                              onClick={() =>
                                setPlayerStatus(activity.id, p.user.id, s)
                              }
                              className={`p-2 rounded-xl border border-transparent ${sMeta.bg} ${sMeta.color} opacity-0 group-hover:opacity-100 hover:brightness-125 hover:border-current/30 transition-all`}
                              title={`标记为${sMeta.label}`}
                            >
                              <SIcon className="w-4 h-4" />
                            </button>
                          )
                        })}
                      <button
                        onClick={() => setPlayerStatus(activity.id, p.user.id, 'arrived')}
                        className={`p-2 rounded-xl ${meta.bg} ${meta.color} opacity-100 md:opacity-0 group-hover:opacity-100 hover:brightness-125 transition-all`}
                        title="打卡"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
            {filteredPlayers.length === 0 && (
              <div className="glass-card rounded-3xl p-10 text-center border border-dashed border-neon-lavender/20">
                <Users className="w-12 h-12 mx-auto mb-3 text-neon-lavender/30" />
                <p className="text-sm text-neon-lavender/50">没有符合条件的玩家</p>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between px-1 mb-3">
            <h2 className="font-display text-lg text-neon-lavender">
              通知与状态时间线
            </h2>
            <span className="text-xs text-neon-lavender/50">
              {notifications.length} 条记录
            </span>
          </div>
          <div className="space-y-0 pb-8">
            {notifications.length === 0 && (
              <div className="glass-card rounded-3xl p-10 text-center border border-dashed border-neon-lavender/20">
                <Send className="w-12 h-12 mx-auto mb-3 text-neon-lavender/30" />
                <p className="text-sm text-neon-lavender/50">暂无通知与状态变更</p>
              </div>
            )}
            {notifications.map((n, idx) => {
              const isReminder = isReminderType(n.type)
              const rm = getReminderMeta(n.type)
              const isSummary = n.id.startsWith('n_r_summary')
              const RIcon = rm ? rm.icon : Bell
              return (
                <div key={n.id} className="relative pl-8 pb-5 last:pb-0">
                  {idx < notifications.length - 1 && (
                    <div
                      className={`absolute left-[15px] top-8 w-px h-[calc(100%+4px)] ${
                        isReminder ? 'bg-neon-magenta/30' : 'bg-neon-lavender/15'
                      }`}
                    />
                  )}

                  <div
                    className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      isReminder
                        ? `bg-gradient-to-br ${rm!.bg} border-2 ${rm!.border} shadow-[0_0_18px_rgba(233,69,96,0.35)]`
                        : 'bg-ink-deep border-2 border-neon-lavender/20'
                    }`}
                  >
                    <RIcon
                      className={`w-4 h-4 ${
                        isReminder ? rm!.color : 'text-neon-lavender/70'
                      }`}
                    />
                  </div>

                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className={`relative rounded-2xl overflow-hidden ${
                      isReminder
                        ? `bg-gradient-to-br ${rm!.bg} border-2 ${rm!.border}`
                        : 'glass-card border border-neon-lavender/10'
                    }`}
                  >
                    {isReminder && (
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-neon-magenta/60 to-transparent" />
                    )}
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={n.user.avatar}
                          alt={n.user.nickname}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span
                              className={`text-sm font-medium ${
                                isReminder ? rm!.color : 'text-neon-lavender'
                              }`}
                            >
                              {n.user.nickname}
                            </span>
                            {isReminder && rm && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${rm.bg} ${rm.color} border ${rm.border}`}
                              >
                                {isSummary ? '📣' : '🔔'} {rm.label.replace(/^[🔔📣🚗]\s?/, '')}
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-sm leading-relaxed ${
                              isReminder
                                ? 'text-neon-lavender/90 font-medium'
                                : 'text-neon-lavender/80'
                            }`}
                          >
                            {n.content}
                          </p>
                          <p className="text-[11px] text-neon-lavender/40 mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(n.timestamp), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
