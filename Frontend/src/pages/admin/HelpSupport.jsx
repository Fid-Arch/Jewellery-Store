import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/Layout";
import Modal from "../../components/admin/Modal";
import SupportTicketManager from "../../components/admin/SupportTicketManager";
import { 
  HelpCircle, 
  Search, 
  Plus, 
  MessageSquare, 
  BookOpen, 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Phone,
  Mail,
  Calendar,
  Tag,
  Filter,
  Eye,
  Edit,
  Trash2
} from "lucide-react";

const HelpSupport = () => {
  const [activeTab, setActiveTab] = useState('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [tickets, setTickets] = useState([]);

  // Initialize tickets with mock data
  useEffect(() => {
    setTickets([
      {
        id: 1,
        title: "Unable to process payment for order #12345",
        description: "Customer reported payment failure during checkout process",
        status: "open",
        priority: "high",
        category: "Payment",
        customer: "John Doe",
        email: "john@example.com",
        created: "2024-01-15T10:30:00Z",
        updated: "2024-01-15T10:30:00Z",
        assigned: "Admin User"
      },
      {
        id: 2,
        title: "Product image not displaying correctly",
        description: "Product images are showing as broken links in the catalog",
        status: "in_progress",
        priority: "medium",
        category: "Technical",
        customer: "Jane Smith",
        email: "jane@example.com",
        created: "2024-01-14T15:45:00Z",
        updated: "2024-01-15T09:20:00Z",
        assigned: "Tech Support"
      },
      {
        id: 3,
        title: "User account locked out",
        description: "Customer cannot access their account after multiple failed login attempts",
        status: "resolved",
        priority: "high",
        category: "Account",
        customer: "Mike Johnson",
        email: "mike@example.com",
        created: "2024-01-13T08:15:00Z",
        updated: "2024-01-14T16:30:00Z",
        assigned: "Admin User"
      }
    ]);
  }, []);

  // Handle ticket updates
  const handleUpdateTicket = (updatedTicket) => {
    setTickets(prev => prev.map(ticket => 
      ticket.id === updatedTicket.id ? updatedTicket : ticket
    ));
  };

  // Handle creating new tickets
  const handleCreateTicket = (newTicket) => {
    setTickets(prev => [...prev, newTicket]);
    setMessage({ type: 'success', text: 'Ticket created successfully' });
  };

  // Mock data for FAQ
  const [faqData] = useState([
    {
      id: 1,
      category: "Getting Started",
      question: "How do I access the admin dashboard?",
      answer: "You can access the admin dashboard by logging in with your admin credentials at /admin. Make sure you have the proper permissions assigned to your account.",
      priority: "high"
    },
    {
      id: 2,
      category: "User Management",
      question: "How do I add a new user?",
      answer: "Navigate to Users section, click 'Add User' button, fill in the required information including name, email, password, and select the appropriate role (Admin, Staff, or Customer).",
      priority: "high"
    },
    {
      id: 3,
      category: "Product Management",
      question: "How do I add a new product?",
      answer: "Go to Products section, click 'Add Product', fill in product details including name, description, price, category, and upload product images. Make sure to set inventory levels.",
      priority: "medium"
    },
    {
      id: 4,
      category: "Order Management",
      question: "How do I update order status?",
      answer: "In the Orders section, find the order you want to update, click on it to view details, then use the status dropdown to change the order status (Pending, Processing, Shipped, Delivered, Cancelled).",
      priority: "high"
    },
    {
      id: 5,
      category: "Reports",
      question: "How do I generate sales reports?",
      answer: "Navigate to Reports section where you can view various reports including sales overview, customer analytics, product performance, and revenue trends. Use date filters to customize the report period.",
      priority: "medium"
    },
    {
      id: 6,
      category: "System",
      question: "How do I backup the system?",
      answer: "System backups are automatically handled by our infrastructure. For manual backups, contact your system administrator. Regular backups are performed daily at 2 AM.",
      priority: "low"
    }
  ]);


  // Mock data for documentation
  const [documentation] = useState([
    {
      id: 1,
      title: "Admin Panel Overview",
      description: "Complete guide to navigating and using the admin panel",
      category: "Getting Started",
      lastUpdated: "2024-01-10",
      views: 156
    },
    {
      id: 2,
      title: "User Management Guide",
      description: "How to manage users, roles, and permissions",
      category: "User Management",
      lastUpdated: "2024-01-08",
      views: 89
    },
    {
      id: 3,
      title: "Product Catalog Management",
      description: "Adding, editing, and organizing products in your catalog",
      category: "Product Management",
      lastUpdated: "2024-01-12",
      views: 203
    },
    {
      id: 4,
      title: "Order Processing Workflow",
      description: "Step-by-step guide to processing and fulfilling orders",
      category: "Order Management",
      lastUpdated: "2024-01-09",
      views: 134
    },
    {
      id: 5,
      title: "Analytics and Reporting",
      description: "Understanding your business metrics and generating reports",
      category: "Analytics",
      lastUpdated: "2024-01-11",
      views: 78
    }
  ]);


  // Filter FAQ based on search query
  const filteredFaq = faqData.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );


  // Toggle FAQ expansion
  const toggleFaq = (id) => {
    setExpandedFaq(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };


  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-700 bg-clip-text text-transparent">
          Help & Support
        </h1>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:scale-105 transition">
            <Phone size={18} /> Contact Support
          </button>
          <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:scale-105 transition">
            <Plus size={18} /> New Ticket
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 
          message.type === 'error' ? 'bg-red-100 text-red-700' : 
          'bg-blue-100 text-blue-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'faq', label: 'FAQ', icon: HelpCircle },
              { id: 'tickets', label: 'Support Tickets', icon: MessageSquare },
              { id: 'docs', label: 'Documentation', icon: BookOpen }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search FAQ..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* FAQ Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {['Getting Started', 'User Management', 'Product Management', 'Order Management', 'Reports', 'System'].map(category => (
              <div key={category} className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition">
                <h3 className="font-semibold text-gray-800 mb-2">{category}</h3>
                <p className="text-sm text-gray-600">
                  {faqData.filter(faq => faq.category === category).length} articles
                </p>
              </div>
            ))}
          </div>

          {/* FAQ List */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Frequently Asked Questions</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {filteredFaq.map(faq => (
                <div key={faq.id} className="p-6">
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          faq.priority === 'high' ? 'bg-red-100 text-red-700' :
                          faq.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {faq.priority}
                        </span>
                        <span className="text-sm text-gray-500">{faq.category}</span>
                      </div>
                      <h3 className="font-semibold text-gray-800">{faq.question}</h3>
                    </div>
                    {expandedFaq[faq.id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>
                  {expandedFaq[faq.id] && (
                    <div className="mt-4 pl-0">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Support Tickets Tab */}
      {activeTab === 'tickets' && (
        <SupportTicketManager 
          tickets={tickets}
          onUpdateTicket={handleUpdateTicket}
          onCreateTicket={handleCreateTicket}
        />
      )}

      {/* Documentation Tab */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Quick Start Guide", icon: FileText, color: "bg-blue-500" },
              { title: "Video Tutorials", icon: ExternalLink, color: "bg-green-500" },
              { title: "API Documentation", icon: BookOpen, color: "bg-purple-500" },
              { title: "System Status", icon: AlertCircle, color: "bg-orange-500" }
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition cursor-pointer">
                <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center mb-4`}>
                  <item.icon className="text-white" size={24} />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">Access comprehensive guides and resources</p>
              </div>
            ))}
          </div>

          {/* Documentation List */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Documentation</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {documentation.map(doc => (
                <div key={doc.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-2">{doc.title}</h3>
                      <p className="text-gray-600 mb-2">{doc.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Tag size={14} /> {doc.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} /> Updated {doc.lastUpdated}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={14} /> {doc.views} views
                        </span>
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      <ExternalLink size={16} /> Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default HelpSupport;
