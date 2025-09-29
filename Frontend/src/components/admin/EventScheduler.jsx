import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  Users, 
  Target, 
  Send, 
  Play, 
  Pause, 
  Square, 
  Edit, 
  Trash2,
  Eye,
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";

const EventScheduler = ({ events, onUpdateEvent, onDeleteEvent, onSendEvent }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month, week, day
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);

  // Get events for selected date
  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      const selectedDateStr = date.toDateString();
      const eventDateStr = eventDate.toDateString();
      return eventDateStr === selectedDateStr;
    });
  };

  // Get events for current month
  const getEventsForMonth = (date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate >= startOfMonth && eventDate <= endOfMonth;
    });
  };

  // Get calendar days for current month
  const getCalendarDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
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

  // Handle event status change
  const handleStatusChange = (eventId, newStatus) => {
    const updatedEvent = events.find(e => e.id === eventId);
    if (updatedEvent) {
      onUpdateEvent({
        ...updatedEvent,
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Handle send event
  const handleSendEvent = (eventId) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      onSendEvent(event);
      handleStatusChange(eventId, 'active');
    }
  };

  // Navigate calendar
  const navigateCalendar = (direction) => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setDate(newDate.getDate() + direction);
    }
    setSelectedDate(newDate);
  };

  // Get month name
  const getMonthName = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Get day name
  const getDayName = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is in current month
  const isCurrentMonth = (date) => {
    return date.getMonth() === selectedDate.getMonth();
  };

  const calendarDays = getCalendarDays(selectedDate);
  const monthEvents = getEventsForMonth(selectedDate);

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Event Scheduler</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg text-sm ${
                viewMode === 'month' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-lg text-sm ${
                viewMode === 'week' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-lg text-sm ${
                viewMode === 'day' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Day
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateCalendar(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            ←
          </button>
          <h3 className="text-lg font-semibold text-gray-800">
            {getMonthName(selectedDate)}
          </h3>
          <button
            onClick={() => navigateCalendar(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonthDay = isCurrentMonth(day);
            const isTodayDate = isToday(day);

            return (
              <div
                key={index}
                className={`min-h-[120px] border-r border-b border-gray-200 p-2 ${
                  isCurrentMonthDay ? 'bg-white' : 'bg-gray-50'
                } ${isTodayDate ? 'bg-yellow-50' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isCurrentMonthDay ? 'text-gray-900' : 'text-gray-400'
                } ${isTodayDate ? 'text-yellow-600' : ''}`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={`p-1 rounded text-xs cursor-pointer hover:opacity-80 transition ${
                        event.priority === 'high' ? 'bg-red-100 text-red-700' :
                        event.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}
                      onClick={() => {
                        setSelectedEvent(event);
                        setModalOpen(true);
                      }}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-xs opacity-75">
                        {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Upcoming Events</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {events
            .filter(event => new Date(event.startDate) >= new Date())
            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
            .slice(0, 10)
            .map(event => (
              <div key={event.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{event.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(event.priority)}`}>
                        {event.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(event.startDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {event.expectedReach} recipients
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {event.status === 'draft' && (
                      <button
                        onClick={() => handleSendEvent(event.id)}
                        className="text-green-600 hover:text-green-700 flex items-center gap-1 text-sm"
                      >
                        <Send size={14} /> Send
                      </button>
                    )}
                    {event.status === 'scheduled' && (
                      <button
                        onClick={() => handleStatusChange(event.id, 'active')}
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                      >
                        <Play size={14} /> Start
                      </button>
                    )}
                    {event.status === 'active' && (
                      <button
                        onClick={() => handleStatusChange(event.id, 'paused')}
                        className="text-yellow-600 hover:text-yellow-700 flex items-center gap-1 text-sm"
                      >
                        <Pause size={14} /> Pause
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                        setModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                    >
                      <Eye size={14} /> View
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{selectedEvent.title}</h2>
                  <p className="text-gray-600">{selectedEvent.description}</p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedEvent.status)}`}>
                    {selectedEvent.status}
                  </span>
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
                <div>
                  <p className="text-sm text-gray-600">Target Audience</p>
                  <p className="font-semibold capitalize">{selectedEvent.targetAudience.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expected Reach</p>
                  <p className="font-semibold">{selectedEvent.expectedReach.toLocaleString()}</p>
                </div>
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
                {selectedEvent.status === 'draft' && (
                  <button
                    onClick={() => handleSendEvent(selectedEvent.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Send Event
                  </button>
                )}
                {selectedEvent.status === 'scheduled' && (
                  <button
                    onClick={() => handleStatusChange(selectedEvent.id, 'active')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Start Event
                  </button>
                )}
                {selectedEvent.status === 'active' && (
                  <button
                    onClick={() => handleStatusChange(selectedEvent.id, 'paused')}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                  >
                    Pause Event
                  </button>
                )}
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventScheduler;
