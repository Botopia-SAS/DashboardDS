import {
    LayoutDashboard,
    Shapes,
    ShoppingBag,
    UsersRound,
    Car,
    BookOpen,
    LifeBuoy,
    CalendarDays,
    MapPinCheck
  } from "lucide-react";
  
  export const navLinks = [
    {
      url: "/",
      icon: <LayoutDashboard />,
      label: "Dashboard",
    },
    {
      url: "/packages",
      icon: <Shapes />,
      label: "Packages",
    },
    {
      url: "/classes",
      icon: <BookOpen />,
      label: "Classes",
    },
    {
      url: "/collections",
      icon: <LifeBuoy />,
      label: "Driving Test",
    },
    {
      url: "/products",
      icon: <Car />,
      label: "Driving Lessons",
    },
    {
      url: "/orders",
      icon: <ShoppingBag />,
      label: "Orders",
    },
    {
      url: "/book", // ✅ Nuevo enlace para "Book"
      icon: <CalendarDays />, // ✅ Puedes cambiar este ícono si prefieres otro
      label: "Book",
    },
    {
      url: "/locations", // ✅ Nuevo enlace para "Book"
      icon: <MapPinCheck />, // ✅ Puedes cambiar este ícono si prefieres otro
      label: "Locations",
    },
    {
      url: "/customers",
      icon: <UsersRound />,
      label: "Customers",
    },
  ];