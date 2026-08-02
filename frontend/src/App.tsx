import { useRoutes } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import HomePage from './pages/HomePage.tsx'
import SchedulePage from './pages/SchedulePage.tsx'
import CanteenPage from './pages/CanteenPage.tsx'
import TradePage from './pages/TradePage.tsx'
import LostFoundPage from './pages/LostFoundPage.tsx'
import AuthPage from './pages/AuthPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'

export default function App() {
  return useRoutes([
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'schedule', element: <SchedulePage /> },
        { path: 'canteen', element: <CanteenPage /> },
        { path: 'trade', element: <TradePage /> },
        { path: 'lost-found', element: <LostFoundPage /> },
        { path: 'auth', element: <AuthPage /> },
        { path: 'profile', element: <ProfilePage /> },
      ],
    },
  ])
}