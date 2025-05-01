import React, { useState, useEffect } from "react";
import { useLanguage } from "../../store/LanguageContext";
import { useUnifiedAuth } from "../../contexts/UnifiedAuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { supabase } from "../../services/supabase"; // Import supabase for test query

const AdminLogin: React.FC = () => {
  const { t } = useLanguage();
  const { user, isAdmin, login, loading, authError, clearAuthError, session } = useUnifiedAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("pushns24@gmail.com");
  const [password, setPassword] = useState<string>("support_SokoC01");
  const [error, setError] = useState<string | null>(null);
  const [showTestButton, setShowTestButton] = useState<boolean>(false); // State for test button

  useEffect(() => {
    if (loading) {
        return;
    }
    if (user && isAdmin) {
      console.log("[AdminLogin] User is already logged in as admin, redirecting...");
      navigate("/admin/dashboard", { replace: true });
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    // Clear previous auth errors when component mounts
    clearAuthError();
  }, [clearAuthError]);

  // Update local error state when authError changes
  useEffect(() => {
    if (authError) {
      // Check if it's the timeout error specifically
      if (
        authError.message.includes("timeout") ||
        authError.message.includes("timed out")
      ) {
        setError(
          t({
            en: "Login request timed out. Please check your connection and try again.",
            fr: "La requête de connexion a expiré. Veuillez vérifier votre connexion et réessayer.",
          }),
        );
      } else if (authError.message.includes("Invalid login credentials")) {
        setError(t({ en: "Invalid credentials", fr: "Identifiants invalides" }));
      } else {
        setError(
          authError.message ||
            t({
              en: "An unexpected error occurred.",
              fr: "Une erreur inattendue s'est produite.",
            }),
        );
      }
      // Show test button even if login times out but auth might have succeeded internally
      setShowTestButton(true); 
    } else {
      setError(null);
    }
  }, [authError, t]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    clearAuthError(); // Clear previous errors before new attempt
    setShowTestButton(false); // Hide button on new submit

    try {
      // Show the test button immediately after starting the login process
      setShowTestButton(true); 

      await login(email, password);

       console.log("Login successful in handleSubmit, attempting navigation...");

    } catch (err) {
      console.error("Login submission error:", err);
    }
  };

  // --- Test Query Function ---
  const handleTestProfileQuery = async () => {
    if (!session?.user?.id) {
      console.error("Test Query: No user session found.");
      alert("No active session to test query.");
      return;
    }
    const userId = session.user.id;
    console.log(`[Test Query] Attempting simplified query for user: ${userId}`);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id") // Simplified query
        .eq("id", userId)
        .maybeSingle();

      console.log(`[Test Query] Simplified query finished. Result:`, { data, error });
      if (error) {
        alert(`Test Query Error: ${error.message}`);
      } else if (data) {
        alert(`Test Query Success: Found user ID ${data.id}`);
      } else {
        alert(`Test Query Success: No profile found for user ${userId}`);
      }
    } catch (err) {
      console.error("[Test Query] Unexpected error:", err);
      alert(`Test Query Failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  // --- End Test Query Function ---

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          {t({ en: "Admin Login", fr: "Connexion Admin" })}
        </h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">
              {error}
            </div>
          )}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              {t({ en: "Email address", fr: "Adresse e-mail" })}
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              {t({ en: "Password", fr: "Mot de passe" })}
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
              placeholder="••••••••"
            />
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading
                ? t({ en: "Initializing...", fr: "Initialisation..." })
                : t({ en: "Sign in", fr: "Se connecter" })}
            </Button>
          </div>
        </form>

        {/* --- Test Button --- */} 
        {showTestButton && session?.user?.id && (
          <div className="mt-4 text-center">
             <p className="text-xs text-gray-500 mb-2">Debug: Session User ID: {session.user.id}</p>
            <Button
              variant="secondary"
              onClick={handleTestProfileQuery}
              size="sm"
            >
              Test Profile Query
            </Button>
          </div>
        )}
        {/* --- End Test Button --- */} 

        <div className="text-sm text-center">
          <a
            href="/"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            {t({ en: "Back to site", fr: "Retour au site" })}
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 