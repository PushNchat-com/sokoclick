import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow flex items-center justify-center bg-gray-50 py-12">
        <div className="max-w-md w-full px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-9xl font-extrabold text-indigo-600 tracking-widest">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mt-4 mb-8">{t('pageNotFound')}</h2>
          <p className="text-lg text-gray-600 mb-12">{t('pageNotFoundMessage')}</p>
          <Link
            to="/"
            className="inline-block bg-indigo-600 text-white font-medium px-6 py-3 rounded-md shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {t('backToHome')}
          </Link>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default NotFound; 