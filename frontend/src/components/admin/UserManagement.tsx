import React, { useState, useEffect } from "react";
import { toast } from "../../utils/toast";
import { useUsers, userService } from "../../services/users";
import { useLanguage } from "../../store/LanguageContext";
import { UserRole } from "../../types/auth";
import BackToDashboard from "./BackToDashboard";
import UserMigrationHelper from "./UserMigrationHelper";
import rpcFunctions from "../../services/rpcFunctions";

const UserManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | undefined>(
    undefined,
  );
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const { users, loading, error, total, refresh } = useUsers(
    selectedRole,
    searchQuery,
  );
  const [fixingRecursion, setFixingRecursion] = useState(false);

  const handleFixRecursion = async () => {
    setFixingRecursion(true);
    try {
      const result = await rpcFunctions.fixAdminUsersRecursion();
      if (result.success) {
        alert(
          language === "en"
            ? "Recursion issues fixed!"
            : "Problèmes de récursion résolus!",
        );
        refresh();
      } else {
        alert(
          language === "en"
            ? `Failed to fix recursion: ${result.error}`
            : `Échec de la résolution de la récursion: ${result.error}`,
        );
      }
    } catch (err) {
      console.error("Error fixing recursion:", err);
      alert(
        language === "en"
          ? "Error fixing recursion issues"
          : "Erreur lors de la résolution des problèmes de récursion",
      );
    } finally {
      setFixingRecursion(false);
    }
  };

  const text = {
    title: {
      en: "User Management",
      fr: "Gestion des Utilisateurs",
    },
    search: {
      en: "Search users...",
      fr: "Rechercher des utilisateurs...",
    },
    filter: {
      en: "Filter by role",
      fr: "Filtrer par rôle",
    },
    allRoles: {
      en: "All Roles",
      fr: "Tous les Rôles",
    },
    customer: {
      en: "Customer",
      fr: "Client",
    },
    seller: {
      en: "Seller",
      fr: "Vendeur",
    },
    admin: {
      en: "Admin",
      fr: "Administrateur",
    },
    totalUsers: {
      en: "Total Users",
      fr: "Total des Utilisateurs",
    },
    fixRecursion: {
      en: "Fix Recursion Issues",
      fr: "Résoudre les Problèmes de Récursion",
    },
    name: {
      en: "Name",
      fr: "Nom",
    },
    email: {
      en: "Email",
      fr: "Email",
    },
    role: {
      en: "Role",
      fr: "Rôle",
    },
    status: {
      en: "Status",
      fr: "Statut",
    },
    actions: {
      en: "Actions",
      fr: "Actions",
    },
    verified: {
      en: "Verified",
      fr: "Vérifié",
    },
    unverified: {
      en: "Unverified",
      fr: "Non Vérifié",
    },
    loading: {
      en: "Loading users...",
      fr: "Chargement des utilisateurs...",
    },
    noUsers: {
      en: "No users found",
      fr: "Aucun utilisateur trouvé",
    },
    error: {
      en: "Error loading users",
      fr: "Erreur lors du chargement des utilisateurs",
    },
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {text.title[language]}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLanguage(language === "en" ? "fr" : "en")}
            className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
          >
            {language === "en" ? "FR" : "EN"}
          </button>
          <BackToDashboard language={language} />
        </div>
      </div>

      {/* Database Schema Helper Component */}
      <UserMigrationHelper />

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex-1">
              <input
                type="text"
                placeholder={text.search[language]}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={selectedRole || ""}
                onChange={(e) =>
                  setSelectedRole((e.target.value as UserRole) || undefined)
                }
                className="p-2 border rounded"
              >
                <option value="">{text.allRoles[language]}</option>
                <option value={UserRole.CUSTOMER}>
                  {text.customer[language]}
                </option>
                <option value={UserRole.SELLER}>{text.seller[language]}</option>
                <option value={UserRole.ADMIN}>{text.admin[language]}</option>
              </select>

              <button
                onClick={refresh}
                className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap justify-between items-center">
            <div className="mb-2 md:mb-0">
              <span className="text-sm font-semibold">
                {text.totalUsers[language]}:
              </span>{" "}
              {total}
            </div>

            <button
              onClick={handleFixRecursion}
              disabled={fixingRecursion}
              className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 disabled:opacity-50"
            >
              {fixingRecursion ? "..." : text.fixRecursion[language]}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            {text.loading[language]}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            {text.error[language]}: {error}
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {text.noUsers[language]}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {text.name[language]}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {text.email[language]}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {text.role[language]}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {text.status[language]}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {text.actions[language]}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {user.name ||
                        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                        "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {user.isVerified ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {text.verified[language]}
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          {text.unverified[language]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          userService
                            .updateVerificationStatus(user.id, !user.isVerified)
                            .then((result) => {
                              if (result.success) refresh();
                            });
                        }}
                        className="text-indigo-600 hover:text-indigo-900 ml-2"
                      >
                        {user.isVerified
                          ? language === "en"
                            ? "Unverify"
                            : "Déverifier"
                          : language === "en"
                            ? "Verify"
                            : "Vérifier"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
