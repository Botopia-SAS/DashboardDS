import {
    LayoutDashboard,
    Shapes,
    ShoppingBag,
    UsersRound,
    Car,
    BookOpen,
    LifeBuoy,
    CalendarDays,
    MapPinCheck,
    Search, // ✅ Importamos el icono de búsqueda
    Ticket
  } from "lucide-react";
  
  export const navLinks = [
    {
      url: "/console",
      icon: <LayoutDashboard />,
      label: "Dashboard",
    },
    // {
    //   url: "/packages",
    //   icon: <Shapes />,
    //   label: "Packages",
    // },
    {
      url: "/classes",
      icon: <BookOpen />,
      label: "Classes",
    },
    //{
    //  url: "/collections",
    //  icon: <LifeBuoy />,
    //  label: "Driving Test",
    //},
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
      url: "/ticket",  // ✅ Agregamos la URL para la sección de Tickets
      icon: <Ticket />,
      label: "Tickets",
    },
    {
      url: "/driving-test-lessons",
      icon: <LifeBuoy />, // Usamos BookOpen como ejemplo, puedes cambiarlo si prefieres otro
      label: "Driving Test/Lessons",
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
    {
      url: "/seo",  // ✅ Agregamos la URL para la sección de SEO
      icon: <Search />,  // ✅ Usamos un icono de búsqueda para representar SEO
      label: "SEO",
    }

  ];