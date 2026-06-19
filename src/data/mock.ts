import type { User, Activity, AppNotification, CheckinStatus } from '@/types'

const avatars = [
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=anime+girl+avatar+face+dark+hair+neon+lights&image_size=square_hd',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=anime+boy+avatar+cool+dark+theme&image_size=square_hd',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+cat+avatar+neon+glow&image_size=square_hd',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mystery+detective+avatar+dark+noir&image_size=square_hd',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ghost+avatar+cute+purple+glow&image_size=square_hd',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wolf+avatar+neon+blue+eyes&image_size=square_hd',
]

export const mockUsers: User[] = [
  { id: 'u1', nickname: '剧本杀小队长', avatar: avatars[0], isCarOwner: true },
  { id: 'u2', nickname: '推理狂魔', avatar: avatars[1], isCarOwner: false },
  { id: 'u3', nickname: '老司机阿杰', avatar: avatars[2], isCarOwner: true },
  { id: 'u4', nickname: '剧本猎人', avatar: avatars[3], isCarOwner: false },
  { id: 'u5', nickname: '夜行侠', avatar: avatars[4], isCarOwner: true },
  { id: 'u6', nickname: '萌新一号', avatar: avatars[5], isCarOwner: false },
  { id: 'u7', nickname: '车队队长', avatar: avatars[0], isCarOwner: true },
  { id: 'u8', nickname: '密室女王', avatar: avatars[1], isCarOwner: false },
  { id: 'u9', nickname: '暴风推理', avatar: avatars[2], isCarOwner: true },
  { id: 'u10', nickname: '局头小王', avatar: avatars[3], isCarOwner: false },
]

const p = (u: User, area: string, status: CheckinStatus = 'not_arrived', car?: string) => ({
  user: u, checkinStatus: status, pickupArea: area, carOfferId: car,
})

export const mockActivities: Activity[] = [
  {
    id: 'a1',
    title: '周末恐怖本包场',
    scriptName: '病娇男孩的恋爱日记',
    scriptType: '恐怖',
    storeName: '迷雾剧本杀·大学城店',
    storeAddress: '海淀区学院路38号创意大厦B2',
    startTime: '2026-06-21T19:00:00',
    playerCount: 8,
    currentPlayers: 6,
    organizer: mockUsers[0],
    carRecruitment: { carsNeeded: 2, seatsPerCar: 4, fuelSubsidy: 30, allowPickup: true },
    players: [
      p(mockUsers[0], '五道口'),
      p(mockUsers[1], '五道口'),
      p(mockUsers[2], '五道口', 'arrived', 'co1'),
      p(mockUsers[3], '西二旗'),
      p(mockUsers[4], '西二旗', 'arrived', 'co2'),
      p(mockUsers[5], '西二旗'),
    ],
    carOffers: [
      { id: 'co1', activityId: 'a1', driver: mockUsers[2], pickupArea: '五道口', availableSeats: 3, waitAfterGame: true, status: 'confirmed', notes: '可以等散场，顺路接人', createdAt: '2026-06-20T10:00:00' },
      { id: 'co2', activityId: 'a1', driver: mockUsers[4], pickupArea: '西二旗', availableSeats: 4, waitAfterGame: false, status: 'pending', notes: '散场就走不等', createdAt: '2026-06-20T12:00:00' },
    ],
    fleetGroups: [
      {
        id: 'fg1', activityId: 'a1', type: 'outbound', meetingPoint: '学院路创意大厦B2门口', departureTime: '2026-06-21T18:00:00',
        cars: [
          { carOfferId: 'co1', driver: mockUsers[2], driverPickupArea: '五道口', route: '五道口 → 创意大厦', passengers: [{ user: mockUsers[0], pickupArea: '五道口' }, { user: mockUsers[1], pickupArea: '五道口' }] },
          { carOfferId: 'co2', driver: mockUsers[4], driverPickupArea: '西二旗', route: '西二旗 → 创意大厦', passengers: [{ user: mockUsers[3], pickupArea: '西二旗' }, { user: mockUsers[5], pickupArea: '西二旗' }] },
        ],
      },
      {
        id: 'fg2', activityId: 'a1', type: 'return', meetingPoint: '创意大厦B2门口', departureTime: '2026-06-21T23:30:00',
        cars: [
          { carOfferId: 'co1', driver: mockUsers[2], driverPickupArea: '五道口', route: '创意大厦 → 五道口', passengers: [{ user: mockUsers[0], pickupArea: '五道口' }, { user: mockUsers[1], pickupArea: '五道口' }] },
        ],
      },
    ],
    status: 'recruiting',
    deadline: '2026-06-21T12:00:00',
    isFriendsOnly: false,
    notes: '恐怖本，胆小慎入！需要2辆车，有油补！',
    createdAt: '2026-06-19T20:00:00',
  },
  {
    id: 'a2',
    title: '欢乐本团建局',
    scriptName: '长安小饭馆',
    scriptType: '欢乐',
    storeName: '七狸剧本杀·望京店',
    storeAddress: '朝阳区望京SOHO T1 12层',
    startTime: '2026-06-22T14:00:00',
    playerCount: 7,
    currentPlayers: 4,
    organizer: mockUsers[9],
    carRecruitment: { carsNeeded: 2, seatsPerCar: 4, fuelSubsidy: 20, allowPickup: true },
    players: [
      p(mockUsers[9], '国贸'),
      p(mockUsers[6], '国贸', 'not_arrived', 'co3'),
      p(mockUsers[7], '三元桥'),
      p(mockUsers[8], '三元桥', 'not_arrived', 'co4'),
    ],
    carOffers: [
      { id: 'co3', activityId: 'a2', driver: mockUsers[6], pickupArea: '国贸', availableSeats: 3, waitAfterGame: true, status: 'confirmed', notes: '国贸出发，可接人', createdAt: '2026-06-21T09:00:00' },
      { id: 'co4', activityId: 'a2', driver: mockUsers[8], pickupArea: '三元桥', availableSeats: 3, waitAfterGame: true, status: 'pending', notes: '', createdAt: '2026-06-21T11:00:00' },
    ],
    fleetGroups: [],
    status: 'recruiting',
    deadline: '2026-06-22T10:00:00',
    isFriendsOnly: false,
    notes: '欢乐本适合新手，社恐友好！',
    createdAt: '2026-06-20T15:00:00',
  },
  {
    id: 'a3',
    title: '情感本专场',
    scriptName: '月下沙丘',
    scriptType: '情感',
    storeName: '剧本空间·中关村店',
    storeAddress: '海淀区中关村大街27号3层',
    startTime: '2026-06-23T18:30:00',
    playerCount: 6,
    currentPlayers: 6,
    organizer: mockUsers[1],
    carRecruitment: { carsNeeded: 1, seatsPerCar: 5, fuelSubsidy: 50, allowPickup: false },
    players: [
      p(mockUsers[1], '知春路', 'arrived'),
      p(mockUsers[0], '知春路', 'arrived'),
      p(mockUsers[3], '知春路', 'late'),
      p(mockUsers[5], '知春路', 'arrived'),
      p(mockUsers[7], '知春路', 'ride_share'),
      p(mockUsers[9], '知春路', 'arrived', 'co5'),
    ],
    carOffers: [
      { id: 'co5', activityId: 'a3', driver: mockUsers[9], pickupArea: '知春路', availableSeats: 4, waitAfterGame: true, status: 'confirmed', notes: '知春路地铁站集合', createdAt: '2026-06-22T14:00:00' },
    ],
    fleetGroups: [
      {
        id: 'fg3', activityId: 'a3', type: 'outbound', meetingPoint: '知春路地铁站B口', departureTime: '2026-06-23T17:30:00',
        cars: [
          { carOfferId: 'co5', driver: mockUsers[9], driverPickupArea: '知春路', route: '知春路 → 中关村', passengers: [{ user: mockUsers[0], pickupArea: '知春路' }, { user: mockUsers[3], pickupArea: '知春路' }, { user: mockUsers[5], pickupArea: '知春路' }] },
        ],
      },
    ],
    status: 'confirmed',
    deadline: '2026-06-23T10:00:00',
    isFriendsOnly: true,
    notes: '熟人局，准备好纸巾！',
    createdAt: '2026-06-21T10:00:00',
  },
  {
    id: 'a4',
    title: '硬核推理局',
    scriptName: '雾鸦馆',
    scriptType: '硬核',
    storeName: '暗域剧本杀·西单店',
    storeAddress: '西城区西单北大街120号4层',
    startTime: '2026-06-24T19:00:00',
    playerCount: 7,
    currentPlayers: 3,
    organizer: mockUsers[3],
    carRecruitment: { carsNeeded: 2, seatsPerCar: 4, fuelSubsidy: 40, allowPickup: true },
    players: [
      p(mockUsers[3], '西单'),
      p(mockUsers[1], '西单'),
      p(mockUsers[5], '西单'),
    ],
    carOffers: [],
    fleetGroups: [],
    status: 'recruiting',
    deadline: '2026-06-24T12:00:00',
    isFriendsOnly: false,
    notes: '5小时硬核本，脑力挑战！急招车源！',
    createdAt: '2026-06-22T18:00:00',
  },
]

export const mockNotifications: AppNotification[] = [
  { id: 'n1', activityId: 'a1', type: 'car_offer', content: '老司机阿杰 提供了车源（五道口出发，可坐3人）', user: mockUsers[2], timestamp: '2026-06-20T10:00:00' },
  { id: 'n2', activityId: 'a1', type: 'car_offer', content: '夜行侠 提供了车源（西二旗出发，可坐4人）', user: mockUsers[4], timestamp: '2026-06-20T12:00:00' },
  { id: 'n3', activityId: 'a1', type: 'checkin', content: '老司机阿杰 已到达集合点', user: mockUsers[2], timestamp: '2026-06-21T17:45:00' },
  { id: 'n4', activityId: 'a3', type: 'late', content: '剧本猎人 迟到了，预计晚10分钟', user: mockUsers[3], timestamp: '2026-06-23T17:50:00' },
  { id: 'n5', activityId: 'a3', type: 'ride_change', content: '密室女王 改坐网约车前往', user: mockUsers[7], timestamp: '2026-06-23T18:00:00' },
]

export const scriptTypes = ['全部', '恐怖', '欢乐', '情感', '硬核', '阵营', '机制', '还原']

export const pickupAreas = [
  '五道口', '西二旗', '知春路', '国贸', '三元桥',
  '望京', '中关村', '西单', '东直门', '天通苑',
  '回龙观', '上地', '亦庄', '通州北苑', '大望路',
]
