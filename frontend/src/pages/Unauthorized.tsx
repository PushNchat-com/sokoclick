import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const Unauthorized = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow flex items-center justify-center bg-gray-50 py-12">
        <div className="max-w-md w-full px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-error-100 p-3">
              <svg 
                className="w-16 h-16 text-error-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 15v2m0 0v2m0-2h2m-2 0H10m8-8a8 8 0 01-8 8 8 8 0 110-16 8 8 0 018 8z" 
                />
              </svg>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('unauthorized')}</h1>
          <p className="text-lg text-gray-600 mb-8">{t('unauthorizedMessage')}</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-block bg-gray-200 text-gray-800 font-medium px-6 py-3 rounded-md shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              {t('backToHome')}
            </Link>
            <Link
              to="/login"
              className="inline-block bg-primary-600 text-white font-medium px-6 py-3 rounded-md shadow hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {t('signIn')}
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Unauthorized; 