import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { UserX, Smartphone, Globe, ShieldCheck, Clock, Monitor, Table, LayoutGrid } from "lucide-react";
import type { Session } from "./ActiveUsersCard";

function getDevice(userAgent?: string) {
  if (!userAgent) return "Desconocido";
  if (/android/i.test(userAgent)) return "Android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS";
  if (/windows/i.test(userAgent)) return "Windows";
  if (/macintosh|mac os x/i.test(userAgent)) return "Mac";
  if (/linux/i.test(userAgent)) return "Linux";
  return userAgent.split(" ")[0];
}

function formatDuration(ms: number) {
  if (isNaN(ms) || ms < 0) return "-";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm ' : ''}${s}s`;
}

export default function InactiveUsersCard({ language = "es" }: { language?: "es" | "en" }) {
  const [inactiveUsers, setInactiveUsers] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'cards' | 'table'>('cards');

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
    <Card className="w-full mt-6">
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UserX className="text-red-600" /> {language === 'en' ? 'Inactive Users' : 'Usuarios Inactivos'}
            <span className="ml-2 text-2xl font-bold text-red-700">
              {loading ? "..." : inactiveUsers.length}
            </span>
          </h2>
          <button
            className="p-2 rounded hover:bg-gray-100 border text-gray-600 flex items-center gap-1"
            onClick={() => setView(view === 'cards' ? 'table' : 'cards')}
            title={view === 'cards' ? 'Ver como tabla' : 'Ver como cards'}
          >
            {view === 'cards' ? <Table size={18} /> : <LayoutGrid size={18} />}
            <span className="hidden md:inline">{view === 'cards' ? 'Tabla' : 'Cards'}</span>
          </button>
        </div>
        {inactiveUsers.length === 0 && !loading && (
          <p className="text-gray-500 text-center">{language === 'en' ? 'No recent inactive users.' : 'No hay usuarios inactivos recientes.'}</p>
        )}
        {view === 'cards' ? (
          <div className="w-full overflow-x-auto" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div className="flex flex-nowrap gap-4 py-2" style={{ minHeight: '180px' }}>
              {inactiveUsers.map((user) => {
                const start = user.startTimestamp ? new Date(user.startTimestamp).getTime() : 0;
                // @ts-expect-error endTimestamp puede no estar en todos los objetos
                const end = user.endTimestamp ? new Date(user.endTimestamp).getTime() : 0;
                const duration = start && end ? formatDuration(end - start) : '-';
                return (
                  <div key={user._id} className="bg-white shadow-md rounded-lg p-5 min-w-[320px] max-w-sm flex flex-col items-center border border-gray-200">
                    <span className="text-lg font-mono font-bold text-red-900 mb-1">{user.ipAddress || "-"}</span>
                    <div className="flex items-center gap-1 text-gray-600 mb-1">
                      <Globe size={16} />
                      <span>{user.geolocation?.country || "-"}, {user.geolocation?.city || "-"}</span>
                    </div>
                    <div className="flex gap-2 mb-1">
                      <span className="bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 text-xs flex items-center gap-1">
                        <Smartphone size={14} /> {getDevice(user.userAgent)}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs flex items-center gap-1 ${user.vpn ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        <ShieldCheck size={14} /> {language === 'en' ? `VPN: ${user.vpn ? "Yes" : "No"}` : `VPN: ${user.vpn ? "Sí" : "No"}`}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">
                      Lat: {user.geolocation?.latitude ?? "-"}, Lon: {user.geolocation?.longitude ?? "-"}
                    </div>
                    <div className="flex flex-col items-center mt-2 w-full">
                      <span className="flex items-center gap-1 text-xs text-gray-700">
                        <Clock size={13} /> {language === 'en' ? 'Last activity:' : 'Última act:'} {user.lastActive ? new Date(user.lastActive).toLocaleTimeString() : "N/A"}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-700 mt-1 w-full justify-center text-center">
                        <Monitor size={13} /> {language === 'en' ? 'Page:' : 'Página:'} {user.pages && user.pages.length > 0 ? user.pages[user.pages.length - 1].url : "-"}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-red-700 mt-1">
                        <Clock size={13} /> {language === 'en' ? 'Session time:' : 'Tiempo de sesión:'} {duration}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-full" style={{ margin: '0 auto' }}>
            <div style={{ maxHeight: '400px', overflowY: inactiveUsers.length > 10 ? 'auto' : 'visible' }}>
              <table className="min-w-full text-xs text-left border" style={{ tableLayout: 'fixed', width: '100%' }}>
                <colgroup>
                  <col style={{ width: '90px' }} /> {/* IP */}
                  <col style={{ width: '90px' }} /> {/* Ubicación */}
                  <col style={{ width: '80px' }} /> {/* Dispositivo */}
                  <col style={{ width: '50px' }} /> {/* VPN */}
                  <col style={{ width: '70px' }} /> {/* Lat/Lon */}
                  <col style={{ width: '90px' }} /> {/* Última actividad */}
                  <col style={{ width: '160px' }} /> {/* Página */}
                  <col style={{ width: '80px' }} /> {/* Tiempo de sesión */}
                </colgroup>
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-2 whitespace-nowrap">IP</th>
                    <th className="p-2 whitespace-nowrap">Ubicación</th>
                    <th className="p-2 whitespace-nowrap">Dispositivo</th>
                    <th className="p-2 whitespace-nowrap">VPN</th>
                    <th className="p-2 whitespace-nowrap">Lat/Lon</th>
                    <th className="p-2 whitespace-nowrap">Última actividad</th>
                    <th className="p-2 whitespace-nowrap">Página</th>
                    <th className="p-2 whitespace-nowrap">Tiempo de sesión</th>
                  </tr>
                </thead>
                <tbody>
                  {inactiveUsers.map((user) => {
                    const start = user.startTimestamp ? new Date(user.startTimestamp).getTime() : 0;
                    // @ts-expect-error endTimestamp puede no estar en todos los objetos
                    const end = user.endTimestamp ? new Date(user.endTimestamp).getTime() : 0;
                    const duration = start && end ? formatDuration(end - start) : '-';
                    return (
                      <tr key={user._id} className="border-b" style={{ width: '100%' }}>
                        <td className="p-2 font-mono whitespace-nowrap">{user.ipAddress || "-"}</td>
                        <td className="p-2 whitespace-nowrap">{user.geolocation?.country || "-"}, {user.geolocation?.city || "-"}</td>
                        <td className="p-2 whitespace-nowrap">{getDevice(user.userAgent)}</td>
                        <td className="p-2 whitespace-nowrap">{user.vpn ? "Sí" : "No"}</td>
                        <td className="p-2 whitespace-nowrap">{user.geolocation?.latitude ?? "-"}, {user.geolocation?.longitude ?? "-"}</td>
                        <td className="p-2 whitespace-nowrap">{user.lastActive ? new Date(user.lastActive).toLocaleTimeString() : "N/A"}</td>
                        <td className="p-2 truncate overflow-hidden whitespace-nowrap max-w-[140px]">{user.pages && user.pages.length > 0 ? user.pages[user.pages.length - 1].url : "-"}</td>
                        <td className="p-2 whitespace-nowrap">{duration}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 