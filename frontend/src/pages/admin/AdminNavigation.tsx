import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { UserRole } from "../../types/auth";
import UserMigrationHelper from "../../components/admin/UserMigrationHelper";

interface AdminNavigationProps {
  language?: "en" | "fr";
}

// Text translations
const text = {
  dashboard: {
    en: "Dashboard",
    fr: "Tableau de bord",
  },
  products: {
    en: "Products",
    fr: "Produits",
  },
  users: {
    en: "Users",
    fr: "Utilisateurs",
  },
  slots: {
    en: "Slot Management",
    fr: "Gestion des Emplacements",
  },
  slotUploads: {
    en: "Slot Image Uploads",
    fr: "Images des Emplacements",
  },
  categories: {
    en: "Categories",
    fr: "Catégories",
  },
  settings: {
    en: "Settings",
    fr: "Paramètres",
  },
  logout: {
    en: "Logout",
    fr: "Déconnexion",
  },
  adminSystem: {
    en: "Admin System",
    fr: "Système Admin",
  },
  recursingWarning: {
    en: "Database issues detected",
    fr: "Problèmes de base de données détectés",
  },
  navigation: {
    en: "Main Navigation",
    fr: "Navigation Principale",
  },
};

const AdminNavigation: React.FC<AdminNavigationProps> = ({
  language = "en",
}) => {
  const location = useLocation();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Check for recursion issues in localStorage
    const hasRecursionIssues = localStorage.getItem("admin_recursion_issues");
    setShowWarning(!!hasRecursionIssues);
  }, []);

  // Function to determine if a link is active
  const isActive = (path: string): boolean => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div
      className="bg-gray-800 text-white p-4 h-full"
      role="navigation"
      aria-label={text.navigation[language]}
    >
      <div className="mb-8">
        <h1 className="text-xl font-bold" id="admin-nav-title">
          {text.adminSystem[language]}
        </h1>
      </div>

      {showWarning && (
        <div
          className="mb-4 p-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded"
          role="alert"
          aria-live="polite"
        >
          <p className="font-medium">{text.recursingWarning[language]}</p>
          <UserMigrationHelper />
        </div>
      )}

      <nav aria-labelledby="admin-nav-title">
        <ul className="space-y-2" role="menu">
          <li role="none">
            <Link
              to="/admin"
              className={`block px-4 py-2 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white ${
                location.pathname === "/admin" ? "bg-gray-700" : ""
              }`}
              role="menuitem"
              aria-current={location.pathname === "/admin" ? "page" : undefined}
            >
              {text.dashboard[language]}
            </Link>
          </li>
          <li role="none">
            <Link
              to="/admin/products"
              className={`block px-4 py-2 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white ${
                isActive("/admin/products") ? "bg-gray-700" : ""
              }`}
              role="menuitem"
              aria-current={isActive("/admin/products") ? "page" : undefined}
            >
              {text.products[language]}
            </Link>
          </li>
          <li role="none">
            <Link
              to="/admin/users"
              className={`block px-4 py-2 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white ${
                isActive("/admin/users") ? "bg-gray-700" : ""
              }`}
              role="menuitem"
              aria-current={isActive("/admin/users") ? "page" : undefined}
            >
              {text.users[language]}
            </Link>
          </li>
          <li role="none">
            <Link
              to="/admin/slots"
              className={`block px-4 py-2 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white ${
                location.pathname === "/admin/slots" ? "bg-gray-700" : ""
              }`}
              role="menuitem"
              aria-current={
                location.pathname === "/admin/slots" ? "page" : undefined
              }
            >
              {text.slots[language]}
            </Link>
          </li>
          <li role="none">
            <Link
              to="/admin/slots/uploads"
              className={`block px-4 py-2 pl-8 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white ${
                location.pathname === "/admin/slots/uploads"
                  ? "bg-gray-700"
                  : ""
              }`}
              role="menuitem"
              aria-current={
                location.pathname === "/admin/slots/uploads"
                  ? "page"
                  : undefined
              }
            >
              {text.slotUploads[language]}
              <span className="sr-only">{text.slots[language]} -</span>
            </Link>
          </li>
          <li role="none">
            <Link
              to="/admin/categories"
              className={`block px-4 py-2 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white ${
                isActive("/admin/categories") ? "bg-gray-700" : ""
              }`}
              role="menuitem"
              aria-current={isActive("/admin/categories") ? "page" : undefined}
            >
              {text.categories[language]}
            </Link>
          </li>
          <li role="none">
            <Link
              to="/admin/settings"
              className={`block px-4 py-2 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white ${
                isActive("/admin/settings") ? "bg-gray-700" : ""
              }`}
              role="menuitem"
              aria-current={isActive("/admin/settings") ? "page" : undefined}
            >
              {text.settings[language]}
            </Link>
          </li>
        </ul>
      </nav>

      <div className="mt-auto pt-8">
        <Link
          to="/logout"
          className="block px-4 py-2 text-red-300 hover:text-red-200 hover:bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-300"
          role="button"
        >
          {text.logout[language]}
        </Link>
      </div>
    </div>
  );
};

export default AdminNavigation;
