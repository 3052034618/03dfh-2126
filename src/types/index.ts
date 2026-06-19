export interface User {
  id: string
  nickname: string
  avatar: string
  isCarOwner: boolean
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

export interface FleetCar {
  carOfferId: string
  driver: User
  passengers: User[]
  route: string
}

export interface FleetGroup {
  id: string
  activityId: string
  type: 'outbound' | 'return'
  cars: FleetCar[]
  meetingPoint: string
  departureTime: string
}

export interface Player {
  user: User
  checkinStatus: 'not_arrived' | 'arrived' | 'late'
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
  currentPlayers: number
  organizer: User
  carRecruitment: CarRecruitment
  players: Player[]
  carOffers: CarOffer[]
  fleetGroups: FleetGroup[]
  status: 'recruiting' | 'confirmed' | 'in_progress' | 'completed'
  deadline: string
  isFriendsOnly: boolean
  notes: string
  createdAt: string
}

export interface AppNotification {
  id: string
  activityId: string
  type: 'car_offer' | 'checkin' | 'change' | 'late' | 'ride_change'
  content: string
  user: User
  timestamp: string
}
