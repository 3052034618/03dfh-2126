export interface User {
  id: string
  nickname: string
  avatar: string
  isCarOwner: boolean
  phone?: string
}

export interface CarRecruitment {
  carsNeeded: number
  seatsPerCar: number
  fuelSubsidy: number
  allowPickup: boolean
}

export interface CarOffer {
  id: string
  activityId: string
  driver: User
  pickupArea: string
  availableSeats: number
  waitAfterGame: boolean
  status: 'pending' | 'confirmed' | 'cancelled'
  notes: string
  createdAt: string
}

export type BoardingStatus = 'waiting' | 'boarded' | 'missed' | 'no_show'

export interface FleetPassenger {
  user: User
  pickupArea: string
  boardingStatus?: BoardingStatus
}

export type CarExecutionStatus = 'waiting' | 'boarding' | 'in_transit' | 'arrived'

export interface FleetCar {
  carOfferId: string
  driver: User
  driverPickupArea: string
  passengers: FleetPassenger[]
  route: string
  executionStatus?: CarExecutionStatus
  startedBoardingAt?: string
  departedAt?: string
  arrivedAt?: string
}

export interface FleetGroup {
  id: string
  activityId: string
  type: 'outbound' | 'return'
  cars: FleetCar[]
  meetingPoint: string
  departureTime: string
}

export type CheckinStatus = 'not_arrived' | 'arrived' | 'late' | 'ride_share'

export type ReminderTarget = 'not_arrived' | 'late' | 'ride_share' | 'all'

export interface ReminderReceipt {
  userId: string
  read: boolean
  readAt?: string
  replyEta?: string
  repliedAt?: string
}

export interface ReminderBatch {
  id: string
  activityId: string
  target: ReminderTarget
  notificationType: 'reminder_not_arrived' | 'reminder_late' | 'reminder_ride_share'
  sentAt: string
  sentBy: User
  receipts: ReminderReceipt[]
}

export interface Player {
  user: User
  checkinStatus: CheckinStatus
  pickupArea?: string
  carOfferId?: string
  assignedCarId?: string
}

export interface Activity {
  id: string
  title: string
  scriptName: string
  scriptType: string
  storeName: string
  storeAddress: string
  startTime: string
  playerCount: number
  maxPlayers: number
  currentPlayers: number
  organizer: User
  carRecruitment: CarRecruitment
  players: Player[]
  carOffers: CarOffer[]
  fleetGroups: FleetGroup[]
  reminderBatches: ReminderBatch[]
  status: 'recruiting' | 'confirmed' | 'in_progress' | 'completed'
  deadline: string
  isFriendsOnly: boolean
  notes: string
  createdAt: string
}

export type NotificationType =
  | 'car_offer'
  | 'checkin'
  | 'change'
  | 'late'
  | 'ride_change'
  | 'restore'
  | 'reminder_not_arrived'
  | 'reminder_late'
  | 'reminder_ride_share'
  | 'car_execution'
  | 'contact_passenger'

export interface AppNotification {
  id: string
  activityId: string
  type: NotificationType
  content: string
  user: User
  timestamp: string
  metadata?: Record<string, unknown>
}
