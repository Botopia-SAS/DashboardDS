import {
    LayoutDashboard,
    Shapes,
    ShoppingBag,
    Tag,
    UsersRound,
    Car,
    BookOpen,
    LifeBuoy,
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
      url: "/customers",
      icon: <UsersRound />,
      label: "Customers",
    },
  ];