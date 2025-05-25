import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";

type Session = {
  _id: string;
  ipAddress?: string;
  userAgent?: string;
  lastActive?: string;
  pages?: { url: string }[];
  geolocation?: { city?: string; country?: string };
};

export default function ActiveUsersCard() {
  const [activeUsers, setActiveUsers] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveUsers = () => {
      fetch("/api/sessions-active")
        .then((res) => res.json())
        .then((data) => setActiveUsers(data.activeSessions || []))
        .finally(() => setLoading(false));
    };

    fetchActiveUsers();
    const interval = setInterval(fetchActiveUsers, 10000); // cada 10 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          <User className="text-blue-600" />
          <h2 className="text-lg font-semibold">Usuarios Activos</h2>
          <span className="ml-auto text-2xl font-bold text-blue-700">
            {loading ? "..." : activeUsers.length}
          </span>
        </div>
        {activeUsers.length === 0 && !loading && (
          <p className="text-gray-500">No hay usuarios activos en este momento.</p>
        )}
        <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
          {activeUsers.map((user) => (
            <li key={user._id} className="py-2">
              <div className="flex flex-col md:flex-row md:items-center md:gap-2">
                <span className="font-mono text-xs text-gray-700">
                  {user.ipAddress || "IP desconocida"}
                  {user.geolocation?.country ? ` (${user.geolocation.country})` : ""}
                  {user.geolocation?.city ? `, ${user.geolocation.city}` : ""}
                </span>
                <span className="text-xs text-gray-500">
                  {user.geolocation?.city ? `${user.geolocation.city}, ` : ""}
                  {user.geolocation?.country || ""}
                </span>
                <span className="text-xs text-gray-500 ml-auto">
                  {user.pages && user.pages.length > 0
                    ? `Página: ${user.pages[user.pages.length - 1].url}`
                    : "Sin página"}
                </span>
                <span className="text-xs text-gray-400 ml-2">
                  Última act: {user.lastActive
                    ? new Date(user.lastActive).toLocaleTimeString()
                    : "N/A"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
} 