import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, setHours, setMinutes } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import { API, AuthContext } from '../../App';
import Navbar from '../../components/Navbar';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent } from '../../components/ui/dialog';
import { 
  Calendar, Plus, Clock, Users, Repeat, 
  X, CheckCircle2, Edit, Trash2, Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '../../utils/errorHandler';

const locales = {
  'en-US': require('date-fns/locale/en-US')
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const SessionScheduler = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [showEditSession, setShowEditSession] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  
  // Calendar navigation state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');
  
  // Bulk add state
  const [bulkData, setBulkData] = useState({
    listing_id: '',
    start_date: '',
    end_date: '',
    days: [], // ['monday', 'wednesday', 'friday']
    time_slots: [{ time: '10:00', seats: 10 }],
    duration_minutes: 60,
    price_override: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('yuno_token');
      
      // Fetch listings
      const listingsRes = await axios.get(`${API}/partners/my/listings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setListings(listingsRes.data.listings || []);
      
      // Fetch sessions
      const sessionsRes = await axios.get(`${API}/sessions/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(sessionsRes.data.sessions || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(getErrorMessage(error, 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAdd = async () => {
    // Detailed validation
    if (!bulkData.listing_id) {
      toast.error('Please select a listing');
      return;
    }
    
    if (!bulkData.start_date) {
      toast.error('Please select a start date');
      return;
    }
    
    if (!bulkData.end_date) {
      toast.error('Please select an end date');
      return;
    }
    
    if (bulkData.days.length === 0) {
      toast.error('Please select at least one day');
      return;
    }
    
    if (bulkData.time_slots.length === 0) {
      toast.error('Please add at least one time slot');
      return;
    }
    
    // Validate each time slot has time and seats
    for (let i = 0; i < bulkData.time_slots.length; i++) {
      const slot = bulkData.time_slots[i];
      if (!slot.time) {
        toast.error(`Please set time for slot ${i + 1}`);
        return;
      }
      if (!slot.seats || parseInt(slot.seats) <= 0) {
        toast.error(`Please set valid seats for slot ${i + 1}`);
        return;
      }
    }

    try {
      const token = localStorage.getItem('yuno_token');
      
      // Prepare payload with proper data types
      const payload = {
        listing_id: bulkData.listing_id,
        start_date: bulkData.start_date,
        end_date: bulkData.end_date,
        days: bulkData.days,
        duration_minutes: parseInt(bulkData.duration_minutes) || 60,
        time_slots: bulkData.time_slots.map(slot => ({
          time: slot.time,
          seats: parseInt(slot.seats, 10) || 10
        }))
      };
      
      await axios.post(
        `${API}/sessions/bulk-create`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Sessions created successfully!');
      setShowBulkAdd(false);
      fetchData();
      
      // Reset form
      setBulkData({
        listing_id: '',
        start_date: '',
        end_date: '',
        days: [],
        time_slots: [{ time: '10:00', seats: 10 }],
        duration_minutes: 60,
        price_override: ''
      });
    } catch (error) {
      console.error('Bulk add error:', error);
      toast.error(getErrorMessage(error, 'Failed to create sessions'));
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    
    try {
      const token = localStorage.getItem('yuno_token');
      await axios.delete(`${API}/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Session deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete session');
    }
  };

  const addTimeSlot = () => {
    setBulkData({
      ...bulkData,
      time_slots: [...bulkData.time_slots, { time: '10:00', seats: 10 }]
    });
  };

  const removeTimeSlot = (index) => {
    if (bulkData.time_slots.length > 1) {
      setBulkData({
        ...bulkData,
        time_slots: bulkData.time_slots.filter((_, i) => i !== index)
      });
    }
  };

  const updateTimeSlot = (index, field, value) => {
    const updated = [...bulkData.time_slots];
    updated[index][field] = value;
    setBulkData({ ...bulkData, time_slots: updated });
  };

  const toggleDay = (day) => {
    setBulkData({
      ...bulkData,
      days: bulkData.days.includes(day)
        ? bulkData.days.filter(d => d !== day)
        : [...bulkData.days, day]
    });
  };

  // Transform sessions for calendar
  const calendarEvents = sessions.map(session => {
    const listing = listings.find(l => l.id === session.listing_id);
    return {
      id: session.id,
      title: listing ? `${listing.title} (${session.seats_total - session.seats_reserved}/${session.seats_total} seats)` : 'Session',
      start: new Date(session.start_at),
      end: session.end_at ? new Date(session.end_at) : new Date(new Date(session.start_at).getTime() + 60 * 60000), // Use end_at if available, else default 60 min
      resource: session
    };
  });

  const eventStyleGetter = (event) => {
    const seatsAvailable = event.resource.seats_total - event.resource.seats_reserved;
    const percentFull = (event.resource.seats_reserved / event.resource.seats_total) * 100;
    
    let backgroundColor = '#6EE7B7'; // Green for available
    if (percentFull >= 90) backgroundColor = '#EF4444'; // Red for almost full
    else if (percentFull >= 50) backgroundColor = '#FBBF24'; // Yellow for half full
    
    return {
      style: {
        backgroundColor,
        borderRadius: '8px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        fontFamily: 'Outfit, sans-serif',
        fontSize: '0.875rem',
        padding: '4px 8px'
      }
    };
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%)' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '4rem' }}>Loading sessions...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%)' }}>
      <Navbar />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: '#1E293B',
              fontFamily: 'Outfit, sans-serif',
              marginBottom: '0.5rem'
            }}>
              Session Scheduler
            </h1>
            <p style={{
              fontSize: '1.1rem',
              color: '#64748B',
              fontFamily: 'Outfit, sans-serif'
            }}>
              Schedule and manage your class sessions
            </p>
          </div>
          <button
            onClick={() => setShowBulkAdd(true)}
            className="btn-scale"
            style={{
              background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
              color: 'white',
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '16px',
              fontFamily: 'Outfit, sans-serif',
              border: 'none',
              boxShadow: '0 4px 12px rgba(110, 231, 183, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Repeat size={20} />
            Bulk Add Sessions
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
              Total Sessions
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1E293B', fontFamily: 'Outfit, sans-serif' }}>
              {sessions.length}
            </div>
          </div>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
              Upcoming
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3B82F6', fontFamily: 'Outfit, sans-serif' }}>
              {sessions.filter(s => new Date(s.start_at) > new Date()).length}
            </div>
          </div>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
              Seats Reserved
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10B981', fontFamily: 'Outfit, sans-serif' }}>
              {sessions.reduce((sum, s) => sum + s.seats_reserved, 0)}
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          height: '700px'
        }}>
          <BigCalendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%', fontFamily: 'Outfit, sans-serif' }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={(event) => {
              setSelectedSession(event.resource);
              setShowEditSession(true);
            }}
            date={currentDate}
            onNavigate={(date) => setCurrentDate(date)}
            view={currentView}
            onView={(view) => setCurrentView(view)}
            views={['month', 'week', 'day', 'agenda']}
            popup={true}
            selectable={true}
          />
        </div>

        {/* Bulk Add Modal */}
        <AnimatePresence>
          {showBulkAdd && (
            <Dialog open={showBulkAdd} onOpenChange={setShowBulkAdd}>
              <DialogContent 
                style={{
                  maxWidth: '700px',
                  backgroundColor: 'white',
                  borderRadius: '24px',
                  padding: '2.5rem',
                  maxHeight: '90vh',
                  overflowY: 'auto'
                }}
              >
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h2 style={{
                        fontSize: '1.75rem',
                        fontWeight: '700',
                        color: '#1E293B',
                        fontFamily: 'Outfit, sans-serif'
                      }}>
                        Bulk Add Sessions
                      </h2>
                      <p style={{
                        fontSize: '0.95rem',
                        color: '#64748B',
                        fontFamily: 'Outfit, sans-serif'
                      }}>
                        Create multiple sessions at once
                      </p>
                    </div>
                    <button
                      onClick={() => setShowBulkAdd(false)}
                      style={{
                        background: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '8px'
                      }}
                    >
                      <X size={24} color="#64748B" />
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <Label style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>
                    Select Listing <span style={{ color: '#EF4444' }}>*</span>
                  </Label>
                  <select
                    value={bulkData.listing_id}
                    onChange={(e) => {
                      const listing = listings.find(l => l.id === e.target.value);
                      setBulkData({ 
                        ...bulkData, 
                        listing_id: e.target.value,
                        duration_minutes: listing?.duration_minutes || 60
                      });
                    }}
                    style={{
                      width: '100%',
                      marginTop: '0.5rem',
                      fontFamily: 'Outfit, sans-serif',
                      borderRadius: '12px',
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0'
                    }}
                  >
                    <option value="">Choose a listing</option>
                    {listings.map(listing => (
                      <option key={listing.id} value={listing.id}>
                        {listing.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <Label style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>
                      Start Date <span style={{ color: '#EF4444' }}>*</span>
                    </Label>
                    <Input
                      type="date"
                      value={bulkData.start_date}
                      onChange={(e) => setBulkData({ ...bulkData, start_date: e.target.value })}
                      style={{
                        marginTop: '0.5rem',
                        fontFamily: 'Outfit, sans-serif',
                        borderRadius: '12px'
                      }}
                    />
                  </div>
                  <div>
                    <Label style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>
                      End Date <span style={{ color: '#EF4444' }}>*</span>
                    </Label>
                    <Input
                      type="date"
                      value={bulkData.end_date}
                      onChange={(e) => setBulkData({ ...bulkData, end_date: e.target.value })}
                      style={{
                        marginTop: '0.5rem',
                        fontFamily: 'Outfit, sans-serif',
                        borderRadius: '12px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <Label style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '600', marginBottom: '0.75rem', display: 'block' }}>
                    Select Days <span style={{ color: '#EF4444' }}>*</span>
                  </Label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '10px',
                          border: bulkData.days.includes(day) ? 'none' : '2px solid #e2e8f0',
                          background: bulkData.days.includes(day) ? 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)' : 'white',
                          color: bulkData.days.includes(day) ? 'white' : '#64748B',
                          fontWeight: '600',
                          fontSize: '14px',
                          fontFamily: 'Outfit, sans-serif',
                          cursor: 'pointer',
                          textTransform: 'capitalize'
                        }}
                      >
                        {day.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <Label style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>
                      Time Slots <span style={{ color: '#EF4444' }}>*</span>
                    </Label>
                    <button
                      onClick={addTimeSlot}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        background: 'white',
                        color: '#3B82F6',
                        border: '2px solid #3B82F6',
                        fontWeight: '600',
                        fontSize: '14px',
                        fontFamily: 'Outfit, sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Plus size={16} />
                      Add Slot
                    </button>
                  </div>
                  {bulkData.time_slots.map((slot, index) => (
                    <div key={index} style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr auto',
                      gap: '0.75rem',
                      marginBottom: '0.75rem'
                    }}>
                      <Input
                        type="time"
                        value={slot.time}
                        onChange={(e) => updateTimeSlot(index, 'time', e.target.value)}
                        style={{
                          fontFamily: 'Outfit, sans-serif',
                          borderRadius: '10px'
                        }}
                      />
                      <Input
                        type="number"
                        value={slot.seats}
                        onChange={(e) => updateTimeSlot(index, 'seats', e.target.value)}
                        placeholder="Seats"
                        style={{
                          fontFamily: 'Outfit, sans-serif',
                          borderRadius: '10px'
                        }}
                      />
                      {bulkData.time_slots.length > 1 && (
                        <button
                          onClick={() => removeTimeSlot(index)}
                          style={{
                            background: '#FEE2E2',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.5rem',
                            cursor: 'pointer'
                          }}
                        >
                          <X size={20} color="#EF4444" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '2px solid #f1f5f9' }}>
                  <button
                    onClick={() => setShowBulkAdd(false)}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      borderRadius: '12px',
                      background: 'white',
                      color: '#64748B',
                      border: '2px solid #e2e8f0',
                      fontWeight: '600',
                      fontSize: '16px',
                      fontFamily: 'Outfit, sans-serif'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkAdd}
                    className="btn-scale"
                    style={{
                      flex: 2,
                      padding: '1rem',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '16px',
                      fontFamily: 'Outfit, sans-serif',
                      border: 'none'
                    }}
                  >
                    Create Sessions
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>

        {/* Edit Session Modal */}
        <AnimatePresence>
          {showEditSession && selectedSession && (
            <Dialog open={showEditSession} onOpenChange={setShowEditSession}>
              <DialogContent 
                style={{
                  maxWidth: '500px',
                  backgroundColor: 'white',
                  borderRadius: '24px',
                  padding: '2rem'
                }}
              >
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#1E293B',
                    marginBottom: '1rem',
                    fontFamily: 'Outfit, sans-serif'
                  }}>
                    Session Details
                  </h3>
                  <div style={{
                    background: '#F9FAFB',
                    padding: '1rem',
                    borderRadius: '12px',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '0.5rem' }}>
                      {format(new Date(selectedSession.start_at), 'EEEE, MMMM dd, yyyy')}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1E293B', marginBottom: '0.5rem' }}>
                      {format(new Date(selectedSession.start_at), 'h:mm a')}
                    </div>
                    <div style={{ fontSize: '0.95rem', color: '#64748B' }}>
                      Seats: {selectedSession.seats_reserved} / {selectedSession.seats_total}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => setShowEditSession(false)}
                    style={{
                      flex: 1,
                      padding: '0.875rem',
                      borderRadius: '10px',
                      background: 'white',
                      color: '#64748B',
                      border: '2px solid #e2e8f0',
                      fontWeight: '600',
                      fontSize: '15px',
                      fontFamily: 'Outfit, sans-serif'
                    }}
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteSession(selectedSession.id);
                      setShowEditSession(false);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.875rem',
                      borderRadius: '10px',
                      background: '#FEE2E2',
                      color: '#EF4444',
                      border: 'none',
                      fontWeight: '600',
                      fontSize: '15px',
                      fontFamily: 'Outfit, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SessionScheduler;
