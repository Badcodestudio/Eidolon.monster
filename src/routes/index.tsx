import { createBrowserRouter } from 'react-router-dom';
import HomePage from '@/pages/Home/index';
import StudioPage from '@/pages/Studio/index';
import HistoryPage from '@/pages/History/index';
import PricingPage from '@/pages/Pricing/index';
import AboutPage from '@/pages/About/index';
import DocsPage from '@/pages/Docs/index';
import LegalPage from '@/pages/Legal/index';
import AdminPage from '@/pages/Admin/index';
import GalleryPage from '@/pages/Gallery/index';
import ThreeDStudioPage from '@/pages/ThreeDStudio/index';
import NotFoundPage from '@/pages/NotFound/index';
import Layout from '@/components/Layout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/create',
        element: <StudioPage />,
      },
      {
        path: '/history',
        element: <HistoryPage />,
      },
      {
        path: '/gallery',
        element: <GalleryPage />,
      },
      {
        path: '/3d-models',
        element: <ThreeDStudioPage />,
      },
      {
        path: '/pricing',
        element: <PricingPage />,
      },
      {
        path: '/about',
        element: <AboutPage />,
      },
      {
        path: '/docs',
        element: <DocsPage />,
      },
      {
        path: '/legal',
        element: <LegalPage />,
      },
      {
        path: '/admin',
        element: <AdminPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
