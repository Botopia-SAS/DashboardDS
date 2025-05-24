import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { UserX } from "lucide-react";

type Session = {
  _id: string;
  ipAddress?: string;
  userAgent?: string;
  lastActive?: string;
  pages?: { url: string }[];
  geolocation?: { city?: string; country?: string };
};

export default function InactiveUsersCard() {
  const [inactiveUsers, setInactiveUsers] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInactiveUsers = () => {
      fetch("/api/sessions-inactive")
        .then((res) => res.json())
        .then((data) => setInactiveUsers(data.inactiveSessions || []))
        .finally(() => setLoading(false));
    };

    fetchInactiveUsers();
    const interval = setInterval(fetchInactiveUsers, 20000); // cada 20 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          <UserX className="text-red-600" />
          <h2 className="text-lg font-semibold">Usuarios Inactivos</h2>
          <span className="ml-auto text-2xl font-bold text-red-700">
            {loading ? "..." : inactiveUsers.length}
          </span>
        </div>
        {inactiveUsers.length === 0 && !loading && (
          <p className="text-gray-500">No hay usuarios inactivos recientes.</p>
        )}
        <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
          {inactiveUsers.map((user) => (
            <li key={user._id} className="py-2">
              <div className="flex flex-col md:flex-row md:items-center md:gap-2">
                <span className="font-mono text-xs text-gray-700">
                  {user.ipAddress || "IP desconocida"}
                  {user.geolocation?.country ? ` (${user.geolocation.country})` : ""}
                  {user.geolocation?.city ? `, ${user.geolocation.city}` : ""}
                </span>
                <span className="text-xs text-gray-500 ml-2">
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