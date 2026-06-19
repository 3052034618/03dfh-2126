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
  ChevronUp,
  UserCheck,
  RefreshCw,
  Megaphone,
  CarFront,
  Eye,
  EyeOff,
  MessageCircle,
  X,
  CheckCircle2,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '@/store/useStore'
import type { CheckinStatus, NotificationType, ReminderBatch, ReminderTarget } from '@/types'

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
    color: 'text-neon-magenta',
    bg: 'bg-neon-magenta/5',
    ring: 'ring-neon-magenta/40',
    border: 'border-neon-magenta/20',
  },
}

const isReminderType = (t: NotificationType) =>
  t === 'reminder_not_arrived' || t === 'reminder_late' || t === 'reminder_ride_share'

const targetToNotifType: Record<ReminderTarget, 'reminder_not_arrived' | 'reminder_late' | 'reminder_ride_share'> = {
  not_arrived: 'reminder_not_arrived',
  late: 'reminder_late',
  ride_share: 'reminder_ride_share',
  all: 'reminder_not_arrived',
}

const reminderMeta: Record<string, { label: string; short: string; icon: typeof Bell; bg: string; border: string; color: string; gradient: string }> = {
  reminder_not_arrived: {
    label: '🔔 未到提醒',
    short: '未到提醒',
    icon: Bell,
    bg: 'bg-neon-magenta/15',
    border: 'border-neon-magenta/40',
    color: 'text-neon-magenta',
    gradient: 'from-neon-magenta/25 via-neon-magenta/10 to-transparent',
  },
  reminder_late: {
    label: '📣 迟到催促',
    short: '迟到催促',
    icon: Megaphone,
    bg: 'bg-neon-orange/15',
    border: 'border-neon-orange/40',
    color: 'text-neon-orange',
    gradient: 'from-neon-orange/25 via-neon-orange/10 to-transparent',
  },
  reminder_ride_share: {
    label: '🚗 网约车提醒',
    short: '网约车提醒',
    icon: CarFront,
    bg: 'bg-neon-blue/15',
    border: 'border-neon-blue/40',
    color: 'text-neon-blue',
    gradient: 'from-neon-blue/25 via-neon-blue/10 to-transparent',
  },
}

const getReminderMeta = (type: NotificationType) => {
  if (isReminderType(type)) {
    return (
      reminderMeta[type] || {
        label: '🔔 提醒消息',
        short: '提醒',
        icon: Bell,
        bg: 'bg-neon-magenta/15',
        border: 'border-neon-magenta/40',
        color: 'text-neon-magenta',
        gradient: 'from-neon-magenta/25 via-neon-magenta/10 to-transparent',
      }
    )
  }
  return null
}

export default function CheckIn() {
  const { id } = useParams<{ id: string }>()
  const { activity, notifications, setPlayerStatus, sendReminder, markReminderRead, replyReminderEta, currentUser } = useStore((s) => {
    const a = s.activities.find((act) => act.id === id)
    return {
      activity: a,
      notifications: s.notifications.filter((n) => n.activityId === id),
      setPlayerStatus: s.setPlayerStatus,
      sendReminder: s.sendReminder,
      markReminderRead: s.markReminderRead,
      replyReminderEta: s.replyReminderEta,
      currentUser: s.currentUser,
    }
  })

  const [activeFilter, setActiveFilter] = useState<'all' | CheckinStatus>('all')
  const [batchFilter, setBatchFilter] = useState<'all' | 'reminder_not_arrived' | 'reminder_late' | 'reminder_ride_share'>('all')
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null)
  const [replyingBatch, setReplyingBatch] = useState<string | null>(null)
  const [replyingUserId, setReplyingUserId] = useState<string | null>(null)
  const [etaText, setEtaText] = useState('')
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

  const reminderBatches = useMemo(() => {
    if (!activity) return [] as ReminderBatch[]
    if (batchFilter === 'all') return activity.reminderBatches
    return activity.reminderBatches.filter((b) => b.notificationType === batchFilter)
  }, [activity, batchFilter])

  const batchStats = useMemo(() => {
    const base = { total: 0, read: 0, replied: 0 }
    if (!activity) return base
    for (const b of activity.reminderBatches) {
      for (const r of b.receipts) {
        base.total += 1
        if (r.read) base.read += 1
        if (r.replyEta) base.replied += 1
      }
    }
    return base
  }, [activity])

  const userById = useMemo(() => {
    const m = new Map<string, { nickname: string; avatar: string }>()
    if (activity) {
      for (const p of activity.players) {
        m.set(p.user.id, { nickname: p.user.nickname, avatar: p.user.avatar })
      }
    }
    return m
  }, [activity])

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

  const handleReply = (batchId: string, userId: string) => {
    if (!etaText.trim()) {
      showToast('error', '请输入预计到达时间')
      return
    }
    replyReminderEta(activity.id, batchId, userId, etaText.trim())
    showToast('success', '已回复预计到达时间')
    setReplyingBatch(null)
    setReplyingUserId(null)
    setEtaText('')
  }

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
              玩家会收到对应提醒推送，下方时间线会自动记录每一条提醒消息，回执流可查看已读和预计到达时间回复
            </p>
          </div>
        </section>

        <section className="glass-card rounded-3xl p-5 border border-neon-gold/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-neon-gold/15 text-neon-gold">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-lg text-neon-gold">提醒回执流</h2>
                <p className="text-[11px] text-neon-lavender/60 mt-0.5">
                  已发 {batchStats.total} 条 · 已读 {batchStats.read} · 已回复ETA {batchStats.replied}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 p-1 rounded-2xl bg-ink-deep/60 border border-neon-lavender/10 mb-4 overflow-x-auto">
            {(['all', 'reminder_not_arrived', 'reminder_late', 'reminder_ride_share'] as const).map((k) => {
              const isAll = k === 'all'
              const rm = isAll ? null : reminderMeta[k]
              const label = isAll ? '全部' : rm?.short || k
              const active = batchFilter === k
              return (
                <button
                  key={k}
                  onClick={() => setBatchFilter(k)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    active
                      ? isAll
                        ? 'bg-neon-lavender/20 text-neon-lavender border border-neon-lavender/30'
                        : `${rm?.bg} ${rm?.color} border ${rm?.border}`
                      : 'text-neon-lavender/60 hover:text-neon-lavender border border-transparent'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {reminderBatches.length === 0 ? (
            <div className="text-center py-8 text-neon-lavender/40 text-sm">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-40" />
              还没有发送过提醒
            </div>
          ) : (
            <div className="space-y-3">
              {reminderBatches.map((batch) => {
                const rm = getReminderMeta(batch.notificationType)
                if (!rm) return null
                const RIcon = rm.icon
                const readCount = batch.receipts.filter((r) => r.read).length
                const replyCount = batch.receipts.filter((r) => r.replyEta).length
                const expanded = expandedBatch === batch.id
                return (
                  <div
                    key={batch.id}
                    className={`rounded-2xl overflow-hidden border-2 ${rm.border}`}
                  >
                    <button
                      onClick={() => setExpandedBatch(expanded ? null : batch.id)}
                      className={`w-full p-3.5 flex items-center justify-between gap-3 bg-gradient-to-br ${rm.gradient}`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`p-2 rounded-xl ${rm.bg} ${rm.color} shrink-0`}>
                          <RIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <div className={`text-sm font-semibold ${rm.color}`}>
                            {rm.label}
                          </div>
                          <div className="text-[11px] text-neon-lavender/60 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />{batch.receipts.length}人
                            </span>
                            <span className="flex items-center gap-1 text-neon-green">
                              <Eye className="w-3 h-3" />{readCount}已读
                            </span>
                            <span className="flex items-center gap-1 text-neon-gold">
                              <MessageCircle className="w-3 h-3" />{replyCount}回复
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(batch.sentAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      {expanded ? (
                        <ChevronUp className={`w-4 h-4 shrink-0 ${rm.color}`} />
                      ) : (
                        <ChevronDown className={`w-4 h-4 shrink-0 ${rm.color}`} />
                      )}
                    </button>

                    <AnimatePresence>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-ink-deep/40"
                        >
                          <div className="p-3 space-y-2">
                            {batch.receipts.map((r) => {
                              const u = userById.get(r.userId)
                              if (!u) return null
                              const isReplyingThis = replyingBatch === batch.id && replyingUserId === r.userId
                              return (
                                <div
                                  key={r.userId}
                                  className={`p-2.5 rounded-xl border flex items-center gap-3 ${
                                    r.replyEta
                                      ? 'bg-neon-gold/8 border-neon-gold/25'
                                      : r.read
                                      ? 'bg-neon-green/8 border-neon-green/25'
                                      : 'bg-neon-magenta/5 border-neon-magenta/20'
                                  }`}
                                >
                                  <img src={u.avatar} alt={u.nickname} className="w-9 h-9 rounded-full object-cover shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-neon-lavender flex items-center gap-2">
                                      {u.nickname}
                                      {r.read ? (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-neon-green/15 text-neon-green text-[10px] border border-neon-green/30">
                                          <Eye className="w-3 h-3" />已读
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-neon-magenta/15 text-neon-magenta text-[10px] border border-neon-magenta/30">
                                          <EyeOff className="w-3 h-3" />未读
                                        </span>
                                      )}
                                    </div>
                                    {r.replyEta ? (
                                      <div className="text-[11px] text-neon-gold mt-0.5 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        预计：{r.replyEta}
                                        {r.repliedAt && (
                                          <span className="text-neon-lavender/40 ml-1">
                                            ({formatDistanceToNow(new Date(r.repliedAt), { addSuffix: true })})
                                          </span>
                                        )}
                                      </div>
                                    ) : r.read ? (
                                      <div className="text-[11px] text-neon-lavender/50 mt-0.5">
                                        已读但未回复到达时间
                                      </div>
                                    ) : (
                                      <div className="text-[11px] text-neon-lavender/50 mt-0.5">
                                        尚未查看提醒
                                      </div>
                                    )}

                                    {isReplyingThis ? (
                                      <div className="mt-2 flex items-center gap-2">
                                        <input
                                          autoFocus
                                          value={etaText}
                                          onChange={(e) => setEtaText(e.target.value)}
                                          placeholder="例如：10分钟后 / 19:30"
                                          className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-ink-deep border border-neon-gold/30 text-neon-lavender placeholder:text-neon-lavender/40 focus:outline-none focus:border-neon-gold"
                                        />
                                        <button
                                          onClick={() => handleReply(batch.id, r.userId)}
                                          className="px-3 py-1.5 rounded-lg bg-neon-gold text-ink-deep text-xs font-semibold hover:brightness-110"
                                        >
                                          回复
                                        </button>
                                        <button
                                          onClick={() => { setReplyingBatch(null); setReplyingUserId(null); setEtaText('') }}
                                          className="p-1.5 rounded-lg bg-ink-deep border border-neon-lavender/20 text-neon-lavender/60 hover:text-neon-lavender"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : null}
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {!r.read && (
                                      <button
                                        onClick={() => {
                                          markReminderRead(activity.id, batch.id, r.userId)
                                          showToast('success', '已标记为已读')
                                        }}
                                        className="p-1.5 rounded-lg bg-neon-green/15 text-neon-green border border-neon-green/30 hover:bg-neon-green/25"
                                        title="标记已读"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {!r.replyEta && !isReplyingThis && (
                                      <button
                                        onClick={() => {
                                          setReplyingBatch(batch.id)
                                          setReplyingUserId(r.userId)
                                          setEtaText('')
                                        }}
                                        className="p-1.5 rounded-lg bg-neon-gold/15 text-neon-gold border border-neon-gold/30 hover:bg-neon-gold/25"
                                        title="回复ETA"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          )}
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
              const playerBatches = activity.reminderBatches
                .map((b) => ({ batch: b, receipt: b.receipts.find((r) => r.userId === p.user.id) }))
                .filter((x) => x.receipt)
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
                        {playerBatches.slice(0, 3).map(({ batch, receipt }) => {
                          const rm = getReminderMeta(batch.notificationType)
                          if (!rm) return null
                          return (
                            <span
                              key={batch.id}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] border ${rm.bg} ${rm.color} ${rm.border}`}
                              title={rm.short}
                            >
                              {receipt?.replyEta ? (
                                <Clock className="w-3 h-3" />
                              ) : receipt?.read ? (
                                <Eye className="w-3 h-3" />
                              ) : (
                                <EyeOff className="w-3 h-3" />
                              )}
                              {rm.short.replace('提醒', '').replace('催促', '')}
                            </span>
                          )
                        })}
                      </div>
                      <div className="text-xs text-neon-lavender/60 mt-0.5 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" />
                        {p.pickupArea || '未指定上车区域'}
                      </div>
                      {playerBatches.some((x) => x.receipt?.replyEta) && (
                        <div className="text-[11px] text-neon-gold mt-0.5 flex items-center gap-1 flex-wrap">
                          {playerBatches
                            .filter((x) => x.receipt?.replyEta)
                            .map(({ batch, receipt }) => (
                              <span key={batch.id} className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                预计{receipt?.replyEta}
                              </span>
                            ))}
                        </div>
                      )}
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
                        isReminder ? (rm ? rm.border.replace('border-', 'bg-').replace('/40', '/30') : 'bg-neon-magenta/30') : 'bg-neon-lavender/15'
                      }`}
                    />
                  )}

                  <div
                    className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      isReminder
                        ? `bg-gradient-to-br ${rm!.gradient} border-2 ${rm!.border} shadow-[0_0_18px_rgba(233,69,96,0.35)]`
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
                        ? `bg-gradient-to-br ${rm!.gradient} border-2 ${rm!.border}`
                        : 'glass-card border border-neon-lavender/10'
                    }`}
                  >
                    {isReminder && (
                      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-current/60 to-transparent ${rm!.color}`} />
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
