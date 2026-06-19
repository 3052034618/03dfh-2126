import { useNavigate } from 'react-router-dom'
import { Car, Calendar, Bell, Settings, ChevronRight, User } from 'lucide-react'
import { useStore } from '@/store/useStore'
import UserAvatar from '@/components/UserAvatar'
import BottomNav from '@/components/BottomNav'

export default function Profile() {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const activities = useStore((s) => s.activities)
  const notifications = useStore((s) => s.notifications)

  const myActivities = activities.filter(
    (a) => a.organizer.id === currentUser.id || a.players.some((p) => p.user.id === currentUser.id)
  )
  const myCarOffers = activities.filter((a) =>
    a.carOffers.some((co) => co.driver.id === currentUser.id)
  )
  const unreadNotifications = notifications.length

  const menuItems = [
    { icon: Calendar, label: '我的活动', value: myActivities.length, color: 'text-neon-pink' },
    { icon: Car, label: '我的车源', value: myCarOffers.length, color: 'text-neon-gold' },
    { icon: Bell, label: '通知消息', value: unreadNotifications, color: 'text-neon-blue' },
    { icon: Settings, label: '设置', value: null, color: 'text-gray-400' },
  ]

  return (
    <div className="min-h-screen bg-night-900 pb-20">
      <div className="bg-night-800/50 border-b border-neon-pink/5">
        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-pink to-neon-pinkLight flex items-center justify-center text-white text-3xl font-bold font-display shadow-lg shadow-neon-pink/20">
              {currentUser.nickname.slice(0, 1)}
            </div>
            <div>
              <h2 className="font-display text-2xl text-white">{currentUser.nickname}</h2>
              <div className="flex items-center gap-2 mt-1">
                {currentUser.isCarOwner && (
                  <span className="flex items-center gap-1 text-xs bg-neon-pink/20 text-neon-pink px-2 py-0.5 rounded-full">
                    <Car size={10} /> 车主
                  </span>
                )}
                <span className="text-xs text-gray-500">局头</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4">
        <div className="glass-card divide-y divide-night-700/50">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center justify-between p-4 hover:bg-night-700/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} className={item.color} />
                <span className="text-gray-300">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.value !== null && (
                  <span className="text-sm text-gray-500">{item.value}</span>
                )}
                <ChevronRight size={16} className="text-gray-600" />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6">
          <h3 className="font-display text-lg text-white mb-3">我参与的活动</h3>
          <div className="space-y-3">
            {myActivities.length > 0 ? (
              myActivities.map((activity) => (
                <button
                  key={activity.id}
                  onClick={() => navigate(`/activity/${activity.id}`)}
                  className="w-full text-left glass-card p-4 hover:neon-border transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">{activity.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{activity.scriptName} · {activity.storeName}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-600" />
                  </div>
                </button>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">还没有参与的活动</p>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
