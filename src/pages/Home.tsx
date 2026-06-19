import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { scriptTypes } from '@/data/mock'
import ActivityCard from '@/components/ActivityCard'
import BottomNav from '@/components/BottomNav'

export default function Home() {
  const navigate = useNavigate()
  const activities = useStore((s) => s.activities)
  const [searchText, setSearchText] = useState('')
  const [activeType, setActiveType] = useState('全部')

  const filtered = activities.filter((a) => {
    const matchSearch =
      !searchText ||
      a.title.includes(searchText) ||
      a.scriptName.includes(searchText) ||
      a.storeName.includes(searchText)
    const matchType = activeType === '全部' || a.scriptType === activeType
    return matchSearch && matchType
  })

  return (
    <div className="min-h-screen bg-night-900 pb-20">
      <div className="sticky top-0 z-40 bg-night-900/90 backdrop-blur-lg">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-3">
          <h1 className="font-display text-3xl neon-text mb-4">拼车剧本杀</h1>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="搜索剧本、店名..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="dark-input pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {scriptTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  activeType === type
                    ? 'bg-neon-gradient text-white shadow-[0_0_12px_rgba(233,69,96,0.3)]'
                    : 'bg-night-700 text-gray-400 hover:text-gray-200 border border-night-500/50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-3 mt-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((activity, i) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              layout
            >
              <ActivityCard activity={activity} />
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg mb-2">没有找到活动</p>
            <p className="text-sm">换个关键词试试？</p>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/create')}
        className="fixed right-4 bottom-24 w-14 h-14 bg-neon-gradient rounded-full flex items-center justify-center shadow-lg animate-pulse-glow z-30 hover:scale-110 transition-transform"
      >
        <Plus size={24} className="text-white" />
      </button>

      <BottomNav />
    </div>
  )
}
