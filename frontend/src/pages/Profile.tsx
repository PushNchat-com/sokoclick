import React from "react";
import { useUnifiedAuth } from "../contexts/UnifiedAuthContext";
import { useLanguage } from "../store/LanguageContext";
import { Navigate } from "react-router-dom";

const Profile: React.FC = () => {
  const { user, loading, session, signOut } = useUnifiedAuth();
  const isAuthenticated = !!session && !!user;
  const { t } = useLanguage();

  // Text content
  const text = {
    profile: { en: "Profile", fr: "Profil" },
    loading: { en: "Loading...", fr: "Chargement..." },
    email: { en: "Email", fr: "Email" },
    name: { en: "Name", fr: "Nom" },
    firstName: { en: "First Name", fr: "Prénom" },
    lastName: { en: "Last Name", fr: "Nom de famille" },
    phone: { en: "Phone Number", fr: "Numéro de téléphone" },
    role: { en: "Role", fr: "Rôle" },
    logout: { en: "Sign Out", fr: "Se déconnecter" },
    editProfile: { en: "Edit Profile", fr: "Modifier le profil" },
    roleName: {
      super_admin: { en: "Super Administrator", fr: "Super Administrateur" },
      admin: { en: "Administrator", fr: "Administrateur" },
      content_moderator: {
        en: "Content Moderator",
        fr: "Modérateur de contenu",
      },
      analytics_viewer: {
        en: "Analytics Viewer",
        fr: "Visualiseur d'analytique",
      },
      customer_support: { en: "Customer Support", fr: "Support client" },
      seller: { en: "Seller", fr: "Vendeur" },
      customer: { en: "Customer", fr: "Client" },
    },
  };

  // Redirect if not authenticated
  if (!loading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t(text.profile)}</h1>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-lg">{t(text.loading)}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">{t(text.profile)}</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    {t(text.email)}
                  </label>
                  <p className="text-gray-900">{user?.email}</p>
                </div>

                {user?.name && (
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      {t(text.name)}
                    </label>
                    <p className="text-gray-900">{user.name}</p>
                  </div>
                )}

                {(user?.firstName || user?.lastName) && (
                  <div className="grid grid-cols-2 gap-4">
                    {user?.firstName && (
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                          {t(text.firstName)}
                        </label>
                        <p className="text-gray-900">{user.firstName}</p>
                      </div>
                    )}

                    {user?.lastName && (
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                          {t(text.lastName)}
                        </label>
                        <p className="text-gray-900">{user.lastName}</p>
                      </div>
                    )}
                  </div>
                )}

                {user?.phone && (
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      {t(text.phone)}
                    </label>
                    <p className="text-gray-900">{user.phone}</p>
                  </div>
                )}

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    {t(text.role)}
                  </label>
                  <p className="text-gray-900">
                    {user?.role &&
                      t(
                        text.roleName[
                          user.role.toLowerCase() as keyof typeof text.roleName
                        ],
                      )}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex space-x-4">
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  {t(text.logout)}
                </button>

                <button
                  onClick={() => {
                    /* TODO: Implement edit profile */
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  {t(text.editProfile)}
                </button>
              </div>
            </div>

            <div className="self-center">
              <div className="bg-gray-200 rounded-full h-32 w-32 flex items-center justify-center mx-auto">
                <span className="text-5xl">
                  {user?.firstName
                    ? user.firstName.charAt(0).toUpperCase()
                    : user?.name
                      ? user.name.charAt(0).toUpperCase()
                      : user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
