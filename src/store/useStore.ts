import { create } from 'zustand'
import type { Activity, CarOffer, AppNotification, FleetGroup, Player } from '@/types'
import { mockActivities, mockNotifications, mockUsers } from '@/data/mock'

interface AppState {
  activities: Activity[]
  notifications: AppNotification[]
  currentUser: typeof mockUsers[0]
  addActivity: (activity: Activity) => void
  addCarOffer: (offer: CarOffer) => void
  confirmCarOffer: (activityId: string, offerId: string) => void
  cancelCarOffer: (activityId: string, offerId: string) => void
  generateFleetGroups: (activityId: string) => void
  checkin: (activityId: string, userId: string) => void
  addNotification: (notification: AppNotification) => void
  getActivity: (id: string) => Activity | undefined
}

export const useStore = create<AppState>((set, get) => ({
  activities: mockActivities,
  notifications: mockNotifications,
  currentUser: mockUsers[0],

  addActivity: (activity) =>
    set((state) => ({
      activities: [activity, ...state.activities],
    })),

  addCarOffer: (offer) =>
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === offer.activityId
          ? {
              ...a,
              carOffers: [...a.carOffers, offer],
              players: [
                ...a.players,
                { user: offer.driver, checkinStatus: 'not_arrived' as const, carOfferId: offer.id },
              ],
              currentPlayers: a.currentPlayers + 1,
            }
          : a
      ),
      notifications: [
        {
          id: `n_${Date.now()}`,
          activityId: offer.activityId,
          type: 'car_offer' as const,
          content: `${offer.driver.nickname} 提供了车源（${offer.pickupArea}出发，可坐${offer.availableSeats}人）`,
          user: offer.driver,
          timestamp: new Date().toISOString(),
        },
        ...state.notifications,
      ],
    })),

  confirmCarOffer: (activityId, offerId) =>
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === activityId
          ? {
              ...a,
              carOffers: a.carOffers.map((co) =>
                co.id === offerId ? { ...co, status: 'confirmed' as const } : co
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
                co.id === offerId ? { ...co, status: 'cancelled' as const } : co
              ),
            }
          : a
      ),
    })),

  generateFleetGroups: (activityId) => {
    const activity = get().activities.find((a) => a.id === activityId)
    if (!activity) return

    const confirmedOffers = activity.carOffers.filter((co) => co.status === 'confirmed')
    const playersWithoutCar: Player[] = activity.players.filter(
      (p) => !p.carOfferId && !confirmedOffers.some((co) => co.driver.id === p.user.id)
    )

    const outboundCars = confirmedOffers.map((co) => {
      const passengerCount = Math.min(co.availableSeats - 1, playersWithoutCar.length)
      const passengers = playersWithoutCar.splice(0, passengerCount)
      return {
        carOfferId: co.id,
        driver: co.driver,
        passengers: passengers.map((p) => p.user),
        route: `${co.pickupArea} → ${activity.storeName.split('·')[1] || activity.storeName}`,
      }
    })

    const returnWaitOffers = confirmedOffers.filter((co) => co.waitAfterGame)
    const returnCars = returnWaitOffers.map((co) => {
      const correspondingOutbound = outboundCars.find((c) => c.carOfferId === co.id)
      return {
        carOfferId: co.id,
        driver: co.driver,
        passengers: correspondingOutbound?.passengers || [],
        route: `${activity.storeName.split('·')[1] || activity.storeName} → ${co.pickupArea}`,
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
        id: `fg_ret_${Date.now()}`,
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
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === activityId
          ? {
              ...a,
              players: a.players.map((p) =>
                p.user.id === userId ? { ...p, checkinStatus: 'arrived' as const } : p
              ),
            }
          : a
      ),
      notifications: [
        {
          id: `n_${Date.now()}`,
          activityId,
          type: 'checkin' as const,
          content: `${state.activities.find((a) => a.id === activityId)?.players.find((p) => p.user.id === userId)?.user.nickname || '玩家'} 已到达集合点`,
          user: state.activities.find((a) => a.id === activityId)?.players.find((p) => p.user.id === userId)?.user || mockUsers[0],
          timestamp: new Date().toISOString(),
        },
        ...state.notifications,
      ],
    })),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
    })),

  getActivity: (id) => get().activities.find((a) => a.id === id),
}))
