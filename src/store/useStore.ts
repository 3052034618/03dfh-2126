import { create } from 'zustand'
import type { Activity, CarOffer, AppNotification, FleetGroup, Player, CheckinStatus, FleetPassenger, FleetCar } from '@/types'
import { mockActivities, mockNotifications, mockUsers } from '@/data/mock'

interface AppState {
  activities: Activity[]
  notifications: AppNotification[]
  currentUser: typeof mockUsers[0]
  addActivity: (activity: Activity) => string
  addCarOffer: (offer: CarOffer, pickupArea: string) => void
  confirmCarOffer: (activityId: string, offerId: string) => void
  cancelCarOffer: (activityId: string, offerId: string) => void
  generateFleetGroups: (activityId: string) => void
  checkin: (activityId: string, userId: string) => void
  setPlayerStatus: (activityId: string, userId: string, status: CheckinStatus) => void
  updatePlayerPickupArea: (activityId: string, userId: string, area: string) => void
  addNotification: (notification: AppNotification) => void
  getActivity: (id: string) => Activity | undefined
}

export const useStore = create<AppState>((set, get) => ({
  activities: mockActivities,
  notifications: mockNotifications,
  currentUser: mockUsers[0],

  addActivity: (activity) => {
    set((state) => ({
      activities: [activity, ...state.activities],
    }))
    return activity.id
  },

  addCarOffer: (offer, pickupArea) =>
    set((state) => {
      const activity = state.activities.find((a) => a.id === offer.activityId)
      if (!activity) return state

      const alreadyInPlayers = activity.players.some((p) => p.user.id === offer.driver.id)

      let newPlayers: Player[]
      let newCurrentPlayers = activity.currentPlayers

      if (alreadyInPlayers) {
        newPlayers = activity.players.map((p) =>
          p.user.id === offer.driver.id
            ? { ...p, carOfferId: offer.id, pickupArea: pickupArea || p.pickupArea }
            : p
        )
      } else {
        newPlayers = [
          ...activity.players,
          {
            user: offer.driver,
            checkinStatus: 'not_arrived',
            pickupArea,
            carOfferId: offer.id,
          },
        ]
        newCurrentPlayers = activity.currentPlayers + 1
      }

      return {
        activities: state.activities.map((a) =>
          a.id === offer.activityId
            ? {
                ...a,
                carOffers: [...a.carOffers, offer],
                players: newPlayers,
                currentPlayers: newCurrentPlayers,
              }
            : a
        ),
        notifications: [
          {
            id: `n_${Date.now()}`,
            activityId: offer.activityId,
            type: 'car_offer',
            content: `${offer.driver.nickname} 提供了车源（${pickupArea}出发，可坐${offer.availableSeats}人）`,
            user: offer.driver,
            timestamp: new Date().toISOString(),
          },
          ...state.notifications,
        ],
      }
    }),

  confirmCarOffer: (activityId, offerId) =>
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === activityId
          ? {
              ...a,
              carOffers: a.carOffers.map((co) =>
                co.id === offerId ? { ...co, status: 'confirmed' } : co
              ),
            }
          : a
      ),
    })),

  cancelCarOffer: (activityId, offerId) =>
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === activityId
          ? {
              ...a,
              carOffers: a.carOffers.map((co) =>
                co.id === offerId ? { ...co, status: 'cancelled' } : co
              ),
            }
          : a
      ),
    })),

  generateFleetGroups: (activityId) => {
    const activity = get().activities.find((a) => a.id === activityId)
    if (!activity) return

    const confirmedOffers = activity.carOffers.filter((co) => co.status === 'confirmed')
    const playersNeedingRide: Player[] = activity.players.filter(
      (p) =>
        p.checkinStatus !== 'ride_share' &&
        !confirmedOffers.some((co) => co.driver.id === p.user.id)
    )

    const areaToPlayers = new Map<string, FleetPassenger[]>()
    for (const pl of playersNeedingRide) {
      const area = pl.pickupArea || '未指定'
      if (!areaToPlayers.has(area)) areaToPlayers.set(area, [])
      areaToPlayers.get(area)!.push({ user: pl.user, pickupArea: area })
    }

    const sortedAreas = [...areaToPlayers.keys()].sort((a, b) => {
      const countA = areaToPlayers.get(a)!.length
      const countB = areaToPlayers.get(b)!.length
      return countB - countA
    })

    const carsWithArea = confirmedOffers.map((co) => ({
      car: co,
      passengers: [] as FleetPassenger[],
      remaining: co.availableSeats - 1,
    }))

    const areaDistances: Record<string, number> = {}
    sortedAreas.forEach((a, i) => (areaDistances[a] = i))

    carsWithArea.sort((a, b) => {
      const da = areaDistances[a.car.pickupArea] ?? 999
      const db = areaDistances[b.car.pickupArea] ?? 999
      return da - db
    })

    for (const area of sortedAreas) {
      const passengers = areaToPlayers.get(area)!
      let pi = 0
      while (pi < passengers.length) {
        const car = carsWithArea.find((c) => c.remaining > 0)
        if (!car) break
        car.passengers.push(passengers[pi])
        car.remaining -= 1
        pi += 1
      }
    }

    const outboundCars: FleetCar[] = carsWithArea.map((cw) => {
      const areas = Array.from(new Set([cw.car.pickupArea, ...cw.passengers.map((p) => p.pickupArea)]))
      const storeShort = activity.storeName.split('·')[1] || activity.storeName
      return {
        carOfferId: cw.car.id,
        driver: cw.car.driver,
        driverPickupArea: cw.car.pickupArea,
        passengers: cw.passengers,
        route: `${areas.join('、')} → ${storeShort}`,
      }
    })

    const returnCars: FleetCar[] = carsWithArea
      .filter((cw) => cw.car.waitAfterGame)
      .map((cw) => {
        const areas = Array.from(new Set([cw.car.pickupArea, ...cw.passengers.map((p) => p.pickupArea)]))
        const storeShort = activity.storeName.split('·')[1] || activity.storeName
        return {
          carOfferId: cw.car.id,
          driver: cw.car.driver,
          driverPickupArea: cw.car.pickupArea,
          passengers: cw.passengers,
          route: `${storeShort} → ${areas.join('、')}`,
        }
      })

    const fleetGroups: FleetGroup[] = []

    if (outboundCars.length > 0) {
      fleetGroups.push({
        id: `fg_out_${Date.now()}`,
        activityId,
        type: 'outbound',
        cars: outboundCars,
        meetingPoint: activity.storeAddress,
        departureTime: new Date(
          new Date(activity.startTime).getTime() - 60 * 60 * 1000
        ).toISOString(),
      })
    }

    if (returnCars.length > 0) {
      fleetGroups.push({
        id: `fg_ret_${Date.now() + 1}`,
        activityId,
        type: 'return',
        cars: returnCars,
        meetingPoint: activity.storeAddress,
        departureTime: new Date(
          new Date(activity.startTime).getTime() + 5 * 60 * 60 * 1000
        ).toISOString(),
      })
    }

    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === activityId ? { ...a, fleetGroups } : a
      ),
    }))
  },

  checkin: (activityId, userId) =>
    set((state) => {
      const activity = state.activities.find((a) => a.id === activityId)
      const player = activity?.players.find((p) => p.user.id === userId)
      if (!activity || !player) return state
      return {
        activities: state.activities.map((a) =>
          a.id === activityId
            ? {
                ...a,
                players: a.players.map((p) =>
                  p.user.id === userId ? { ...p, checkinStatus: 'arrived' } : p
                ),
              }
            : a
        ),
        notifications: [
          {
            id: `n_${Date.now()}`,
            activityId,
            type: 'checkin',
            content: `${player.user.nickname} 已到达集合点`,
            user: player.user,
            timestamp: new Date().toISOString(),
          },
          ...state.notifications,
        ],
      }
    }),

  setPlayerStatus: (activityId, userId, status) =>
    set((state) => {
      const activity = state.activities.find((a) => a.id === activityId)
      const player = activity?.players.find((p) => p.user.id === userId)
      if (!activity || !player) return state

      let notifType: AppNotification['type'] = 'change'
      let content = `${player.user.nickname} 更新了状态`
      if (status === 'late') {
        notifType = 'late'
        content = `${player.user.nickname} 标记为迟到`
      } else if (status === 'ride_share') {
        notifType = 'ride_change'
        content = `${player.user.nickname} 改坐网约车前往`
      } else if (status === 'not_arrived') {
        notifType = 'restore'
        content = `${player.user.nickname} 恢复为未到状态`
      } else if (status === 'arrived') {
        notifType = 'checkin'
        content = `${player.user.nickname} 已到达集合点`
      }

      return {
        activities: state.activities.map((a) =>
          a.id === activityId
            ? {
                ...a,
                players: a.players.map((p) =>
                  p.user.id === userId ? { ...p, checkinStatus: status } : p
                ),
              }
            : a
        ),
        notifications: [
          {
            id: `n_${Date.now()}`,
            activityId,
            type: notifType,
            content,
            user: player.user,
            timestamp: new Date().toISOString(),
          },
          ...state.notifications,
        ],
      }
    }),

  updatePlayerPickupArea: (activityId, userId, area) =>
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === activityId
          ? {
              ...a,
              players: a.players.map((p) =>
                p.user.id === userId ? { ...p, pickupArea: area } : p
              ),
            }
          : a
      ),
    })),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
    })),

  getActivity: (id) => get().activities.find((a) => a.id === id),
}))
