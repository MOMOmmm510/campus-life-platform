export interface Canteen {
  id: number
  name: string
  location: string
  rating: number
  tags: string[]
  image: string
}

export interface Item {
  id: number
  title: string
  price: number
  category: string
  image: string
  seller: string
}

export interface Review {
  id: number
  canteenId: number
  username: string
  content: string
  rating: number
  time: string
}

export const canteens: Canteen[] = [
  {
    id: 1,
    name: '第一食堂',
    location: '教学楼A区东侧',
    rating: 4.2,
    tags: ['大众菜', '面食', '快餐'],
    image: '/src/assets/canteen-1.jpg',
  },
  {
    id: 2,
    name: '第二食堂',
    location: '宿舍区B栋南侧',
    rating: 4.5,
    tags: ['麻辣烫', '米粉', '小炒'],
    image: '/src/assets/canteen-2.jpg',
  },
  {
    id: 3,
    name: '第三食堂',
    location: '图书馆北侧',
    rating: 3.8,
    tags: ['自助餐', '西餐', '甜点'],
    image: '/src/assets/canteen-3.jpg',
  },
  {
    id: 4,
    name: '教工食堂',
    location: '行政楼旁',
    rating: 4.0,
    tags: ['小碗菜', '炖汤', '营养餐'],
    image: '/src/assets/canteen-4.jpg',
  },
]

export const items: Item[] = [
  {
    id: 1,
    title: '高等数学（第七版）',
    price: 25,
    category: '教材',
    image: '/src/assets/item-1.jpg',
    seller: '张三',
  },
  {
    id: 2,
    title: '大学英语四级真题',
    price: 15,
    category: '教材',
    image: '/src/assets/item-2.jpg',
    seller: '李四',
  },
  {
    id: 3,
    title: '二手笔记本电脑',
    price: 1800,
    category: '电子',
    image: '/src/assets/item-3.jpg',
    seller: '王五',
  },
  {
    id: 4,
    title: '机械键盘',
    price: 120,
    category: '电子',
    image: '/src/assets/item-4.jpg',
    seller: '赵六',
  },
  {
    id: 5,
    title: '宿舍台灯',
    price: 30,
    category: '生活',
    image: '/src/assets/item-5.jpg',
    seller: '陈七',
  },
  {
    id: 6,
    title: '跳绳运动套装',
    price: 20,
    category: '生活',
    image: '/src/assets/item-6.jpg',
    seller: '刘八',
  },
  {
    id: 7,
    title: '考研政治笔记',
    price: 10,
    category: '其他',
    image: '/src/assets/item-7.jpg',
    seller: '周九',
  },
]

export const reviews: Review[] = [
  {
    id: 1,
    canteenId: 1,
    username: '小明',
    content: '第一食堂的红烧肉很好吃，价格实惠！',
    rating: 4.5,
    time: '2025-03-10 12:30',
  },
  {
    id: 2,
    canteenId: 1,
    username: '小红',
    content: '面食窗口的牛肉面分量足，就是排队太久了。',
    rating: 4.0,
    time: '2025-03-11 18:00',
  },
  {
    id: 3,
    canteenId: 2,
    username: '小刚',
    content: '麻辣烫味道很正，价格也便宜，每次来都吃。',
    rating: 4.8,
    time: '2025-03-12 12:00',
  },
  {
    id: 4,
    canteenId: 2,
    username: '小丽',
    content: '米粉窗口的酸辣粉不错，推荐！',
    rating: 4.3,
    time: '2025-03-13 17:30',
  },
  {
    id: 5,
    canteenId: 2,
    username: '小强',
    content: '小炒窗口的菜品经常换，很有新鲜感。',
    rating: 4.6,
    time: '2025-03-14 11:45',
  },
  {
    id: 6,
    canteenId: 3,
    username: '小芳',
    content: '自助餐种类挺多的，就是价格偏贵。',
    rating: 3.5,
    time: '2025-03-15 18:20',
  },
  {
    id: 7,
    canteenId: 3,
    username: '小军',
    content: '西餐窗口的意面味道一般，有待改进。',
    rating: 3.0,
    time: '2025-03-16 12:15',
  },
  {
    id: 8,
    canteenId: 4,
    username: '小华',
    content: '教工食堂的炖汤很养生，味道清淡适合我。',
    rating: 4.2,
    time: '2025-03-17 12:10',
  },
  {
    id: 9,
    canteenId: 4,
    username: '小美',
    content: '小碗菜的分量刚好，不浪费，价格也合理。',
    rating: 4.4,
    time: '2025-03-18 18:05',
  },
]