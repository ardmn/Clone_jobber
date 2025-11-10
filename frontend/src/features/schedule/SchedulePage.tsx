import { useState } from 'react';
import { Box, Typography, Card, ButtonGroup, Button as MuiButton } from '@mui/material';
import { Add as AddIcon, Today as TodayIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Button, LoadingSpinner } from '../../components/common';
import { QUERY_KEYS } from '../../config/constants';
import axiosInstance from '../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../config/api';
import toast from 'react-hot-toast';
import type { ScheduleEvent } from '../../types';

// Calendar view with FullCalendar (placeholder for now with simple implementation)
export const SchedulePage = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: events, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.SCHEDULE, currentDate.toISOString()],
    queryFn: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.SCHEDULE, {
        params: {
          start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString(),
          end: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString(),
        },
      });
      return response.data.data || response.data;
    },
  });

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const formatDateHeader = () => {
    const options: Intl.DateTimeFormatOptions =
      view === 'day'
        ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        : view === 'week'
        ? { month: 'long', year: 'numeric' }
        : { month: 'long', year: 'numeric' };
    return currentDate.toLocaleDateString('en-US', options);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading schedule..." />;
  }

  const scheduleEvents: ScheduleEvent[] = events || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Schedule
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate({ to: '/schedule/new' })}
        >
          Add Event
        </Button>
      </Box>

      <Card sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <MuiButton onClick={handlePrevious}>&lt;</MuiButton>
            <Typography variant="h6">{formatDateHeader()}</Typography>
            <MuiButton onClick={handleNext}>&gt;</MuiButton>
            <MuiButton startIcon={<TodayIcon />} onClick={handleToday} variant="outlined">
              Today
            </MuiButton>
          </Box>
          <ButtonGroup>
            <MuiButton
              variant={view === 'day' ? 'contained' : 'outlined'}
              onClick={() => setView('day')}
            >
              Day
            </MuiButton>
            <MuiButton
              variant={view === 'week' ? 'contained' : 'outlined'}
              onClick={() => setView('week')}
            >
              Week
            </MuiButton>
            <MuiButton
              variant={view === 'month' ? 'contained' : 'outlined'}
              onClick={() => setView('month')}
            >
              Month
            </MuiButton>
          </ButtonGroup>
        </Box>

        <Box sx={{ minHeight: 600, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
          {scheduleEvents.length === 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="body1" color="text.secondary">
                No events scheduled for this period
              </Typography>
            </Box>
          ) : (
            <Box>
              {scheduleEvents.map((event) => (
                <Card
                  key={event.id}
                  sx={{
                    p: 2,
                    mb: 2,
                    borderLeft: 4,
                    borderLeftColor: event.backgroundColor || 'primary.main',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => {
                    if (event.type === 'job' && event.jobId) {
                      navigate({ to: `/jobs/${event.jobId}` });
                    }
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {event.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(event.start).toLocaleString()} - {new Date(event.end).toLocaleString()}
                  </Typography>
                  {event.notes && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {event.notes}
                    </Typography>
                  )}
                </Card>
              ))}
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );
};
