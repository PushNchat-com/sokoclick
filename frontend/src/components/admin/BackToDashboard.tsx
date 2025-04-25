import React from 'react';
import { Link } from 'react-router-dom';

interface BackToDashboardProps {
  className?: string;
  language?: 'en' | 'fr';
}

const BackToDashboard: React.FC<BackToDashboardProps> = ({ 
  className = '',
  language = 'en'
}) => {
  const text = {
    en: 'Back to Dashboard',
    fr: 'Retour au Tableau de bord'
  };

  return (
    <Link 
      to="/admin" 
      className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${className}`}
      aria-label={text[language]}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-5 w-5 mr-2" 
        viewBox="0 0 20 20" 
        fill="currentColor"
        aria-hidden="true"
      >
        <path 
          fillRule="evenodd" 
          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" 
          clipRule="evenodd" 
        />
      </svg>
      {text[language]}
    </Link>
  );
};

export default BackToDashboard; 