import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    
    if (data.success) {
      // Ya la ruta /administracion verificará la cookie automáticamente
      // Redirigir a la página de administración
      window.location.href = "/administracion";
    } else {
      setError(data.error || "Contraseña incorrecta");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full text-center border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Portal SGC - Acceso Administrativo
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Ingrese la contraseña para acceder al área de administración.
        </p>
        {error && (
          <div className="mb-4 bg-red-100 text-red-800 p-3 rounded-md">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium text-lg"
          >
            Ingresar
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Contraseña por defecto: <code className="font-medium text-blue-600 dark:text-blue-400">falpat-admin-2026</code>
            (o configure la variable de entorno ADMIN_PASSWORD)
          </p>
        </form>
      </div>
    </main>
  );
}