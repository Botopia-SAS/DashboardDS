"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HelpCircle, X } from "lucide-react";

interface GuideContent {
  title: string;
  sections: {
    title: string;
    description: string;
  }[];
}

const guideContentMap: Record<string, GuideContent> = {
  "/console": {
    title: "Console Dashboard Guide",
    sections: [
      {
        title: "🔄 Active & Inactive Users",
        description: "At the top, you'll see two cards showing your active and inactive users. This gives you a quick snapshot of your current user engagement levels."
      },
      {
        title: "📊 Key Metrics Cards",
        description: "View three important metrics: Unique Users (total visitors), Total Events (all interactions), and Average Session Time (how long users stay on your site)."
      },
      {
        title: "📈 Events by Type Chart",
        description: "A bar chart showing different types of user interactions (clicks, page views, etc.) to understand how users engage with your website."
      },
      {
        title: "🗺️ Website Heatmap",
        description: "Scroll down to the heatmap section. Select any page from the dropdown to see a visual overlay showing where users click most. Red/hot areas = high activity, blue/cold areas = low activity."
      },
      {
        title: "🧭 Navigation Menu",
        description: "Use the top navigation to access: Users (manage user roles), Analytics (detailed reports), FAQ (manage website questions), and Contact (email management)."
      }
    ]
  },
  "/console/analytics": {
    title: "Analytics Dashboard Guide",
    sections: [
      {
        title: "📅 Time Period Selector",
        description: "Choose your analysis period: Today, Last Week, Last Month, or Custom dates. This filters all data on the page to show information for your selected timeframe."
      },
      {
        title: "🎯 Summary Metrics",
        description: "Four key cards show: Total Sessions (visitor sessions), Average Time (time spent per session), Devices (total device count), and Countries (number of countries your visitors come from)."
      },
      {
        title: "💻 Device & Browser Breakdown",
        description: "Three detailed cards break down your visitors by: Device type (mobile/desktop/tablet), Web browsers (Chrome, Firefox, Safari, etc.), and Operating systems (Windows, Mac, iOS, Android)."
      },
      {
        title: "📊 Visual Charts",
        description: "Two interactive charts: Sessions by Hour (bar chart showing when users visit) and Device Distribution (pie chart showing device preferences). Hover over sections for detailed numbers."
      },
      {
        title: "📄 Page Performance",
        description: "The 'Top Pages' section shows each webpage's performance with visit counts, total time spent, and number of clicks. This helps identify your most popular content."
      },
      {
        title: "🌍 Geographic Data",
        description: "Two location cards show your top 5 countries (with flag emojis) and cities, helping you understand your geographic reach and plan targeted content."
      }
    ]
  },
  "/console/faq": {
    title: "FAQ Management Guide",
    sections: [
      {
        title: "📋 FAQ Categories",
        description: "Your FAQ is organized into categories (Driving Lessons, Advanced Driving Course). Each category shows a count badge indicating how many questions it contains."
      },
      {
        title: "➕ Adding New Questions",
        description: "Click the '+' button in any category to add a new FAQ. Fill in the question, write the answer (HTML formatting allowed), and optionally add a link with custom text and URL."
      },
      {
        title: "✏️ Editing Existing Questions",
        description: "Click the pencil icon on any question to edit it. You can modify the question text, update the answer, change link text/URLs, or remove links entirely."
      },
      {
        title: "🗑️ Deleting Questions",
        description: "Use the red trash icon to permanently delete questions that are no longer needed. This immediately removes them from your website's FAQ section."
      },
      {
        title: "🔗 Link Management",
        description: "Each FAQ can include optional links for additional resources. Add link text and URL when creating/editing. Use the blue link icon to test links directly from the admin panel."
      },
      {
        title: "💾 Automatic Saving",
        description: "All changes (add/edit/delete) are automatically saved to your database and immediately reflected on your website. You'll see confirmation messages for each action."
      }
    ]
  },
  "/console/user": {
    title: "User Role Management Guide",
    sections: [
      {
        title: "👤 Change User Roles",
        description: "This page allows you to modify user permissions and access levels in your system."
      },
      {
        title: "📧 User Identification",
        description: "Enter the user's email address to identify which user account you want to modify."
      },
      {
        title: "🔐 Role Assignment",
        description: "Select the new role you want to assign to the user. Different roles have different access permissions within your system."
      },
      {
        title: "✅ Confirmation System",
        description: "After submitting changes, you'll receive confirmation messages indicating whether the role update was successful or if there were any errors."
      }
    ]
  },
  "/console/contact": {
    title: "Contact Center Guide",
    sections: [
      {
        title: "📧 Email Management",
        description: "This is your central hub for managing all email communications with your users and customers."
      },
      {
        title: "🎂 Birthday Email Settings",
        description: "Toggle the 'Enable Birthday Emails' checkbox to automatically send birthday greetings to users. This helps maintain customer relationships."
      },
      {
        title: "⏰ Class Reminder Settings",
        description: "Use 'Enable Class Reminders' to automatically send reminder emails to students about upcoming classes and lessons."
      },
      {
        title: "📝 Email Templates",
        description: "The Templates Panel allows you to create, edit, and manage email templates for different types of communications (reminders, confirmations, etc.)."
      },
      {
        title: "✉️ Contact Form",
        description: "Use the contact form section to send direct emails to users, manage communication preferences, and handle customer inquiries efficiently."
      },
      {
        title: "⚙️ Automatic Settings",
        description: "All email preferences are automatically saved when you toggle them. The system will handle sending emails based on your settings without manual intervention."
      }
    ]
  },
  "/classes": {
    title: "Classes Management Guide",
    sections: [
      {
        title: "📚 Classes vs Online Courses",
        description: "Switch between 'Classes' and 'Online' tabs to manage physical driving classes or online courses separately. Each has different management requirements."
      },
      {
        title: "➕ Adding New Classes",
        description: "Click the 'Create New Class' button to add physical driving classes or online courses. Fill in details like title, description, price, and schedule."
      },
      {
        title: "✏️ Managing Existing Classes",
        description: "View all your classes in the data table. Click on any class to edit details, update pricing, modify schedules, or delete outdated classes."
      },
      {
        title: "👥 Class Enrollment",
        description: "Track student enrollments, monitor class capacity, and manage waitlists directly from the class management interface."
      }
    ]
  },
  "/customers": {
    title: "Customer Management Guide",
    sections: [
      {
        title: "👤 Customer Database",
        description: "View all your customers in a comprehensive table with personal information, contact details, enrollment status, and payment history."
      },
      {
        title: "➕ Adding New Customers",
        description: "Click 'Add New Customer' to register new students. Fill in personal information, contact details, emergency contacts, and payment preferences."
      },
      {
        title: "📋 Customer Profiles",
        description: "Click on any customer to view their complete profile including driving progress, lesson history, payment records, and notes."
      },
      {
        title: "🔍 Search & Filter",
        description: "Use the search bar to quickly find customers by name, email, phone number, or license number. Filter by enrollment status or course type."
      },
      {
        title: "📞 Contact Management",
        description: "Track all customer communications, update contact preferences, and manage emergency contact information for safety."
      }
    ]
  },
  "/instructors": {
    title: "Instructor Management Guide",
    sections: [
      {
        title: "👨‍🏫 Instructor Directory",
        description: "View all your driving instructors with their qualifications, availability, assigned students, and performance metrics."
      },
      {
        title: "➕ Adding New Instructors",
        description: "Register new instructors by filling in their certification details, availability schedule, contact information, and specializations."
      },
      {
        title: "📅 Schedule Management",
        description: "Manage instructor schedules, assign students to specific instructors, and track lesson appointments and availability."
      },
      {
        title: "🎯 Performance Tracking",
        description: "Monitor instructor performance metrics including student pass rates, lesson completion rates, and customer satisfaction scores."
      },
      {
        title: "📋 Certification Management",
        description: "Track instructor certifications, renewal dates, and ensure all instructors maintain current licensing and training requirements."
      }
    ]
  },
  "/driving-test-lessons": {
    title: "Driving Lessons & Tests Guide",
    sections: [
      {
        title: "📅 Calendar View",
        description: "View all scheduled driving lessons and tests in a calendar format. See instructor availability and student appointments at a glance."
      },
      {
        title: "👨‍🏫 Instructor Selection",
        description: "Choose specific instructors to view their schedules. Each instructor has their own calendar showing lessons, tests, and availability."
      },
      {
        title: "📝 Lesson Scheduling",
        description: "Schedule new driving lessons by selecting dates, times, and assigning students to available instructors."
      },
      {
        title: "🚗 Test Scheduling",
        description: "Book driving tests for qualified students. Ensure students meet prerequisites before scheduling their official driving examination."
      },
      {
        title: "✅ Status Management",
        description: "Track lesson statuses (scheduled, completed, cancelled, rescheduled) and maintain accurate records for each student's progress."
      }
    ]
  },
  "/ticket": {
    title: "Ticket Management Guide",
    sections: [
      {
        title: "🎫 Ticket System",
        description: "Manage different types of tickets including ADI (Approved Driving Instructor), BDI (Basic Driving Instructor), and Date-specific class tickets."
      },
      {
        title: "📋 Navigation Cards",
        description: "Use the navigation cards to access different ticket types: ADI tickets, BDI tickets, Date-based tickets, and Day-of-class management."
      },
      {
        title: "📅 Calendar Integration",
        description: "View and manage tickets in calendar format. Schedule classes, assign instructors, and track student attendance efficiently."
      },
      {
        title: "👥 Class Records",
        description: "Maintain detailed class records for each ticket type, including student attendance, progress notes, and completion certificates."
      },
      {
        title: "🛠️ Utilities",
        description: "Access ticket utilities for bulk operations, report generation, and administrative tasks to streamline your ticket management process."
      }
    ]
  },
  "/locations": {
    title: "Location Management Guide",
    sections: [
      {
        title: "📍 Location Database",
        description: "Manage all your driving school locations including addresses, contact information, facilities, and operating hours."
      },
      {
        title: "➕ Adding Locations",
        description: "Add new locations by providing complete address details, contact information, facility descriptions, and available services."
      },
      {
        title: "🏢 Facility Management",
        description: "Track facility details such as classroom capacity, parking availability, vehicle storage, and special equipment for each location."
      },
      {
        title: "🕐 Operating Hours",
        description: "Set and manage operating hours for each location, including special hours for holidays and seasonal adjustments."
      }
    ]
  },
  "/products": {
    title: "Product Management Guide",
    sections: [
      {
        title: "📦 Product Catalog",
        description: "Manage your driving school products including lesson packages, study materials, equipment, and merchandise."
      },
      {
        title: "➕ Add New Products",
        description: "Create new products by setting names, descriptions, pricing, categories, and availability status."
      },
      {
        title: "💰 Pricing Management",
        description: "Set and update product prices, create discount packages, and manage promotional pricing for different customer segments."
      },
      {
        title: "📊 Inventory Tracking",
        description: "Monitor product availability, stock levels, and automatically track sales to maintain adequate inventory."
      }
    ]
  },
  "/packages": {
    title: "Package Management Guide",
    sections: [
      {
        title: "📦 Lesson Packages",
        description: "Create and manage lesson packages that combine multiple services like theory classes, practical lessons, and test preparation."
      },
      {
        title: "💡 Package Creation",
        description: "Design custom packages by selecting included services, setting package pricing, and defining terms and conditions."
      },
      {
        title: "🎯 Target Packages",
        description: "Create packages for different student needs: beginner packages, intensive courses, test preparation, and refresher lessons."
      },
      {
        title: "💰 Package Pricing",
        description: "Set competitive package prices that offer value to students while maintaining profitability for your business."
      }
    ]
  },
  "/orders": {
    title: "Order Management Guide",
    sections: [
      {
        title: "🛒 Order Processing",
        description: "View and manage all customer orders including lesson bookings, package purchases, and product orders."
      },
      {
        title: "💳 Payment Status",
        description: "Track payment status for all orders: pending, paid, partially paid, refunded, and failed payments."
      },
      {
        title: "📋 Order Details",
        description: "Access complete order information including customer details, items ordered, pricing, and delivery/service dates."
      },
      {
        title: "🔄 Order Updates",
        description: "Update order status, process refunds, modify orders, and communicate with customers about their purchases."
      }
    ]
  },
  "/seo": {
    title: "SEO Management Guide",
    sections: [
      {
        title: "🔍 Meta Information",
        description: "Manage your website's meta titles and descriptions to improve search engine visibility and click-through rates."
      },
      {
        title: "🤖 Robots.txt",
        description: "Configure your robots.txt file to control how search engines crawl and index your website pages."
      },
      {
        title: "🗺️ Sitemap Management",
        description: "Set up and maintain your XML sitemap URL to help search engines discover and index all your website pages."
      },
      {
        title: "📈 SEO Optimization",
        description: "Use SEO tools to optimize your website's search engine ranking and improve online visibility for your driving school."
      }
    ]
  },
  "/collections": {
    title: "Collections Management Guide",
    sections: [
      {
        title: "📂 Content Collections",
        description: "Organize and manage collections of related content such as lesson materials, student resources, and administrative documents."
      },
      {
        title: "➕ Create Collections",
        description: "Group related items into collections for easier management and organization of your driving school resources."
      },
      {
        title: "📋 Collection Management",
        description: "Add, remove, and organize items within collections. Set access permissions and sharing settings for different user groups."
      },
      {
        title: "🔗 Resource Linking",
        description: "Link collections to specific courses, instructors, or student groups to provide targeted access to relevant materials."
      }
    ]
  }
};

export default function GuideButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentGuide, setCurrentGuide] = useState<GuideContent | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const guide = guideContentMap[pathname];
    if (guide) {
      setCurrentGuide(guide);
    } else {
      setCurrentGuide(null);
    }
  }, [pathname]);

  // Use a default guide if no specific guide exists for the current page
  const displayGuide = currentGuide || {
    title: "Dashboard Guide",
    sections: [
      {
        title: "🏠 Navigation",
        description: "Use the left sidebar to navigate between different sections of your dashboard. Each section helps you manage different aspects of your driving school business."
      },
      {
        title: "📊 Data Management",
        description: "Most pages include data tables where you can view, edit, and manage your records. Look for buttons like 'Add New', 'Edit', and 'Delete' to perform actions."
      },
      {
        title: "🔍 Search & Filter",
        description: "Use search boxes and filters to quickly find specific records in your data tables."
      },
      {
        title: "💾 Save Changes",
        description: "Remember to save your changes when editing forms. Most changes are automatically saved, and you'll see confirmation messages."
      }
    ]
  };

  return (
    <>
      {/* Floating Guide Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
          size="icon"
        >
          <HelpCircle className="w-6 h-6" />
        </Button>
      </div>

      {/* Guide Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-700">
              {displayGuide.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {displayGuide.sections.map((section, index) => (
              <div key={index} className="border-l-4 border-blue-200 pl-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {section.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {section.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Need more help? Contact support for additional assistance.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}