import { create } from 'zustand'
import type {
  Activity,
  CarOffer,
  AppNotification,
  FleetGroup,
  Player,
  CheckinStatus,
  FleetPassenger,
  FleetCar,
  ReminderTarget,
  BoardingStatus,
} from '@/types'
import { mockActivities, mockNotifications, mockUsers, areaAdjacency } from '@/data/mock'

const buildCarRouteOrder = (driverArea: string, passengers: FleetPassenger[]): string[] => {
  const allAreas = Array.from(
    new Set([driverArea, ...passengers.map((p) => p.pickupArea)])
  )
  if (allAreas.length === 0) return []
  const ordered: string[] = []
  const remaining = [...allAreas]
  let current = driverArea
  ordered.push(current)
  remaining.splice(remaining.indexOf(current), 1)
  while (remaining.length > 0) {
    let next = remaining[0]
    let bestScore = -1
    for (const r of remaining) {
      const curAdj = areaAdjacency[current] || []
      const score = curAdj.includes(r) ? 10 : 0
      if (score > bestScore) {
        bestScore = score
        next = r
      }
    }
    ordered.push(next)
    remaining.splice(remaining.indexOf(next), 1)
    current = next
  }
  return ordered
}

const rebuildFleetCarRoute = (car: FleetCar, type: 'outbound' | 'return', storeShort: string): FleetCar => {
  const order = buildCarRouteOrder(car.driverPickupArea, car.passengers)
  const finalOrder = type === 'outbound' ? order : order.slice().reverse()
  const route =
    type === 'outbound'
      ? `${finalOrder.join(' → ')} → ${storeShort}`
      : `${storeShort} → ${finalOrder.join(' → ')}`

  const passengersOrdered: FleetPassenger[] = []
  for (const area of finalOrder) {
    const areaPs = car.passengers.filter((p) => p.pickupArea === area)
    passengersOrdered.push(...areaPs)
  }
  return { ...car, passengers: passengersOrdered, route }
}

const rebuildFleetGroupRoutes = (group: FleetGroup, storeShort: string): FleetGroup => ({
  ...group,
  cars: group.cars.map((car) => rebuildFleetCarRoute(car, group.type, storeShort)),
})

interface AppState {
  activities: Activity[]
  notifications: AppNotification[]
  currentUser: typeof mockUsers[0]
  addActivity: (activity: Activity) => string
  addCarOffer: (offer: CarOffer, pickupArea: string) => void
  confirmCarOffer: (activityId: string, offerId: string) => void
  confirmCarOfferAndAddToFleet: (activityId: string, offerId: string, mode: 'empty' | 'split') => void
  cancelCarOffer: (activityId: string, offerId: string) => void
  generateFleetGroups: (activityId: string) => void
  movePassenger: (
    activityId: string,
    groupType: 'outbound' | 'return',
    passengerUserId: string,
    fromCarOfferId: string,
    toCarOfferId: string
  ) => boolean
  setPassengerBoardingStatus: (
    activityId: string,
    groupType: 'outbound' | 'return',
    carOfferId: string,
    passengerUserId: string,
    status: BoardingStatus
  ) => void
  updateFleetGroup: (activityId: string, group: FleetGroup) => void
  checkin: (activityId: string, userId: string) => void
  setPlayerStatus: (activityId: string, userId: string, status: CheckinStatus) => void
  sendReminder: (activityId: string, target: ReminderTarget) => number
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

  confirmCarOfferAndAddToFleet: (activityId, offerId, mode) => {
    const state = get()
    const activity = state.activities.find((a) => a.id === activityId)
    if (!activity) return
    const offer = activity.carOffers.find((co) => co.id === offerId)
    if (!offer) return

    const storeShort = activity.storeName.split('·')[1] || activity.storeName

    const newCar: FleetCar = {
      carOfferId: offer.id,
      driver: offer.driver,
      driverPickupArea: offer.pickupArea,
      passengers: [],
      route: `${offer.pickupArea} → ${storeShort}`,
    }

    const rebuiltCarOut = rebuildFleetCarRoute(newCar, 'outbound', storeShort)
    const rebuiltCarRet = rebuildFleetCarRoute(newCar, 'return', storeShort)

    set((state) => ({
      activities: state.activities.map((a) => {
        if (a.id !== activityId) return a

        const newCarOffers = a.carOffers.map((co) =>
          co.id === offerId ? { ...co, status: 'confirmed' as const } : co
        )
        let newFleetGroups = a.fleetGroups

        if (mode === 'empty') {
          newFleetGroups = a.fleetGroups.map((fg) =>
            fg.type === 'outbound'
              ? { ...fg, cars: [...fg.cars, rebuiltCarOut] }
              : fg.type === 'return' && offer.waitAfterGame
              ? { ...fg, cars: [...fg.cars, rebuiltCarRet] }
              : fg
          )
        } else if (mode === 'split') {
          newFleetGroups = a.fleetGroups.map((fg) => {
            if (fg.cars.length === 0) return fg

            const sortedCars = [...fg.cars].sort(
              (a, b) => b.passengers.length - a.passengers.length
            )
            const fullest = sortedCars[0]
            const offerCap = offer.availableSeats
            const moveCount = Math.min(
              Math.ceil(fullest.passengers.length / 2),
              offerCap,
              fullest.passengers.length
            )
            const moving = fullest.passengers.slice(0, moveCount)
            const staying = fullest.passengers.slice(moveCount)
            const newCarForGroup: FleetCar =
              fg.type === 'outbound' ? rebuiltCarOut : rebuiltCarRet
            const rebuiltFullest = rebuildFleetCarRoute(
              { ...fullest, passengers: staying },
              fg.type,
              storeShort
            )
            const rebuiltNew = rebuildFleetCarRoute(
              { ...newCarForGroup, passengers: moving },
              fg.type,
              storeShort
            )
            if (fg.type === 'return' && !offer.waitAfterGame) return fg
            return {
              ...fg,
              cars: fg.cars.map((c) =>
                c.carOfferId === fullest.carOfferId ? rebuiltFullest : c
              ).concat(rebuiltNew),
            }
          })
        }

        return {
          ...a,
          carOffers: newCarOffers,
          fleetGroups: newFleetGroups,
        }
      }),
      notifications: [
        {
          id: `n_${Date.now()}`,
          activityId,
          type: 'change',
          content: `${offer.driver.nickname} 的车源已确认并${mode === 'empty' ? '加入车队' : '分担满车压力'}`,
          user: offer.driver,
          timestamp: new Date().toISOString(),
        },
        ...state.notifications,
      ],
    }))
  },

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
      areaToPlayers.get(area)!.push({ user: pl.user, pickupArea: area, boardingStatus: 'waiting' })
    }

    const getAreaCluster = (startArea: string, visited: Set<string>): string[] => {
      if (visited.has(startArea)) return []
      visited.add(startArea)
      const neighbors = areaAdjacency[startArea] || []
      const cluster = [startArea]
      for (const n of neighbors) {
        if (!visited.has(n) && areaToPlayers.has(n)) {
          cluster.push(...getAreaCluster(n, visited))
        }
      }
      return cluster
    }

    const clusters: string[][] = []
    const usedAreas = new Set<string>()
    const sortedByCount = [...areaToPlayers.keys()].sort(
      (a, b) => (areaToPlayers.get(b)?.length || 0) - (areaToPlayers.get(a)?.length || 0)
    )
    for (const area of sortedByCount) {
      if (!usedAreas.has(area)) {
        const cluster = getAreaCluster(area, new Set())
        const relevantCluster = cluster.filter((a) => areaToPlayers.has(a))
        relevantCluster.forEach((a) => usedAreas.add(a))
        if (relevantCluster.length > 0) clusters.push(relevantCluster)
      }
    }

    const carsWithCapacity = confirmedOffers.map((co) => ({
      car: co,
      passengers: [] as FleetPassenger[],
      remaining: co.availableSeats,
    }))

    const getCarAreaMatchScore = (
      car: (typeof carsWithCapacity)[0],
      clusterAreas: string[]
    ) => {
      const carArea = car.car.pickupArea
      if (clusterAreas.includes(carArea)) return 100
      for (const a of clusterAreas) {
        const adj = areaAdjacency[a] || []
        if (adj.includes(carArea)) return 80
      }
      return 0
    }

    for (const cluster of clusters) {
      const clusterPassengers: FleetPassenger[] = []
      for (const area of cluster) {
        clusterPassengers.push(...(areaToPlayers.get(area) || []))
      }

      const sortedCars = [...carsWithCapacity]
        .filter((c) => c.remaining > 0)
        .sort((a, b) => getCarAreaMatchScore(b, cluster) - getCarAreaMatchScore(a, cluster))

      let pi = 0
      while (pi < clusterPassengers.length) {
        const car = sortedCars.find((c) => c.remaining > 0)
        if (!car) break
        car.passengers.push(clusterPassengers[pi])
        car.remaining -= 1
        pi += 1
      }
    }

    const storeShort = activity.storeName.split('·')[1] || activity.storeName

    const outboundCars: FleetCar[] = carsWithCapacity.map((cw) => {
      const base: FleetCar = {
        carOfferId: cw.car.id,
        driver: cw.car.driver,
        driverPickupArea: cw.car.pickupArea,
        passengers: cw.passengers,
        route: '',
      }
      return rebuildFleetCarRoute(base, 'outbound', storeShort)
    })

    const returnCars: FleetCar[] = carsWithCapacity
      .filter((cw) => cw.car.waitAfterGame)
      .map((cw) => {
        const base: FleetCar = {
          carOfferId: cw.car.id,
          driver: cw.car.driver,
          driverPickupArea: cw.car.pickupArea,
          passengers: cw.passengers,
          route: '',
        }
        return rebuildFleetCarRoute(base, 'return', storeShort)
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

  movePassenger: (activityId, groupType, passengerUserId, fromCarOfferId, toCarOfferId) => {
    const state = get()
    const activity = state.activities.find((a) => a.id === activityId)
    if (!activity) return false

    const group = activity.fleetGroups.find((fg) => fg.type === groupType)
    if (!group) return false

    const fromCar = group.cars.find((c) => c.carOfferId === fromCarOfferId)
    const toCar = group.cars.find((c) => c.carOfferId === toCarOfferId)
    if (!fromCar || !toCar) return false

    const carOffer = activity.carOffers.find((co) => co.id === toCarOfferId)
    if (!carOffer) return false
    if (toCar.passengers.length >= carOffer.availableSeats) return false

    const passengerIndex = fromCar.passengers.findIndex((p) => p.user.id === passengerUserId)
    if (passengerIndex === -1) return false

    const passenger = fromCar.passengers[passengerIndex]
    const storeShort = activity.storeName.split('·')[1] || activity.storeName

    set((state) => ({
      activities: state.activities.map((a) => {
        if (a.id !== activityId) return a
        return {
          ...a,
          fleetGroups: a.fleetGroups.map((fg) => {
            if (fg.type !== groupType) return fg
            const newCars = fg.cars.map((c) => {
              if (c.carOfferId === fromCarOfferId) {
                return rebuildFleetCarRoute(
                  {
                    ...c,
                    passengers: c.passengers.filter((p) => p.user.id !== passengerUserId),
                  },
                  groupType,
                  storeShort
                )
              }
              if (c.carOfferId === toCarOfferId) {
                return rebuildFleetCarRoute(
                  { ...c, passengers: [...c.passengers, passenger] },
                  groupType,
                  storeShort
                )
              }
              return c
            })
            return { ...fg, cars: newCars }
          }),
        }
      }),
    }))
    return true
  },

  setPassengerBoardingStatus: (activityId, groupType, carOfferId, passengerUserId, status) =>
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id !== activityId
          ? a
          : {
              ...a,
              fleetGroups: a.fleetGroups.map((fg) =>
                fg.type !== groupType
                  ? fg
                  : {
                      ...fg,
                      cars: fg.cars.map((c) =>
                        c.carOfferId !== carOfferId
                          ? c
                          : {
                              ...c,
                              passengers: c.passengers.map((p) =>
                                p.user.id === passengerUserId
                                  ? { ...p, boardingStatus: status }
                                  : p
                              ),
                            }
                      ),
                    }
              ),
            }
      ),
      notifications: [
        {
          id: `n_${Date.now()}`,
          activityId,
          type: 'checkin',
          content:
            status === 'boarded'
              ? `乘客已上车`
              : status === 'missed'
              ? `乘客漏接`
              : status === 'no_show'
              ? `乘客临时不上车`
              : `乘客恢复待上车`,
          user: state.currentUser,
          timestamp: new Date().toISOString(),
        },
        ...state.notifications,
      ],
    })),

  updateFleetGroup: (activityId, group) =>
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === activityId
          ? {
              ...a,
              fleetGroups: a.fleetGroups.map((fg) =>
                fg.type === group.type ? group : fg
              ),
            }
          : a
      ),
    })),

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

  sendReminder: (activityId, target) => {
    const state = get()
    const activity = state.activities.find((a) => a.id === activityId)
    const currentUser = state.currentUser
    if (!activity) return 0

    let targetPlayers: Player[] = []
    let notifType: AppNotification['type']
    let contentTemplate: string
    let targetLabel: string

    if (target === 'not_arrived') {
      targetPlayers = activity.players.filter((p) => p.checkinStatus === 'not_arrived')
      notifType = 'reminder_not_arrived'
      contentTemplate = '局头提醒：发车时间快到了，请尽快到集合点'
      targetLabel = '未到'
    } else if (target === 'late') {
      targetPlayers = activity.players.filter((p) => p.checkinStatus === 'late')
      notifType = 'reminder_late'
      contentTemplate = '局头提醒：你已迟到，请尽快赶到集合点'
      targetLabel = '迟到'
    } else if (target === 'ride_share') {
      targetPlayers = activity.players.filter((p) => p.checkinStatus === 'ride_share')
      notifType = 'reminder_ride_share'
      contentTemplate = '局头提醒：网约车请按时出发，别迟到了'
      targetLabel = '网约车'
    } else {
      targetPlayers = activity.players.filter((p) => p.checkinStatus !== 'arrived')
      notifType = 'reminder_not_arrived'
      contentTemplate = '局头提醒：发车时间快到了'
      targetLabel = '全员'
    }

    if (targetPlayers.length === 0) return 0

    const newNotifs: AppNotification[] = targetPlayers.map((p, i) => ({
      id: `n_r_${Date.now()}_${i}`,
      activityId,
      type: notifType,
      content: contentTemplate,
      user: p.user,
      timestamp: new Date().toISOString(),
    }))

    const summaryNotif: AppNotification = {
      id: `n_r_summary_${Date.now()}`,
      activityId,
      type: 'reminder_not_arrived',
      content: `📣 局头向 ${targetPlayers.length} 位${targetLabel}玩家发送了提醒`,
      user: currentUser,
      timestamp: new Date().toISOString(),
    }

    set((state) => ({
      notifications: [summaryNotif, ...newNotifs, ...state.notifications],
    }))

    return targetPlayers.length
  },

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
