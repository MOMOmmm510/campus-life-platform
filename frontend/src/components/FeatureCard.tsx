import { Link } from 'react-router-dom'

interface FeatureCardProps {
  title: string
  description: string
  icon: string
  link: string
}

export default function FeatureCard({ title, description, icon, link }: FeatureCardProps) {
  return (
    <Link
      to={link}
      className="block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="mb-4 text-5xl">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-500">{description}</p>
    </Link>
  )
}