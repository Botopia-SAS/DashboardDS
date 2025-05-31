import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { User, Smartphone, Globe, ShieldCheck, Clock, Monitor, Table, LayoutGrid, ArrowLeftCircle, ArrowRightCircle } from "lucide-react";

export type Session = {
  _id: string;
  ipAddress?: string;
  userAgent?: string;
  lastActive?: string;
  startTimestamp?: string;
  pages?: { url: string }[];
  geolocation?: { city?: string; country?: string; latitude?: number; longitude?: number; };
  vpn?: boolean;
};

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

export default function ActiveUsersCard({ language = "es" }: { language?: "es" | "en" }) {
  const [activeUsers, setActiveUsers] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const USERS_PER_PAGE = 4;

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
    <Card className="w-full">
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <User className="text-blue-600" /> {language === 'en' ? 'Active Users' : 'Usuarios Activos'}
            <span className="ml-2 text-2xl font-bold text-blue-700">
              {loading ? "..." : activeUsers.length}
            </span>
          </h2>
          <button
            className="p-2 rounded hover:bg-gray-100 border text-gray-600 flex items-center gap-1"
            onClick={() => setView(view === 'cards' ? 'table' : 'cards')}
            title={view === 'cards' ? 'Ver como table' : 'Ver como cards'}
          >
            {view === 'cards' ? <Table size={18} /> : <LayoutGrid size={18} />}
            <span className="hidden md:inline">{view === 'cards' ? 'table' : 'Cards'}</span>
          </button>
        </div>
        {activeUsers.length === 0 && !loading && (
          <p className="text-gray-500 text-center">{language === 'en' ? 'No active users at this moment.' : 'No hay usuarios activos en este momento.'}</p>
        )}
        {view === 'cards' ? (
          <>
            {/* Desktop/Tablet: flechas y tarjetas en flex-row */}
            <div className="w-full flex-row items-center justify-center gap-2 hidden sm:flex" style={{ maxWidth: '1200px', margin: '0 auto', minHeight: '180px' }}>
              {/* Flecha Izquierda (siempre visible) */}
              <button
                className={`bg-white rounded-full shadow p-1.5 border border-blue-100 hover:bg-blue-50 transition-all flex items-center justify-center ${carouselIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                onClick={() => setCarouselIndex(Math.max(0, carouselIndex - USERS_PER_PAGE))}
                disabled={carouselIndex === 0}
                aria-label="Previous"
                style={{ marginLeft: 8, marginRight: 8 }}
              >
                <ArrowLeftCircle size={30} className="text-blue-500" />
              </button>
              {/* Tarjetas de usuario */}
              <div className="flex flex-nowrap gap-4 py-2 flex-1 justify-center px-4 md:px-12 lg:px-20">
                {activeUsers.slice(carouselIndex, carouselIndex + USERS_PER_PAGE).map((user) => {
                  const start = user.startTimestamp ? new Date(user.startTimestamp).getTime() : 0;
                  const last = user.lastActive ? new Date(user.lastActive).getTime() : 0;
                  const duration = start && last ? formatDuration(last - start) : '-';
                  return (
                    <div key={user._id} className="bg-white shadow-md rounded-lg p-5 min-w-[290px] max-w-[320px] flex flex-col items-center border border-gray-200 mx-2">
                      <span className="text-lg font-mono font-bold text-blue-900 mb-1">{user.ipAddress || "-"}</span>
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
                        <span className="flex items-center gap-1 text-xs text-blue-700 mt-1">
                          <Clock size={13} /> {language === 'en' ? 'Session time:' : 'Tiempo de sesión:'} {duration}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Flecha Derecha (siempre visible) */}
              <button
                className={`bg-white rounded-full shadow p-1.5 border border-blue-100 hover:bg-blue-50 transition-all flex items-center justify-center ${(carouselIndex + USERS_PER_PAGE >= activeUsers.length) ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                onClick={() => setCarouselIndex(Math.min(carouselIndex + USERS_PER_PAGE, Math.max(0, activeUsers.length - USERS_PER_PAGE)))}
                disabled={carouselIndex + USERS_PER_PAGE >= activeUsers.length}
                aria-label="Next"
                style={{ marginLeft: 8, marginRight: 8 }}
              >
                <ArrowRightCircle size={30} className="text-blue-500" />
              </button>
            </div>
            {/* Mobile: carrusel horizontal, solo una tarjeta visible, centrada, con swipe */}
            <div className="flex sm:hidden w-full overflow-x-auto snap-x snap-mandatory justify-center gap-2 py-4 px-0" style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }}>
              {activeUsers.length === 0 && !loading && (
                <div className="w-full text-center text-gray-400 py-8">No active users at this moment.</div>
              )}
              {activeUsers.map((user) => {
                const start = user.startTimestamp ? new Date(user.startTimestamp).getTime() : 0;
                const last = user.lastActive ? new Date(user.lastActive).getTime() : 0;
                const duration = start && last ? formatDuration(last - start) : '-';
                return (
                  <div key={user._id} className="bg-white shadow-md rounded-lg p-4 min-w-[90vw] max-w-[90vw] flex flex-col items-center border border-gray-200 mx-auto snap-center">
                    <span className="text-lg font-mono font-bold text-blue-900 mb-1">{user.ipAddress || "-"}</span>
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
                      <span className="flex items-center gap-1 text-xs text-blue-700 mt-1">
                        <Clock size={13} /> {language === 'en' ? 'Session time:' : 'Tiempo de sesión:'} {duration}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="w-full max-w-full" style={{ margin: '0 auto' }}>
            <div style={{ maxHeight: '400px', overflowY: activeUsers.length > 10 ? 'auto' : 'visible' }}>
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
                    <th className="p-2 whitespace-nowrap">{language === 'en' ? 'Location' : 'Ubicación'}</th>
                    <th className="p-2 whitespace-nowrap">{language === 'en' ? 'Device' : 'Dispositivo'}</th>
                    <th className="p-2 whitespace-nowrap">VPN</th>
                    <th className="p-2 whitespace-nowrap">Lat/Lon</th>
                    <th className="p-2 whitespace-nowrap">{language === 'en' ? 'Last activity' : 'Última actividad'}</th>
                    <th className="p-2 whitespace-nowrap">{language === 'en' ? 'Page' : 'Página'}</th>
                    <th className="p-2 whitespace-nowrap">{language === 'en' ? 'Session time' : 'Tiempo de sesión'}</th>
                  </tr>
                </thead>
                <tbody>
                  {activeUsers.map((user) => {
                    const start = user.startTimestamp ? new Date(user.startTimestamp).getTime() : 0;
                    const last = user.lastActive ? new Date(user.lastActive).getTime() : 0;
                    const duration = start && last ? formatDuration(last - start) : '-';
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