import { Bell, BellOff, MapPin, Sun, Sunrise, Wind, Moon, Settings, Download, Compass, Info, LayoutDashboard, Calendar, Clock, RefreshCcw, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useMemo } from 'react';

// --- Types ---
interface Timings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface Prayer {
  id: string;
  name: string;
  time: string; // HH:mm
  icon: typeof Sun;
}

export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timings, setTimings] = useState<Timings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('May');
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    Fajr: false,
    Dhuhr: true,
    Asr: true,
    Maghrib: true,
    Isha: false
  });

  // Fetch Prayer Times for Riyadh (Umm Al-Qura)
  const fetchTimings = async () => {
    try {
      setLoading(true);
      const res = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Riyadh&country=Saudi+Arabia&method=4');
      const data = await res.json();
      if (data.code === 200) {
        setTimings(data.data.timings);
        setError(null);
      } else {
        throw new Error('API Error');
      }
    } catch (err) {
      setError('Sync failed. Using estimated times.');
      setTimings({
        Fajr: '03:52',
        Sunrise: '05:15',
        Dhuhr: '11:51',
        Asr: '15:21',
        Maghrib: '18:27',
        Isha: '19:57'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimings();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Riyadh Time (GMT+3)
  const riyadhTime = useMemo(() => {
    return new Date(currentTime.toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }));
  }, [currentTime]);

  const prayerItems: Prayer[] = useMemo(() => {
    if (!timings) return [];
    return [
      { id: 'Fajr', name: 'Fajr', time: timings.Fajr, icon: Sunrise },
      { id: 'Dhuhr', name: 'Dhuhr', time: timings.Dhuhr, icon: Sun },
      { id: 'Asr', name: 'Asr', time: timings.Asr, icon: Wind },
      { id: 'Maghrib', name: 'Maghrib', time: timings.Maghrib, icon: Sunrise },
      { id: 'Isha', name: 'Isha', time: timings.Isha, icon: Moon },
    ];
  }, [timings]);

  const nextPrayerData = useMemo(() => {
    if (prayerItems.length === 0) return null;

    for (let i = 0; i < prayerItems.length; i++) {
      const [h, m] = prayerItems[i].time.split(':').map(Number);
      const pDate = new Date(riyadhTime);
      pDate.setHours(h, m, 0, 0);
      if (pDate > riyadhTime) {
        const current = i > 0 ? prayerItems[i - 1] : prayerItems[prayerItems.length - 1];
        return { next: prayerItems[i], current, diff: pDate.getTime() - riyadhTime.getTime(), isTomorrow: false };
      }
    }
    const [h, m] = prayerItems[0].time.split(':').map(Number);
    const pDate = new Date(riyadhTime);
    pDate.setDate(pDate.getDate() + 1);
    pDate.setHours(h, m, 0, 0);
    return { next: prayerItems[0], current: prayerItems[prayerItems.length - 1], diff: pDate.getTime() - riyadhTime.getTime(), isTomorrow: true };
  }, [riyadhTime, prayerItems]);

  const formatCountdown = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDisplayTime = (time24: string) => {
    const [h, m] = time24.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${suffix}`;
  };

  if (loading && !timings) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <RefreshCcw className="w-8 h-8 text-primary/50" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-bg-dark text-on-surface text-[13px] overflow-hidden selection:bg-primary/30">
      <div className="islamic-pattern-overlay" />
      
      {/* Sleek Vertical Nav */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface-dark border-r border-surface-lighter z-50 shrink-0">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/5">
              <Compass className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white">NUR</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 mt-4">
          {[
            { name: 'Dashboard', icon: LayoutDashboard, active: true },
            { name: 'Full Calendar', icon: Calendar },
            { name: 'Qibla Finder', icon: Compass },
            { name: 'History', icon: Clock },
            { name: 'Preferences', icon: Settings },
          ].map((item) => (
            <button 
              key={item.name}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${item.active ? 'bg-primary/10 text-primary font-bold shadow-inner shadow-primary/5' : 'text-on-surface-muted hover:bg-surface-lighter hover:text-on-surface'}`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="p-6">
          <div className="bg-surface-lighter/20 border border-surface-lighter/50 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-sm shadow-lg">A</div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate">Abdullah Khan</span>
              <span className="text-[10px] text-on-surface-muted uppercase tracking-widest font-medium">Global Citizen</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Workspace */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-bg-dark/40">
        {/* Dynamic Header */}
        <header className="sticky top-0 z-40 bg-bg-dark/60 backdrop-blur-2xl border-b border-surface-lighter px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-white font-bold">
                <MapPin className="w-4 h-4 text-primary" />
                Riyadh, Saudi Arabia
              </div>
              <p className="text-[10px] text-on-surface-muted font-bold uppercase tracking-[0.2em] mt-0.5">
                {riyadhTime.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end">
              <div className="text-xl font-black text-primary tabular-nums tracking-tighter">
                {riyadhTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </div>
              <p className="text-[9px] font-black text-on-surface-muted uppercase tracking-[0.3em]">Live Feed active</p>
            </div>
            <button onClick={fetchTimings} className="p-2.5 rounded-xl bg-surface-dark border border-surface-lighter hover:bg-surface-lighter transition-all group">
              <RefreshCcw className="w-4 h-4 text-on-surface-muted group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </header>

        {/* Scrollable Area */}
        <main className="flex-1 overflow-y-auto px-8 py-10 space-y-12 scroll-smooth">
          {/* Dashboard Summary */}
          <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-4 border-b border-surface-lighter/30">
            <div>
              <h1 className="text-3xl font-black text-white mb-2 underline decoration-primary/30 underline-offset-8">Morning Dashboard</h1>
              <p className="text-on-surface-muted font-medium max-w-md leading-relaxed">
                Welcome back. You are currently in the <span className="text-primary font-bold">{(nextPrayerData?.current?.name)}</span> prayer window. 
                Next prayer is {nextPrayerData?.next.name} in Riyadh.
              </p>
            </div>
            <div className="flex flex-col md:items-end">
              <span className="text-xl font-black text-white px-4 py-2 bg-surface-dark rounded-xl border border-surface-lighter">23 Dhu al-Qi'dah 1447</span>
            </div>
          </section>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            
            {/* Primary Countdown Tower */}
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="xl:col-span-5 bg-surface-dark rounded-[2.5rem] p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden group border border-surface-lighter/50"
            >
              <div className="relative z-10 space-y-10">
                <div className="flex items-center gap-3">
                  <div className="bg-secondary/10 border border-secondary/20 px-4 py-1.5 rounded-full text-[10px] font-black text-secondary tracking-[0.2em] uppercase">
                    Upcoming Alert
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-[11px] font-black text-on-surface-muted tracking-[0.4em] uppercase opacity-60">Prepare for</h3>
                  <h2 className="text-6xl font-black text-primary tracking-tighter group-hover:tracking-normal transition-all duration-500">{nextPrayerData?.next.name}</h2>
                  <div className="flex items-center gap-2 text-sm font-bold text-white/50">
                    <Clock className="w-4 h-4" />
                    Scheduled at {nextPrayerData ? formatDisplayTime(nextPrayerData.next.time) : '--:--'}
                  </div>
                </div>

                <div className="pt-10 border-t border-surface-lighter/50 space-y-6">
                  <div className="text-7xl font-black text-white tabular-nums tracking-tighter drop-shadow-2xl">
                    {nextPrayerData ? formatCountdown(nextPrayerData.diff) : '00:00:00'}
                  </div>
                  <div className="relative h-2 w-full bg-surface-lighter rounded-full overflow-hidden">
                    <motion.div 
                      className="absolute h-full bg-gradient-to-r from-secondary to-orange-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${nextPrayerData ? Math.max(5, 100 - (nextPrayerData.diff / (10 * 3600 * 1000) * 100)) : 0}%` }}
                    />
                  </div>
                </div>
              </div>
              <Compass className="absolute -right-20 -bottom-20 w-80 h-80 text-primary opacity-[0.03] rotate-45 pointer-events-none" />
            </motion.div>

            {/* Prayer Cards - Compact & Elegant */}
            <div className="xl:col-span-7 flex flex-col gap-3">
              <div className="px-2 py-1 flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-on-surface-muted tracking-[0.4em] uppercase">Daily Tracker</span>
                {error && <span className="text-[10px] text-red-400 font-bold animate-pulse">! System Offline</span>}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {prayerItems.map((prayer, idx) => {
                  const isActive = nextPrayerData?.current?.id === prayer.id && !nextPrayerData.isTomorrow;
                  const isNext = nextPrayerData?.next.id === prayer.id;

                  return (
                    <motion.div 
                      key={prayer.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`
                        group p-6 rounded-[2rem] border transition-all duration-500 flex items-center justify-between
                        ${isActive 
                          ? 'bg-primary/5 border-primary/50 shadow-2xl shadow-primary/5' 
                          : 'bg-surface-dark/40 border-surface-lighter hover:bg-surface-dark hover:border-surface-lighter-highest'
                        }
                      `}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-2xl transition-all ${isActive ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-surface-lighter/50 text-white/40'}`}>
                          <prayer.icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                        </div>
                        <div>
                          <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isActive ? 'text-primary' : 'text-on-surface-muted/50'}`}>
                            {prayer.name}
                          </p>
                          <p className="text-xl font-black text-white tracking-tighter">
                            {formatDisplayTime(prayer.time)}
                          </p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => setNotifications(prev => ({ ...prev, [prayer.name]: !prev[prayer.name] }))}
                        className={`p-3 rounded-xl transition-all ${notifications[prayer.name] ? 'bg-primary/10 text-primary' : 'bg-surface-lighter/30 text-on-surface-muted hover:text-white'}`}
                      >
                        {notifications[prayer.name] ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Table - Re-engineered for Clarity */}
          <section className="space-y-6">
            <div className="flex justify-between items-end border-b border-surface-lighter/30 pb-4">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">Full Monthly Itinerary</h3>
                <p className="text-[10px] text-on-surface-muted font-bold uppercase tracking-[0.2em] opacity-60">May 2026 • Riyadh Region • Umm Al-Qura Standard</p>
              </div>
              <div className="flex bg-surface-dark p-1.5 rounded-2xl border border-surface-lighter ring-1 ring-white/5">
                {['May', 'June'].map(m => (
                  <button 
                    key={m}
                    onClick={() => setSelectedMonth(m)}
                    className={`px-8 py-2 rounded-xl text-xs font-black transition-all ${selectedMonth === m ? 'bg-primary text-white shadow-xl' : 'text-on-surface-muted hover:text-on-surface'}`}
                  >
                    {m} '26
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-surface-dark/40 border border-surface-lighter rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-sm">
              <div className="max-h-[500px] overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead className="sticky top-0 z-30 bg-surface-dark/95 backdrop-blur-md">
                    <tr className="border-b border-surface-lighter">
                      <th className="px-10 py-6 text-[9px] font-black text-on-surface-muted tracking-[0.4em] uppercase w-1/6">DATE</th>
                      <th className="px-10 py-6 text-[9px] font-black text-on-surface-muted tracking-[0.4em] uppercase w-1/6">FAJR</th>
                      <th className="px-10 py-6 text-[9px] font-black text-on-surface-muted tracking-[0.4em] uppercase w-1/6">DHUHR</th>
                      <th className="px-10 py-6 text-[9px] font-black text-on-surface-muted tracking-[0.4em] uppercase w-1/6">ASR</th>
                      <th className="px-10 py-6 text-[9px] font-black text-on-surface-muted tracking-[0.4em] uppercase w-1/6">MAGHRIB</th>
                      <th className="px-10 py-6 text-[9px] font-black text-on-surface-muted tracking-[0.4em] uppercase w-1/6 text-right">ISHA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-lighter/20">
                    {Array.from({ length: 31 }).map((_, i) => {
                      const dayNum = i + 1;
                      const isToday = dayNum === 10 && selectedMonth === 'May';
                      return (
                        <tr key={dayNum} className={`group hover:bg-surface-lighter/10 transition-colors ${isToday ? 'bg-primary/5 border-l-2 border-primary' : ''}`}>
                          <td className={`px-10 py-4 text-xs font-black ${isToday ? 'text-primary' : 'text-on-surface-muted'}`}>
                            {selectedMonth} {dayNum.toString().padStart(2, '0')}
                          </td>
                          <td className="px-10 py-4 text-xs font-black text-white/90 tabular-nums">{formatDisplayTime(timings?.Fajr || '04:05')}</td>
                          <td className="px-10 py-4 text-xs font-black text-white/90 tabular-nums">{formatDisplayTime(timings?.Dhuhr || '11:53')}</td>
                          <td className="px-10 py-4 text-xs font-black text-white/90 tabular-nums">{formatDisplayTime(timings?.Asr || '15:20')}</td>
                          <td className="px-10 py-4 text-xs font-black text-white/90 tabular-nums">{formatDisplayTime(timings?.Maghrib || '18:25')}</td>
                          <td className="px-10 py-4 text-xs font-black text-white/90 tabular-nums text-right">{formatDisplayTime(timings?.Isha || '19:55')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-8 bg-surface-lighter/10 border-t border-surface-lighter flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-primary" />
                  <p className="text-[10px] font-bold text-on-surface-muted leading-tight">
                    Data sourced from High-Precision Aladhan API. <br/>
                    Calculation Method: Umm Al-Qura University, Makkah.
                  </p>
                </div>
                <button className="flex items-center gap-3 bg-white text-bg-dark px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-transform shadow-xl">
                  <Download className="w-4 h-4" />
                  Download Data
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
