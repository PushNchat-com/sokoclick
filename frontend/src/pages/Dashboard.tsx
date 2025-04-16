import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from '../utils/dayjs';
import { formatDate, formatDateWithTime } from '../utils/dayjs';
import { isPast, isFuture, addTime } from '../utils/timeUtils';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import DateDisplay from '../components/common/DateDisplay';
import Countdown from '../components/common/Countdown';

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
}

const Dashboard = () => {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      title: 'Upcoming Meeting',
      date: dayjs().add(2, 'day').toISOString(),
      description: 'Team meeting to discuss project progress'
    },
    {
      id: '2',
      title: 'Deadline',
      date: dayjs().add(5, 'day').toISOString(),
      description: 'Project submission deadline'
    },
    {
      id: '3',
      title: 'Past Event',
      date: dayjs().subtract(3, 'day').toISOString(),
      description: 'This event already happened'
    }
  ]);

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const handleAddEvent = () => {
    const newEvent: Event = {
      id: `${events.length + 1}`,
      title: 'New Event',
      date: dayjs().add(1, 'day').toISOString(),
      description: 'Description for the new event'
    };
    
    setEvents([...events, newEvent]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t('dashboard')}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Current time card */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">{t('currentTime')}</h2>
            <div className="text-3xl font-medium">
              {formatDateWithTime(currentTime)}
            </div>
            <div className="mt-2 text-gray-600">
              {dayjs(currentTime).format('dddd, MMMM D, YYYY')}
            </div>
          </div>
          
          {/* Time utilities card */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">{t('timeOperations')}</h2>
            <div className="space-y-2">
              <div>
                <span className="font-medium">{t('tomorrow')}: </span>
                <DateDisplay date={addTime(currentTime, 1, 'day')} />
              </div>
              <div>
                <span className="font-medium">{t('nextWeek')}: </span>
                <DateDisplay date={addTime(currentTime, 1, 'week')} />
              </div>
              <div>
                <span className="font-medium">{t('nextMonth')}: </span>
                <DateDisplay date={addTime(currentTime, 1, 'month')} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Events section */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">{t('events')}</h2>
            <button 
              onClick={handleAddEvent}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              {t('addEvent')}
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y">
              {events.map(event => (
                <div key={event.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{event.title}</h3>
                      <p className="text-gray-600">{event.description}</p>
                    </div>
                    <div className="text-right">
                      <DateDisplay date={event.date} format="date" />
                      {isPast(event.date) ? (
                        <span className="inline-block px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded">
                          {t('past')}
                        </span>
                      ) : (
                        <div>
                          <Countdown 
                            targetDate={event.date}
                            className="text-sm font-medium text-primary-600"
                            showSeconds={false}
                            longFormat={true}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Date formats section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">{t('dateFormats')}</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">{t('standardFormats')}</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-600">{t('default')}: </span>
                    <DateDisplay date={currentTime} format="date" />
                  </div>
                  <div>
                    <span className="text-gray-600">{t('withTime')}: </span>
                    <DateDisplay date={currentTime} format="datetime" />
                  </div>
                  <div>
                    <span className="text-gray-600">{t('relative')}: </span>
                    <DateDisplay date={currentTime} format="relative" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">{t('customFormats')}</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-600">YYYY-MM-DD: </span>
                    <DateDisplay date={currentTime} format="custom" customFormat="YYYY-MM-DD" />
                  </div>
                  <div>
                    <span className="text-gray-600">DD/MM/YYYY: </span>
                    <DateDisplay date={currentTime} format="custom" customFormat="DD/MM/YYYY" />
                  </div>
                  <div>
                    <span className="text-gray-600">ddd, MMM D: </span>
                    <DateDisplay date={currentTime} format="custom" customFormat="ddd, MMM D" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard; 