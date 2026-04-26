import { getAccessToken } from './authService';

export const createCalendarEvent = async (title: string, description: string, datetime: string) => {
  const token = getAccessToken();
  if (!token) {
    console.warn('No access token available for Calendar integration. User may need to re-authenticate.');
    return;
  }

  const start = new Date(datetime);
  const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 mins duration

  const event = {
    summary: title,
    description: description,
    start: {
      dateTime: start.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    reminders: {
      useDefault: true,
    },
  };

  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Calendar API Error:', error);
    } else {
      console.log('Calendar event created successfully');
    }
  } catch (error) {
    console.error('Failed to create calendar event:', error);
  }
};
