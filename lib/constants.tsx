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
      url: "/console",
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
      url: "/instructors",
      icon: <CalendarDays />, 
      label: "Instructors",
    },
    {
      url: "/locations",
      icon: <MapPinCheck />,
      label: "Locations",
    },
    {
      url: "/customers",
      icon: <UsersRound />,
      label: "Customers",
    },
  ];