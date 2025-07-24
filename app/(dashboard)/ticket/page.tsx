"use client";
import useClassTypeStore from "@/app/store/classTypeStore";
import Navigation from "@/components/ticket/navigation-card";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TicketCalendar from "@/components/ticket/TicketCalendar";
import { useState, useEffect } from "react";
import Loader from "@/components/custom ui/Loader";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Pages() {
  const { setClassType } = useClassTypeStore();
  const [loading, setLoading] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [studentNames, setStudentNames] = useState<Record<string, string>>({});
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Fetch ticket classes with studentRequests
    const fetchPending = async () => {
      const res = await fetch("/api/ticket/calendar");
      if (!res.ok) return;
      const data = await res.json();
      // Buscar todos los studentRequests pendientes
      const pending: any[] = [];
      const studentIds: string[] = [];
      data.forEach((ticket: any) => {
        if (Array.isArray(ticket.studentRequests)) {
          ticket.studentRequests.forEach((req: any) => {
            if (req.status === "pending") {
              pending.push({
                ticketClassId: ticket._id,
                classType: ticket.type,
                date: ticket.date,
                hour: ticket.hour,
                endHour: ticket.endHour,
                studentId: req.studentId,
                requestId: req._id,
                requestDate: req.requestDate,
              });
              if (req.studentId && !studentIds.includes(req.studentId)) {
                studentIds.push(req.studentId);
              }
            }
          });
        }
      });
      setPendingRequests(pending);
      // Fetch student names
      if (studentIds.length > 0) {
        const usersRes = await fetch(`/api/users?ids=${studentIds.join(",")}`);
        if (usersRes.ok) {
          const users = await usersRes.json();
          const names: Record<string, string> = {};
          users.forEach((u: any) => {
            names[u._id] = `${u.firstName} ${u.lastName}`;
          });
          setStudentNames(names);
        }
      }
    };
    fetchPending();
  }, []);

  const handleAccept = async (ticketClassId: string, studentId: string, requestId: string) => {
    // PATCH para aceptar la solicitud
    setPendingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
    await fetch(`/api/ticket/classes/${ticketClassId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "acceptRequest", studentId, requestId }),
    });
    setCalendarRefreshKey((k) => k + 1);
  };

  if (loading) return <Loader />;

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center bg-gray-800 text-white px-5 py-3 rounded-lg shadow-md">
          <h1 className="text-xl font-semibold">Tickets</h1>
          <div className="relative">
            <button onClick={() => setNotifOpen((v) => !v)} className="relative">
              <Bell className="w-6 h-6" />
              {pendingRequests.length > 0 && (
                <span className="absolute -top-2 -right-3 flex items-center justify-center w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full border-2 border-white shadow">{pendingRequests.length}</span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-white text-gray-900 rounded-lg shadow-lg z-50 p-4">
                <h3 className="font-bold mb-2">Pending Requests</h3>
                {pendingRequests.length === 0 ? (
                  <p className="text-gray-500">No pending requests</p>
                ) : (
                  <ul className="space-y-2 max-h-80 overflow-y-auto">
                    {pendingRequests.map((req, idx) => {
                      const dateStr = req.date ? req.date.split("T")[0] : "";
                      const hourStr = req.hour || "";
                      const endHourStr = req.endHour || "";
                      const studentName = studentNames[req.studentId] || req.studentId;
                      return (
                        <li key={req.requestId} className="border-b pb-2 flex flex-col gap-1">
                          <span className="font-medium">{req.classType.toUpperCase()} - {dateStr} {hourStr}{endHourStr ? ` - ${endHourStr}` : ""}</span>
                          <span className="text-sm">Student: <b>{studentName}</b></span>
                          <Button size="sm" className="mt-1 w-fit" onClick={() => handleAccept(req.ticketClassId, req.studentId, req.requestId)}>Aceptar</Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-6">
        <Tabs className="w-full" defaultValue="date">
          <TabsList className="grid w-full grid-cols-3 gap-x-2">
            <TabsTrigger
              value="date"
              onClick={() => setClassType("date")}
              className="px-4 py-2 rounded-lg hover:bg-gray-100 w-full data-[state=active]:bg-gray-300 data-[state=active]:font-medium"
            >
              D.A.T.E.
            </TabsTrigger>
            <TabsTrigger
              value="bdi"
              onClick={() => setClassType("bdi")}
              className="px-4 py-2 rounded-lg hover:bg-gray-100 w-full data-[state=active]:bg-gray-300 data-[state=active]:font-medium"
            >
              B.D.I.
            </TabsTrigger>
            <TabsTrigger
              value="adi"
              onClick={() => setClassType("adi")}
              className="px-4 py-2 rounded-lg hover:bg-gray-100 w-full data-[state=active]:bg-gray-300 data-[state=active]:font-medium"
            >
              A.D.I.
            </TabsTrigger>
          </TabsList>
          <TabsContent value="date" className="w-full">
            <Separator className="bg-gray-400 my-4" />
            <Card>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                  <Navigation
                    href={"/ticket/day-of-class/date"}
                    title="Day of Class Preparation"
                    description="Prepare for upcoming classes"
                  />
                  <Navigation
                    href="/ticket/utilities"
                    title="Utilities / Records"
                    description="Access common utilities and records"
                  />
                </div>
                <div className="mt-8">
                  <TicketCalendar refreshKey={calendarRefreshKey} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="bdi" className="w-full">
            <Separator className="bg-gray-400 my-4" />
            <Card>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                  <Navigation
                    href={"/ticket/day-of-class/bdi"}
                    title="Day of Class Preparation"
                    description="Prepare for upcoming classes"
                  />
                  <Navigation
                    href="/ticket/utilities"
                    title="Utilities / Records"
                    description="Access common utilities and records"
                  />
                </div>
                <div className="mt-8">
                  <TicketCalendar refreshKey={calendarRefreshKey} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="adi" className="w-full">
            <Separator className="bg-gray-400 my-4" />
            <Card>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                  <Navigation
                    href={"/ticket/day-of-class/adi"}
                    title="Day of Class Preparation"
                    description="Prepare for upcoming classes"
                  />
                  <Navigation
                    href="/ticket/utilities"
                    title="Utilities / Records"
                    description="Access common utilities and records"
                  />
                </div>
                <div className="mt-8">
                  <TicketCalendar refreshKey={calendarRefreshKey} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
