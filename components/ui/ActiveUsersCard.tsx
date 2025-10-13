import { useEffect, useState, useRef } from "react";
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

function getDevice(userAgent: string | undefined) {
  if (!userAgent) return "Unknown";
  if (userAgent.includes("Mobile")) return "Mobile";
  if (userAgent.includes("Tablet")) return "Tablet";
  return "Desktop";
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
  const [usersPerPage, setUsersPerPage] = useState(4);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fijar en 5 tarjetas por página para todas las pantallas
  useEffect(() => {
    setUsersPerPage(5);
  }, []);

  useEffect(() => {
    // Create SSE connection
    const eventSource = new EventSource('/api/sessions-active?sse=true');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.activeSessions) {
          setActiveUsers(data.activeSessions);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setLoading(false);
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = new EventSource('/api/sessions-active?sse=true');
        }
      }, 5000);
    };

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">
              {language === 'en' ? 'Active Users' : 'Usuarios Activos'}
            </h3>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {activeUsers.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('cards')}
              className={`p-2 rounded ${view === 'cards' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setView('table')}
              className={`p-2 rounded ${view === 'table' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Table size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : view === 'cards' ? (
          <>
            {/* Desktop: carrusel con flechas */}
            <div className="w-full flex items-center justify-center gap-2 hidden sm:flex px-2 md:px-3" style={{ maxWidth: '100%', margin: '0 auto', minHeight: '21rem' }}>
              {/* Flecha Izquierda */}
              <div className="flex-shrink-0">
                <button
                  className={`bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg p-3 border-2 border-green-500 transition-all flex items-center justify-center ${carouselIndex === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:scale-110 hover:shadow-xl'}`}
                  onClick={() => setCarouselIndex(Math.max(0, carouselIndex - usersPerPage))}
                  disabled={carouselIndex === 0}
                  aria-label="Previous"
                >
                  <ArrowLeftCircle size={24} className="text-white" />
                </button>
              </div>
              {/* Cards */}
              <div className="flex flex-nowrap gap-1 py-4 justify-center overflow-hidden pr-2" style={{ minWidth: 0, flex: '1 1 auto' }}>
                {activeUsers.slice(carouselIndex, carouselIndex + usersPerPage).map((user) => {
                  const start = user.startTimestamp ? new Date(user.startTimestamp).getTime() : 0;
                  const last = user.lastActive ? new Date(user.lastActive).getTime() : 0;
                  const duration = start && last ? formatDuration(last - start) : '-';
                  return (
                    <div
                      key={user._id}
                      className="bg-gradient-to-br from-green-50 to-white shadow-lg rounded-xl p-3 w-[15.5rem] h-[20rem] flex flex-col justify-between items-center border border-green-200 hover:scale-105 hover:shadow-xl transition-transform cursor-pointer relative group flex-shrink-0"
                      style={{ 
                        boxSizing: 'border-box',
                        minWidth: 'clamp(200px, 15.5rem, 280px)',
                        maxWidth: 'clamp(200px, 15.5rem, 280px)',
                        minHeight: 'clamp(300px, 20rem, 350px)',
                        maxHeight: 'clamp(300px, 20rem, 350px)'
                      }}
                    >
                      {/* Sección superior */}
                      <div className="flex flex-col items-center text-center">
                        <span className="text-base font-mono font-bold text-green-900 mb-2 group-hover:underline">{user.ipAddress || "-"}</span>
                        <div className="flex items-center gap-1 text-gray-600 mb-2">
                          <Globe size={16} />
                          <span className="text-sm">{user.geolocation?.country || "-"}, {user.geolocation?.city || "-"}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2 justify-center">
                          <span className="bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 text-xs flex items-center gap-1">
                            <Smartphone size={12} /> {getDevice(user.userAgent)}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-xs flex items-center gap-1 ${user.vpn ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}> 
                            <ShieldCheck size={12} /> VPN: {user.vpn ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                          <span>Lat: {user.geolocation?.latitude ?? "-"}</span>
                          <span>Lon: {user.geolocation?.longitude ?? "-"}</span>
                        </div>
                      </div>
                      
                      {/* Sección inferior */}
                      <div className="flex flex-col items-center text-center w-full space-y-1">
                        <span className="flex items-center gap-1 text-xs text-gray-700">
                          <Clock size={12} /> Last activity: {user.lastActive ? new Date(user.lastActive).toLocaleTimeString() : "N/A"}
                        </span>
                        <div className="flex flex-col items-center gap-1 text-xs text-gray-700 w-full">
                          <div className="flex items-center gap-1">
                            <Monitor size={12} /> Page:
                          </div>
                          <div className="text-center break-words max-w-full px-1">
                            {user.pages && user.pages.length > 0 ? user.pages[user.pages.length - 1].url : "-"}
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1 text-xs text-blue-700 w-full">
                          <div className="flex items-center gap-1">
                            <Clock size={12} /> Session time:
                          </div>
                          <div className="text-center break-words max-w-full px-1">
                            {duration}
                          </div>
                        </div>
                      </div>
                      {/* Sombra animada al hacer hover */}
                      <div className="absolute inset-0 rounded-xl border-2 border-green-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                  );
                })}
              </div>
              {/* Flecha Derecha */}
              <div className="flex-shrink-0">
                <button
                  className={`bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg p-3 border-2 border-green-500 transition-all flex items-center justify-center ${(carouselIndex + usersPerPage >= activeUsers.length) ? 'opacity-40 cursor-not-allowed' : 'hover:scale-110 hover:shadow-xl'}`}
                  onClick={() => setCarouselIndex(Math.min(carouselIndex + usersPerPage, Math.max(0, activeUsers.length - usersPerPage)))}
                  disabled={carouselIndex + usersPerPage >= activeUsers.length}
                  aria-label="Next"
                >
                  <ArrowRightCircle size={24} className="text-white" />
                </button>
              </div>
            </div>
            {/* Mobile: carrusel horizontal, solo una tarjeta visible, centrada, con swipe */}
            <div className="sm:hidden w-full overflow-x-auto snap-x snap-mandatory justify-center gap-2 py-4 px-0" style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }}>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">IP</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Device</th>
                  <th className="px-6 py-3">VPN</th>
                  <th className="px-6 py-3">Last Activity</th>
                  <th className="px-6 py-3">Page</th>
                </tr>
              </thead>
              <tbody>
                {activeUsers.map((user) => (
                  <tr key={user._id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono">{user.ipAddress || "-"}</td>
                    <td className="px-6 py-4">{user.geolocation?.country || "-"}, {user.geolocation?.city || "-"}</td>
                    <td className="px-6 py-4">{getDevice(user.userAgent)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${user.vpn ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {user.vpn ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-4">{user.lastActive ? new Date(user.lastActive).toLocaleTimeString() : "N/A"}</td>
                    <td className="px-6 py-4">{user.pages && user.pages.length > 0 ? user.pages[user.pages.length - 1].url : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 