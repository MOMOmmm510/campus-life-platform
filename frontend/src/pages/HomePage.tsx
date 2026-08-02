import FeatureCard from '../components/FeatureCard.tsx'

const features = [
  { icon: '📅', title: '课表管理', description: '查看和管理你的课程表', link: '/schedule' },
  { icon: '🍽️', title: '食堂点评', description: '查看食堂菜单和评价', link: '/canteen' },
  { icon: '🔄', title: '二手交易', description: '买卖闲置物品', link: '/trade' },
  { icon: '🔍', title: '失物招领', description: '发布和查找失物', link: '/lost-found' },
]

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-12 text-center">
        <h1 className="mb-3 text-4xl font-bold text-blue-900">
          校园生活服务平台
        </h1>
        <p className="text-lg text-gray-500">让校园生活更便捷</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {features.map(({ icon, title, description, link }) => (
          <FeatureCard
            key={link}
            icon={icon}
            title={title}
            description={description}
            link={link}
          />
        ))}
      </div>
    </div>
  )
}