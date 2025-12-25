import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Users } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore, startOfDay } from 'date-fns';

const ImprovedSessionSelector = ({ 
  sessions = [], 
  selectedSessions = [], 
  onSessionSelect, 
  maxSelections = 1 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    const grouped = {};
    sessions.forEach(session => {
      try {
        const date = session.start_at ? new Date(session.start_at) : null;
        if (!date) return;
        
        const dateKey = format(date, 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push({
          ...session,
          dateObj: date
        });
      } catch (err) {
        console.error('Error parsing session date:', err);
      }
    });
    
    // Sort sessions within each date by time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => a.dateObj - b.dateObj);
    });
    
    return grouped;
  }, [sessions]);

  // Get dates with sessions for current month
  const datesWithSessions = useMemo(() => {
    return Object.keys(sessionsByDate).filter(dateKey => {
      const date = parseISO(dateKey);
      return isSameMonth(date, currentMonth) && !isBefore(date, startOfDay(new Date()));
    });
  }, [sessionsByDate, currentMonth]);

  // Calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handleDateClick = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    if (sessionsByDate[dateKey]) {
      setSelectedDate(dateKey);
    }
  };

  const handleSessionClick = (session) => {
    onSessionSelect(session);
  };

  const isSessionSelected = (session) => {
    return selectedSessions.some(s => s.id === session.id);
  };

  const canSelectMore = selectedSessions.length < maxSelections;

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '16px', 
      padding: '1.5rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
            <Calendar size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Select Your Sessions
          </h3>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: '600',
            color: selectedSessions.length === maxSelections ? '#10b981' : '#6366f1',
            background: selectedSessions.length === maxSelections ? '#d1fae5' : '#e0e7ff',
            padding: '0.25rem 0.75rem',
            borderRadius: '20px'
          }}>
            {selectedSessions.length} / {maxSelections} selected
          </div>
        </div>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
          Choose {maxSelections} session{maxSelections > 1 ? 's' : ''} from the available dates below
        </p>
      </div>

      {/* Month Navigation */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem',
        padding: '0.75rem',
        background: '#f8fafc',
        borderRadius: '12px'
      }}>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
          style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            color: '#475569'
          }}
        >
          ← Previous
        </button>
        <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
          {format(currentMonth, 'MMMM yyyy')}
        </div>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
          style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            color: '#475569'
          }}
        >
          Next →
        </button>
      </div>

      {/* Mini Calendar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.5rem',
        marginBottom: '1.5rem'
      }}>
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} style={{ 
            textAlign: 'center', 
            fontSize: '12px', 
            fontWeight: '600', 
            color: '#94a3b8',
            padding: '0.5rem 0'
          }}>
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map(date => {
          const dateKey = format(date, 'yyyy-MM-dd');
          const hasSessions = sessionsByDate[dateKey];
          const isSelected = selectedDate === dateKey;
          const isPast = isBefore(date, startOfDay(new Date()));
          const isCurrentDay = isToday(date);

          return (
            <div
              key={dateKey}
              onClick={() => !isPast && hasSessions && handleDateClick(date)}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: isCurrentDay ? '700' : '500',
                cursor: hasSessions && !isPast ? 'pointer' : 'default',
                background: isSelected ? '#6366f1' : hasSessions ? '#e0e7ff' : 'transparent',
                color: isSelected ? 'white' : isPast ? '#cbd5e1' : hasSessions ? '#6366f1' : '#94a3b8',
                border: isCurrentDay && !isSelected ? '2px solid #6366f1' : '1px solid transparent',
                transition: 'all 0.15s',
                position: 'relative'
              }}
            >
              {format(date, 'd')}
              {hasSessions && !isSelected && (
                <div style={{
                  position: 'absolute',
                  bottom: '4px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: '#6366f1'
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Time Slots */}
      {selectedDate && sessionsByDate[selectedDate] ? (
        <div>
          <div style={{ 
            fontSize: '15px', 
            fontWeight: '700', 
            color: '#1e293b', 
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '2px solid #e2e8f0'
          }}>
            <Clock size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
            {format(parseISO(selectedDate), 'EEEE, MMMM d')}
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '0.75rem',
            maxHeight: '300px',
            overflowY: 'auto',
            paddingRight: '0.5rem'
          }}>
            {sessionsByDate[selectedDate].map(session => {
              const selected = isSessionSelected(session);
              const selectionIndex = selectedSessions.findIndex(s => s.id === session.id);
              
              return (
                <div
                  key={session.id}
                  onClick={() => (selected || canSelectMore) && handleSessionClick(session)}
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    border: selected ? '2px solid #10b981' : '2px solid #e2e8f0',
                    background: selected ? '#d1fae5' : 'white',
                    cursor: selected || canSelectMore ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s',
                    opacity: !selected && !canSelectMore ? 0.5 : 1,
                    position: 'relative'
                  }}
                >
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '700', 
                    color: selected ? '#059669' : '#1e293b',
                    marginBottom: '0.25rem'
                  }}>
                    {format(session.dateObj, 'h:mm a')}
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <Users size={14} />
                      {session.seats_available} seats
                    </div>
                    {selected && (
                      <div style={{
                        background: '#10b981',
                        color: 'white',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}>
                        {selectionIndex + 1}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '14px',
          background: '#f8fafc',
          borderRadius: '12px'
        }}>
          {sessions.length === 0 ? (
            <>
              <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <div>No sessions available</div>
            </>
          ) : (
            <>
              <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <div>Select a date from the calendar above to view available time slots</div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ImprovedSessionSelector;
