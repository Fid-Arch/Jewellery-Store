import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/Layout";
import Modal from "../../components/admin/Modal";
import DataTable from "../../components/admin/DataTable";
import { 
  Calendar, 
  Plus, 
  Send, 
  Eye, 
  Edit, 
  Trash2, 
  Users, 
  Target, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Mail,
  Bell,
  Gift,
  Percent,
  DollarSign,
  Filter,
  Search,
  Download,
  Copy,
  Share2,
  Settings,
  Play,
  Pause,
  Square
} from "lucide-react";

const PromotionalEvents = () => {
  const [activeTab, setActiveTab] = useState('events');
  const [isModalOpen, setModalOpen] = useState(false);
  const [isPreviewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    dateRange: ''
  });

  // Event form state
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    type: 'sale',
    discountType: 'percentage',
    discountValue: '',
    startDate: '',
    endDate: '',
    targetAudience: 'all',
    emailTemplate: 'default',
    status: 'draft',
    priority: 'medium',
    budget: '',
    expectedReach: '',
    tags: []
  });

  // Mock data for promotional events
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "Black Friday Sale 2024",
      description: "Massive discounts on all jewelry items for Black Friday",
      type: "sale",
      discountType: "percentage",
      discountValue: 30,
      startDate: "2024-11-24T00:00:00Z",
      endDate: "2024-11-30T23:59:59Z",
      targetAudience: "all",
      status: "scheduled",
      priority: "high",
      budget: 5000,
      expectedReach: 10000,
      sentCount: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      revenue: 0,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
      tags: ["sale", "black-friday", "jewelry"]
    },
    {
      id: 2,
      title: "Valentine's Day Collection",
      description: "Special Valentine's Day jewelry collection launch",
      type: "launch",
      discountType: "fixed",
      discountValue: 50,
      startDate: "2024-02-01T00:00:00Z",
      endDate: "2024-02-14T23:59:59Z",
      targetAudience: "couples",
      status: "active",
      priority: "high",
      budget: 3000,
      expectedReach: 5000,
      sentCount: 2500,
      openRate: 25.5,
      clickRate: 8.2,
      conversionRate: 3.1,
      revenue: 12500,
      createdAt: "2024-01-10T09:00:00Z",
      updatedAt: "2024-01-20T14:30:00Z",
      tags: ["valentine", "romance", "couples"]
    },
    {
      id: 3,
      title: "New Customer Welcome",
      description: "Welcome discount for new customers",
      type: "welcome",
      discountType: "percentage",
      discountValue: 15,
      startDate: "2024-01-01T00:00:00Z",
      endDate: "2024-12-31T23:59:59Z",
      targetAudience: "new_customers",
      status: "active",
      priority: "medium",
      budget: 1000,
      expectedReach: 2000,
      sentCount: 1200,
      openRate: 35.2,
      clickRate: 12.8,
      conversionRate: 5.5,
      revenue: 3200,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-15T16:45:00Z",
      tags: ["welcome", "new-customers", "discount"]
    }
  ]);

  // Mock data for templates
  const [templates] = useState([
    {
      id: 1,
      name: "Sale Announcement",
      type: "sale",
      subject: "🔥 Exclusive Sale - Up to {discount}% Off!",
      preview: "Don't miss out on our biggest sale of the year!",
      isDefault: true
    },
    {
      id: 2,
      name: "Product Launch",
      type: "launch",
      subject: "✨ New Collection: {product_name}",
      preview: "Discover our latest jewelry collection",
      isDefault: false
    },
    {
      id: 3,
      name: "Welcome Series",
      type: "welcome",
      subject: "Welcome to Goldmarks! Here's your {discount}% off",
      preview: "Thank you for joining our luxury jewelry family",
      isDefault: true
    }
  ]);

  // Mock data for analytics
  const [analytics] = useState({
    totalEvents: events.length,
    activeEvents: events.filter(e => e.status === 'active').length,
    scheduledEvents: events.filter(e => e.status === 'scheduled').length,
    totalSent: events.reduce((sum, e) => sum + e.sentCount, 0),
    avgOpenRate: events.reduce((sum, e) => sum + e.openRate, 0) / events.length,
    avgClickRate: events.reduce((sum, e) => sum + e.clickRate, 0) / events.length,
    totalRevenue: events.reduce((sum, e) => sum + e.revenue, 0)
  });

  // Filter events based on search and filters
  const filteredEvents = events.filter(event => {
    const matchesSearch = !searchQuery || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = !filters.status || event.status === filters.status;
    const matchesType = !filters.type || event.type === filters.type;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEventForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle tag input
  const handleTagAdd = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newTag = e.target.value.trim().toLowerCase();
      if (!eventForm.tags.includes(newTag)) {
        setEventForm(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      e.target.value = '';
    }
  };

  // Remove tag
  const removeTag = (tagToRemove) => {
    setEventForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Create new event
  const createEvent = () => {
    if (!eventForm.title.trim() || !eventForm.description.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    const newEvent = {
      id: Date.now(),
      ...eventForm,
      sentCount: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      revenue: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setEvents(prev => [...prev, newEvent]);
    setMessage({ type: 'success', text: 'Event created successfully' });
    setModalOpen(false);
    setEventForm({
      title: '',
      description: '',
      type: 'sale',
      discountType: 'percentage',
      discountValue: '',
      startDate: '',
      endDate: '',
      targetAudience: 'all',
      emailTemplate: 'default',
      status: 'draft',
      priority: 'medium',
      budget: '',
      expectedReach: '',
      tags: []
    });
  };

  // Send event
  const sendEvent = (eventId) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, status: 'active', sentCount: event.sentCount + 1000 }
        : event
    ));
    setMessage({ type: 'success', text: 'Event sent successfully' });
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      scheduled: 'bg-blue-100 text-blue-700',
      active: 'bg-green-100 text-green-700',
      paused: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-purple-100 text-purple-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || colors.draft;
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700'
    };
    return colors[priority] || colors.medium;
  };

  // Get type icon
  const getTypeIcon = (type) => {
    const icons = {
      sale: Percent,
      launch: Gift,
      welcome: Bell,
      newsletter: Mail,
      reminder: Clock
    };
    return icons[type] || Gift;
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
          Promotional Events
        </h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-700 text-white px-4 py-2 rounded-lg shadow hover:scale-105 transition"
        >
          <Plus size={18} /> Create Event
        </button>
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

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalEvents}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Events</p>
              <p className="text-2xl font-bold text-green-600">{analytics.activeEvents}</p>
            </div>
            <Play className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sent</p>
              <p className="text-2xl font-bold text-blue-600">{analytics.totalSent.toLocaleString()}</p>
            </div>
            <Send className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">${analytics.totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'events', label: 'Events', icon: Calendar },
              { id: 'templates', label: 'Templates', icon: Mail },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 }
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

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Search className="inline w-4 h-4 mr-1" />
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search events..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                >
                  <option value="">All Types</option>
                  <option value="sale">Sale</option>
                  <option value="launch">Launch</option>
                  <option value="welcome">Welcome</option>
                  <option value="newsletter">Newsletter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  value={filters.dateRange}
                  onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>
          </div>

          {/* Events Table */}
          <DataTable
            columns={[
              { 
                header: "Event", 
                accessor: "title",
                cell: ({ row }) => {
                  if (!row) return <div className="text-gray-500">N/A</div>;
                  const TypeIcon = getTypeIcon(row.type);
                  return (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <TypeIcon size={16} className="text-yellow-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{row.title || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{row.type || 'N/A'}</div>
                      </div>
                    </div>
                  );
                }
              },
              { 
                header: "Discount", 
                accessor: "discount",
                cell: ({ row }) => {
                  if (!row) return <div className="text-gray-500">N/A</div>;
                  return (
                    <div className="text-center">
                      <div className="font-semibold text-green-600">
                        {row.discountType === 'percentage' ? `${row.discountValue}%` : `$${row.discountValue}`}
                      </div>
                      <div className="text-xs text-gray-500">{row.discountType}</div>
                    </div>
                  );
                }
              },
              { 
                header: "Status", 
                accessor: "status",
                cell: ({ row }) => {
                  if (!row) return <div className="text-gray-500">N/A</div>;
                  return (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(row.status)}`}>
                      {row.status}
                    </span>
                  );
                }
              },
              { 
                header: "Priority", 
                accessor: "priority",
                cell: ({ row }) => {
                  if (!row) return <div className="text-gray-500">N/A</div>;
                  return (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(row.priority)}`}>
                      {row.priority}
                    </span>
                  );
                }
              },
              { 
                header: "Performance", 
                accessor: "performance",
                cell: ({ row }) => {
                  if (!row) return <div className="text-gray-500">N/A</div>;
                  return (
                    <div className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600">{row.openRate?.toFixed(1) || '0.0'}%</span>
                        <span className="text-gray-400">|</span>
                        <span className="text-green-600">{row.clickRate?.toFixed(1) || '0.0'}%</span>
                      </div>
                      <div className="text-xs text-gray-500">{row.sentCount?.toLocaleString() || '0'} sent</div>
                    </div>
                  );
                }
              },
              { 
                header: "Revenue", 
                accessor: "revenue",
                cell: ({ row }) => {
                  if (!row) return <div className="text-gray-500">N/A</div>;
                  return (
                    <div className="text-right">
                      <div className="font-semibold text-green-600">${row.revenue?.toLocaleString() || '0'}</div>
                      <div className="text-xs text-gray-500">{row.conversionRate?.toFixed(1) || '0.0'}% conversion</div>
                    </div>
                  );
                }
              },
              {
                header: "Actions",
                accessor: "actions",
                cell: ({ row }) => {
                  if (!row) return <div className="text-gray-500">N/A</div>;
                  return (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedEvent(row);
                          setPreviewModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                      >
                        <Eye size={14} /> View
                      </button>
                      {row.status === 'draft' && (
                        <button
                          onClick={() => sendEvent(row.id)}
                          className="text-green-600 hover:text-green-700 flex items-center gap-1 text-sm"
                        >
                          <Send size={14} /> Send
                        </button>
                      )}
                      <button className="text-yellow-600 hover:text-yellow-700 flex items-center gap-1 text-sm">
                        <Edit size={14} /> Edit
                      </button>
                    </div>
                  );
                }
              }
            ]}
            data={filteredEvents}
          />
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => (
              <div key={template.id} className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">{template.name}</h3>
                  {template.isDefault && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Default</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">{template.preview}</p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-yellow-600 text-white px-3 py-2 rounded-lg hover:bg-yellow-700 transition text-sm">
                    Use Template
                  </button>
                  <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm">
                    Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Open Rate</span>
                  <span className="font-semibold text-blue-600">{analytics.avgOpenRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Click Rate</span>
                  <span className="font-semibold text-green-600">{analytics.avgClickRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="font-semibold text-green-600">${analytics.totalRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Event Status</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Events</span>
                  <span className="font-semibold text-green-600">{analytics.activeEvents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Scheduled Events</span>
                  <span className="font-semibold text-blue-600">{analytics.scheduledEvents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Events</span>
                  <span className="font-semibold text-gray-900">{analytics.totalEvents}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Promotional Event"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                name="title"
                value={eventForm.title}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="e.g., Black Friday Sale"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Type
              </label>
              <select
                name="type"
                value={eventForm.type}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="sale">Sale</option>
                <option value="launch">Product Launch</option>
                <option value="welcome">Welcome Series</option>
                <option value="newsletter">Newsletter</option>
                <option value="reminder">Reminder</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={eventForm.description}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              rows="3"
              placeholder="Describe your promotional event..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Type
              </label>
              <select
                name="discountType"
                value={eventForm.discountType}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Value
              </label>
              <input
                type="number"
                name="discountValue"
                value={eventForm.discountValue}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="e.g., 20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={eventForm.priority}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="datetime-local"
                name="startDate"
                value={eventForm.startDate}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="datetime-local"
                name="endDate"
                value={eventForm.endDate}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Audience
              </label>
              <select
                name="targetAudience"
                value={eventForm.targetAudience}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="all">All Customers</option>
                <option value="new_customers">New Customers</option>
                <option value="returning">Returning Customers</option>
                <option value="vip">VIP Customers</option>
                <option value="inactive">Inactive Customers</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Template
              </label>
              <select
                name="emailTemplate"
                value={eventForm.emailTemplate}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="default">Default Template</option>
                <option value="sale">Sale Template</option>
                <option value="launch">Launch Template</option>
                <option value="welcome">Welcome Template</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget ($)
              </label>
              <input
                type="number"
                name="budget"
                value={eventForm.budget}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="e.g., 1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Reach
              </label>
              <input
                type="number"
                name="expectedReach"
                value={eventForm.expectedReach}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="e.g., 5000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {eventForm.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-yellow-600 hover:text-yellow-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add tags (press Enter to add)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              onKeyPress={handleTagAdd}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={createEvent}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
            >
              Create Event
            </button>
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Event Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={`Event Preview - ${selectedEvent?.title}`}
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Event Type</p>
                <p className="font-semibold capitalize">{selectedEvent.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedEvent.status)}`}>
                  {selectedEvent.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Discount</p>
                <p className="font-semibold text-green-600">
                  {selectedEvent.discountType === 'percentage' ? `${selectedEvent.discountValue}%` : `$${selectedEvent.discountValue}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Priority</p>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(selectedEvent.priority)}`}>
                  {selectedEvent.priority}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Start Date</p>
                <p className="font-semibold">{new Date(selectedEvent.startDate).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">End Date</p>
                <p className="font-semibold">{new Date(selectedEvent.endDate).toLocaleString()}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Description</p>
              <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{selectedEvent.description}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Performance</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Sent:</span>
                  <span className="font-semibold ml-2">{selectedEvent.sentCount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Open Rate:</span>
                  <span className="font-semibold ml-2 text-blue-600">{selectedEvent.openRate.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Click Rate:</span>
                  <span className="font-semibold ml-2 text-green-600">{selectedEvent.clickRate.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Revenue:</span>
                  <span className="font-semibold ml-2 text-green-600">${selectedEvent.revenue.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Send Now
              </button>
              <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition">
                Edit Event
              </button>
              <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
};

export default PromotionalEvents;
