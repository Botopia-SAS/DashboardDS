import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { UserX, Smartphone, Globe, ShieldCheck, Clock, Monitor, Table, LayoutGrid, ArrowLeftCircle, ArrowRightCircle, XCircle } from "lucide-react";
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
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [modalUser, setModalUser] = useState<Session | null>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [cardsHeight, setCardsHeight] = useState(0);

  const USERS_PER_PAGE = 4;

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

  // Ajustar el índice si cambia la cantidad de usuarios
  useEffect(() => {
    if (carouselIndex > Math.max(0, inactiveUsers.length - USERS_PER_PAGE)) {
      setCarouselIndex(Math.max(0, inactiveUsers.length - USERS_PER_PAGE));
    }
  }, [inactiveUsers.length]);

  useLayoutEffect(() => {
    if (cardsRef.current) {
      setCardsHeight(cardsRef.current.offsetHeight);
    }
  }, [inactiveUsers, carouselIndex]);

  // Modal de historial de usuario
  const renderModal = () => {
    if (!modalUser) return null;
    // Find the max duration in pages
    let maxDuration = -1;
    let maxIdx = -1;
    const pages = modalUser.pages || [];
    const endTimestamp = (modalUser as any).endTimestamp ? new Date((modalUser as any).endTimestamp).getTime() : (modalUser.lastActive ? new Date(modalUser.lastActive).getTime() : undefined);
    // Agrupar solo consecutivos con la misma URL
    type GroupedPage = { url: string, totalDuration: number, firstTimestamp: number };
    const groupedPages: GroupedPage[] = [];
    let i = 0;
    while (i < pages.length) {
      const url = pages[i].url;
      let totalDuration = 0;
      let firstTimestamp = (pages[i] as any).timestamp ? new Date((pages[i] as any).timestamp).getTime() : 0;
      let j = i;
      while (j < pages.length && pages[j].url === url) {
        let duration = (pages[j] as any).duration;
        // Si duration es 0 o no existe y NO es la última página, calcula usando la siguiente
        if ((duration === undefined || duration === 0)) {
          if (j < pages.length - 1) {
            const currTs = new Date((pages[j] as any).timestamp).getTime();
            const nextTs = new Date((pages[j + 1] as any).timestamp).getTime();
            if (nextTs > currTs) {
              duration = nextTs - currTs;
            }
          } else if (j === pages.length - 1 && endTimestamp && (pages[j] as any).timestamp) {
            // Última página: calcula usando endTimestamp
            const pageTimestamp = new Date((pages[j] as any).timestamp).getTime();
            if (endTimestamp > pageTimestamp) {
              duration = endTimestamp - pageTimestamp;
            }
          }
        }
        totalDuration += typeof duration === 'number' ? duration : 0;
        j++;
      }
      groupedPages.push({ url, totalDuration, firstTimestamp });
      i = j;
    }
    // Encontrar el grupo con mayor duración
    let maxGroupedDuration = -1;
    let maxGroupedIdx = -1;
    groupedPages.forEach((gp, idx) => {
      if (gp.totalDuration > maxGroupedDuration) {
        maxGroupedDuration = gp.totalDuration;
        maxGroupedIdx = idx;
      }
    });
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full relative border-2 border-blue-400">
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
            onClick={() => setModalUser(null)}
            aria-label="Close"
          >
            <XCircle size={28} />
          </button>
          <h3 className="text-2xl font-bold mb-2 text-blue-700 flex items-center gap-2">
            <UserX className="text-red-600" /> {modalUser.ipAddress || "-"}
          </h3>
          <div className="mb-2 text-gray-600 flex items-center gap-2">
            <Globe size={16} />
            <span>{modalUser.geolocation?.country || "-"}, {modalUser.geolocation?.city || "-"}</span>
          </div>
          <div className="mb-4 text-xs text-gray-500">
            Device: {getDevice(modalUser.userAgent)}
          </div>
          <h4 className="font-semibold text-lg mb-2 text-gray-800">Browsing History</h4>
          <div className="max-h-60 overflow-y-auto rounded bg-gray-50 p-2 border">
            {pages.length > 0 ? (
              <ul className="space-y-2">
                {groupedPages.map((gp, idx) => {
                  const isMax = idx === maxGroupedIdx && gp.totalDuration > 0;
                  return (
                    <li key={gp.url + '-' + gp.firstTimestamp} className={`flex flex-col bg-white rounded-lg shadow p-2 border ${isMax ? 'border-4 border-yellow-400' : 'border-blue-100'}`}>
                      <span className={`font-mono text-sm ${isMax ? 'text-yellow-700 font-bold' : 'text-blue-700'}`}>{gp.url}
                        <span className="ml-2 text-xs text-gray-500">{gp.firstTimestamp ? new Date(gp.firstTimestamp).toLocaleTimeString() : ''}</span>
                      </span>
                      <span className={`text-xs ${isMax ? 'text-yellow-700 font-semibold' : 'text-gray-500'}`}>
                        Time: {formatDuration(gp.totalDuration)}
                        {isMax && <span className="ml-2 px-2 py-0.5 bg-yellow-200 text-yellow-900 rounded-full text-xs font-bold">Longest Stay</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-400 text-center">No history available.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

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
            title={view === 'cards' ? 'Ver como table' : 'Ver como cards'}
          >
            {view === 'cards' ? <Table size={18} /> : <LayoutGrid size={18} />}
            <span className="hidden md:inline">{view === 'cards' ? 'table' : 'Cards'}</span>
          </button>
        </div>
        {inactiveUsers.length === 0 && !loading && (
          <p className="text-gray-500 text-center">{language === 'en' ? 'No recent inactive users.' : 'No hay usuarios inactivos recientes.'}</p>
        )}
        {view === 'cards' ? (
          <>
            {/* Desktop/Tablet: flechas y tarjetas en flex-row */}
            <div className="w-full flex-row items-center justify-center gap-2 hidden sm:flex" style={{ maxWidth: '1200px', margin: '0 auto', minHeight: '260px' }}>
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
              <div ref={cardsRef} className="flex flex-nowrap gap-4 py-2 flex-1 justify-center px-4 md:px-12 lg:px-20">
                {inactiveUsers.slice(carouselIndex, carouselIndex + USERS_PER_PAGE).map((user) => {
                  const start = user.startTimestamp ? new Date(user.startTimestamp).getTime() : 0;
                  // @ts-expect-error endTimestamp puede no estar en todos los objetos
                  const end = user.endTimestamp ? new Date(user.endTimestamp).getTime() : 0;
                  const duration = start && end ? formatDuration(end - start) : '-';
                  return (
                    <div
                      key={user._id}
                      className="bg-gradient-to-br from-blue-50 to-white shadow-xl rounded-2xl p-6 min-w-[290px] max-w-[320px] flex flex-col items-center border-2 border-blue-200 hover:scale-105 hover:shadow-2xl transition-transform cursor-pointer relative group mx-2"
                      onClick={() => setModalUser(user)}
                      style={{ boxSizing: 'border-box' }}
                    >
                      <span className="text-lg font-mono font-bold text-red-900 mb-1 group-hover:underline">{user.ipAddress || "-"}</span>
                      <div className="flex items-center gap-1 text-gray-600 mb-1">
                        <Globe size={16} />
                        <span>{user.geolocation?.country || "-"}, {user.geolocation?.city || "-"}</span>
                      </div>
                      <div className="flex gap-2 mb-1">
                        <span className="bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 text-xs flex items-center gap-1">
                          <Smartphone size={14} /> {getDevice(user.userAgent)}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs flex items-center gap-1 ${user.vpn ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}> 
                          <ShieldCheck size={14} /> VPN: {user.vpn ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mb-1">
                        Lat: {user.geolocation?.latitude ?? "-"}, Lon: {user.geolocation?.longitude ?? "-"}
                      </div>
                      <div className="flex flex-col items-center mt-2 w-full">
                        <span className="flex items-center gap-1 text-xs text-gray-700">
                          <Clock size={13} /> Last activity: {user.lastActive ? new Date(user.lastActive).toLocaleTimeString() : "N/A"}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-700 mt-1 w-full justify-center text-center">
                          <Monitor size={13} /> Page: {user.pages && user.pages.length > 0 ? user.pages[user.pages.length - 1].url : "-"}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-red-700 mt-1">
                          <Clock size={13} /> Session time: {duration}
                        </span>
                      </div>
                      {/* Sombra animada al hacer hover */}
                      <div className="absolute inset-0 rounded-2xl border-2 border-blue-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                  );
                })}
              </div>
              {/* Flecha Derecha (siempre visible) */}
              <button
                className={`bg-white rounded-full shadow p-1.5 border border-blue-100 hover:bg-blue-50 transition-all flex items-center justify-center ${(carouselIndex + USERS_PER_PAGE >= inactiveUsers.length) ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                onClick={() => setCarouselIndex(Math.min(carouselIndex + USERS_PER_PAGE, Math.max(0, inactiveUsers.length - USERS_PER_PAGE)))}
                disabled={carouselIndex + USERS_PER_PAGE >= inactiveUsers.length}
                aria-label="Next"
                style={{ marginLeft: 8, marginRight: 8 }}
              >
                <ArrowRightCircle size={30} className="text-blue-500" />
              </button>
              {renderModal()}
            </div>
            {/* Mobile: carrusel horizontal, solo una tarjeta visible, centrada, con swipe */}
            <div className="flex sm:hidden w-full overflow-x-auto snap-x snap-mandatory justify-center gap-2 py-4 px-0" style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }}>
              {inactiveUsers.length === 0 && !loading && (
                <div className="w-full text-center text-gray-400 py-8">No inactive users.</div>
              )}
              {inactiveUsers.map((user) => {
                const start = user.startTimestamp ? new Date(user.startTimestamp).getTime() : 0;
                // @ts-expect-error endTimestamp puede no estar en todos los objetos
                const end = user.endTimestamp ? new Date(user.endTimestamp).getTime() : 0;
                const duration = start && end ? formatDuration(end - start) : '-';
                return (
                  <div
                    key={user._id}
                    className="bg-gradient-to-br from-blue-50 to-white shadow-xl rounded-2xl p-4 min-w-[90vw] max-w-[90vw] flex flex-col items-center border-2 border-blue-200 hover:scale-105 hover:shadow-2xl transition-transform cursor-pointer relative group snap-center mx-auto"
                    onClick={() => setModalUser(user)}
                    style={{ boxSizing: 'border-box' }}
                  >
                    <span className="text-lg font-mono font-bold text-red-900 mb-1 group-hover:underline">{user.ipAddress || "-"}</span>
                    <div className="flex items-center gap-1 text-gray-600 mb-1">
                      <Globe size={16} />
                      <span>{user.geolocation?.country || "-"}, {user.geolocation?.city || "-"}</span>
                    </div>
                    <div className="flex gap-2 mb-1">
                      <span className="bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 text-xs flex items-center gap-1">
                        <Smartphone size={14} /> {getDevice(user.userAgent)}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs flex items-center gap-1 ${user.vpn ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        <ShieldCheck size={14} /> VPN: {user.vpn ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">
                      Lat: {user.geolocation?.latitude ?? "-"}, Lon: {user.geolocation?.longitude ?? "-"}
                    </div>
                    <div className="flex flex-col items-center mt-2 w-full">
                      <span className="flex items-center gap-1 text-xs text-gray-700">
                        <Clock size={13} /> Last activity: {user.lastActive ? new Date(user.lastActive).toLocaleTimeString() : "N/A"}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-700 mt-1 w-full justify-center text-center">
                        <Monitor size={13} /> Page: {user.pages && user.pages.length > 0 ? user.pages[user.pages.length - 1].url : "-"}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-red-700 mt-1">
                        <Clock size={13} /> Session time: {duration}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
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