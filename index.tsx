import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Phone, 
  MessageCircle, 
  MapPin, 
  Calendar, 
  Users, 
  Briefcase, 
  CheckCircle, 
  AlertTriangle, 
  LogOut, 
  ChevronLeft,
  Navigation,
  Clock,
  User
} from 'lucide-react';

// --- CONSTANTS & CONFIG ---
const OFFICE_COORDS = { lat: 25.5940, lng: 85.1375 }; // Patna
const MAX_DISTANCE_KM = 16;
const SLOTS = [
  "10:30 AM - 11:30 AM",
  "12:00 PM - 01:00 PM",
  "01:30 PM - 03:00 PM"
];

// --- TYPES ---
type User = { id: string, name: string, role: 'admin' | 'staff', phone: string };
type Lead = { id: string, business_name: string, owner_name: string, phone: string, address: string, lat: number, lng: number, status: string, last_contact: string };
type Visit = { id: string, lead_id: string, staff_id: string, visit_date: string, time_slot: string, status: 'Scheduled' | 'Done' | 'Cancelled', gps_proof?: string };
type Leave = { date: string, reason: string, type: 'Global' | 'Personal', staff_id?: string };

// --- MOCK DATA ---
const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Vicky Kumar', role: 'admin', phone: '9999999999' },
  { id: 'u2', name: 'Staff A', role: 'staff', phone: '8888888888' },
  { id: 'u3', name: 'Staff B', role: 'staff', phone: '7777777777' },
];

const INITIAL_LEADS: Lead[] = [
  { id: 'l1', business_name: 'Gupta Offset', owner_name: 'Ravi Gupta', phone: '9876543210', address: 'Kankarbagh, Patna', lat: 25.5900, lng: 85.1500, status: 'New', last_contact: new Date().toISOString() }, // Nearby
  { id: 'l2', business_name: 'City Printers', owner_name: 'Amit Singh', phone: '9876543211', address: 'Danapur, Patna', lat: 25.6200, lng: 85.0400, status: 'New', last_contact: new Date().toISOString() }, // Nearby
  { id: 'l3', business_name: 'Far Away Press', owner_name: 'John Doe', phone: '9876543212', address: 'Muzaffarpur', lat: 26.1200, lng: 85.3900, status: 'New', last_contact: new Date().toISOString() }, // > 16km
  { id: 'l4', business_name: 'Converted Client 1', owner_name: 'Suresh', phone: '1231231233', address: 'Patna', lat: 25.6000, lng: 85.1000, status: 'Converted', last_contact: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString() }, // > 10 days ago (Neglected)
  { id: 'l5', business_name: 'Converted Client 2', owner_name: 'Mahesh', phone: '1231231234', address: 'Patna', lat: 25.6000, lng: 85.1000, status: 'Converted', last_contact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }, // OK
];

const INITIAL_LEAVES: Leave[] = [
  { date: '2024-05-25', reason: 'Diwali', type: 'Global' },
  { date: '2024-05-26', reason: 'Wedding', type: 'Personal', staff_id: 'u1' }, // Vicky has a wedding
];

// --- UTILS ---
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// --- COMPONENTS ---

// 1. LOGIN SCREEN
const LoginScreen = ({ users, onLogin }: { users: User[], onLogin: (u: User) => void }) => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-900 p-6">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-heading font-bold text-white mb-2">GPP CRM</h1>
        <p className="text-slate-400">Production Grade &middot; Flutter Architect</p>
      </div>
      <div className="w-full max-w-sm bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
        <h2 className="text-lg text-white mb-4 font-semibold">Select User to Login</h2>
        <div className="space-y-3">
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => onLogin(u)}
              className="w-full flex items-center p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors group"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${u.role === 'admin' ? 'bg-orange-600' : 'bg-blue-600'}`}>
                <span className="font-bold text-white">{u.name[0]}</span>
              </div>
              <div className="text-left">
                <div className="text-white font-medium group-hover:text-blue-300">{u.name}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">{u.role}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <p className="mt-8 text-xs text-slate-600">Simulating Firebase Auth</p>
    </div>
  );
};

// 2. MAIN APP CONTAINER
const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'leads' | 'visits' | 'clients'>('leads');
  
  // Simulated Database State
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [leaves] = useState<Leave[]>(INITIAL_LEAVES);

  // Persistence Simulation (Reset logic not included for simplicity)
  useEffect(() => {
    // In a real app, we would fetch from Firestore here
  }, []);

  const handleUpdateLeadStatus = (id: string, newStatus: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus, last_contact: new Date().toISOString() } : l));
  };

  const handleBookVisit = (visit: Visit) => {
    setVisits(prev => [...prev, visit]);
    handleUpdateLeadStatus(visit.lead_id, 'Visit Scheduled');
    setActiveTab('visits');
  };

  if (!currentUser) return <LoginScreen users={INITIAL_USERS} onLogin={setCurrentUser} />;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20 max-w-md mx-auto relative shadow-2xl border-x border-slate-800">
      {/* APP BAR */}
      <header className="bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-800 px-4 py-3 flex justify-between items-center">
        <div>
          <h1 className="font-heading text-xl font-bold text-white">GPP CRM</h1>
          <p className="text-xs text-slate-400">Hello, {currentUser.name}</p>
        </div>
        <button onClick={() => setCurrentUser(null)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-red-400">
          <LogOut size={18} />
        </button>
      </header>

      {/* CONTENT */}
      <main className="p-4">
        {activeTab === 'leads' && (
          <LeadsTab 
            leads={leads} 
            onUpdateStatus={handleUpdateLeadStatus} 
            currentUser={currentUser}
            leaves={leaves}
            visits={visits}
            onBookVisit={handleBookVisit}
            allUsers={INITIAL_USERS}
          />
        )}
        {activeTab === 'visits' && (
          <VisitsTab 
            visits={visits} 
            leads={leads}
            currentUser={currentUser}
            onMarkDone={(id, gps) => {
              setVisits(prev => prev.map(v => v.id === id ? { ...v, status: 'Done', gps_proof: gps } : v));
            }}
            onDealResult={(leadId, success) => {
              handleUpdateLeadStatus(leadId, success ? 'Converted' : 'Not Interested');
            }}
          />
        )}
        {activeTab === 'clients' && (
          <ClientsTab 
            leads={leads} 
            onNewOrder={(id) => handleUpdateLeadStatus(id, 'Converted')}
            onDemote={(id) => handleUpdateLeadStatus(id, 'Old Lead')}
          />
        )}
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 w-full max-w-md bg-slate-950 border-t border-slate-800 flex justify-around py-3 z-50">
        <NavBtn icon={Phone} label="Leads" active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} />
        <NavBtn icon={Briefcase} label="Visits" active={activeTab === 'visits'} onClick={() => setActiveTab('visits')} />
        <NavBtn icon={Users} label="Clients" active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} />
      </nav>
    </div>
  );
};

const NavBtn = ({ icon: Icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center ${active ? 'text-orange-500' : 'text-slate-500'}`}>
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] mt-1 font-medium">{label}</span>
  </button>
);

// 3. LEADS TAB
const LeadsTab = ({ leads, onUpdateStatus, currentUser, leaves, visits, onBookVisit, allUsers }: any) => {
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);

  // Filter leads for the list
  const displayLeads = leads.filter((l: Lead) => ['New', 'Call Later', 'Old Lead'].includes(l.status));

  if (viewingLead) {
    return (
      <ScheduleScreen 
        lead={viewingLead} 
        onBack={() => setViewingLead(null)} 
        currentUser={currentUser}
        leaves={leaves}
        visits={visits}
        onBook={onBookVisit}
        allUsers={allUsers}
      />
    );
  }

  return (
    <div className="space-y-4">
      {displayLeads.length === 0 && <div className="text-center text-slate-500 mt-10">No New Leads</div>}
      {displayLeads.map((lead: Lead) => (
        <div key={lead.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-bold text-white font-heading">{lead.business_name}</h3>
              <p className="text-sm text-slate-400">{lead.owner_name} &middot; {lead.address}</p>
            </div>
            <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-md border border-slate-600">{lead.status}</span>
          </div>

          {/* Action Row */}
          <div className="flex gap-3 my-4">
            <ActionButton icon={Phone} color="bg-green-600" onClick={() => window.open(`tel:${lead.phone}`)} />
            <ActionButton icon={MessageCircle} color="bg-green-500" onClick={() => window.open(`https://wa.me/${lead.phone}?text=Hello`)} />
            <ActionButton icon={MapPin} color="bg-blue-600" onClick={() => window.open(`https://maps.google.com/?q=${lead.lat},${lead.lng}`)} />
          </div>

          {/* Status Dropdown */}
          <div className="mt-3">
            <select 
              className="w-full bg-slate-900 text-white p-3 rounded-lg border border-slate-700 outline-none focus:border-orange-500 transition-colors"
              value={lead.status}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'Need Visit') {
                  setViewingLead(lead);
                } else {
                  onUpdateStatus(lead.id, val);
                }
              }}
            >
              <option value="New">New</option>
              <option value="Call Later">Call Later</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Old Lead">Old Lead</option>
              <option value="Need Visit" className="font-bold text-orange-400">📅 Schedule Visit (Action)</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
};

const ActionButton = ({ icon: Icon, color, onClick }: any) => (
  <button onClick={onClick} className={`flex-1 ${color} hover:opacity-90 active:scale-95 transition-all h-10 rounded-lg flex items-center justify-center text-white shadow-lg`}>
    <Icon size={18} />
  </button>
);

// 4. SCHEDULE SCREEN (Complex Logic)
const ScheduleScreen = ({ lead, onBack, currentUser, leaves, visits, onBook, allUsers }: any) => {
  const [selectedStaffId, setSelectedStaffId] = useState<string>(currentUser.id);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // A. DISTANCE LOGIC
  const distance = useMemo(() => calculateDistance(OFFICE_COORDS.lat, OFFICE_COORDS.lng, lead.lat, lead.lng), [lead]);
  const isWithinRange = distance <= MAX_DISTANCE_KM;

  // B. CALENDAR LOGIC (Next 14 days)
  const calendarDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      
      // Check leaves
      const staffLeave = leaves.find((l: Leave) => l.date === dateStr && l.staff_id === selectedStaffId);
      const globalLeave = leaves.find((l: Leave) => l.date === dateStr && l.type === 'Global');
      const leave = globalLeave || staffLeave;

      // Check bookings count
      const dayVisits = visits.filter((v: Visit) => v.visit_date === dateStr && v.staff_id === selectedStaffId);
      const slotsBooked = dayVisits.length;
      
      let status = 'open'; // green
      if (leave || slotsBooked >= 3) status = 'blocked'; // red
      else if (slotsBooked > 0) status = 'partial'; // grey/white

      days.push({ date: d, dateStr, status, leave });
    }
    return days;
  }, [leaves, visits, selectedStaffId]);

  const handleBook = () => {
    if (!selectedSlot) return;
    const newVisit: Visit = {
      id: Math.random().toString(36).substr(2, 9),
      lead_id: lead.id,
      staff_id: selectedStaffId,
      visit_date: selectedDate.toISOString().split('T')[0],
      time_slot: selectedSlot,
      status: 'Scheduled'
    };
    onBook(newVisit);
  };

  // Helper to get privacy-aware leave reason
  const getLeaveReason = (leave: Leave) => {
    if (leave.type === 'Global') return `Office Closed: ${leave.reason}`;
    // Privacy Logic: Only Admin or the user themselves can see the real reason
    if (currentUser.role === 'admin' || currentUser.id === leave.staff_id) {
      return `Unavailable: ${leave.reason}`;
    }
    return "Unavailable: Busy";
  };

  return (
    <div className="bg-slate-900 min-h-full">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full"><ChevronLeft /></button>
        <h2 className="text-xl font-heading font-bold">Schedule Visit</h2>
      </div>

      {/* 1. Distance Check */}
      <div className={`p-4 rounded-xl border mb-6 flex items-start gap-4 ${isWithinRange ? 'bg-green-900/20 border-green-800' : 'bg-orange-900/20 border-orange-800'}`}>
        {isWithinRange ? <CheckCircle className="text-green-500 shrink-0" /> : <AlertTriangle className="text-orange-500 shrink-0" />}
        <div>
          <h4 className={`font-bold ${isWithinRange ? 'text-green-400' : 'text-orange-400'}`}>
            Distance: {distance.toFixed(1)} KM
          </h4>
          <p className="text-sm text-slate-400 mt-1">
            {isWithinRange ? "Within 16KM range. Visit allowed." : "Beyond 16KM limit. Visits are restricted."}
          </p>
          {!isWithinRange && (
            <button className="mt-3 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium flex items-center gap-2">
              <MessageCircle size={16} /> Send WhatsApp Sample
            </button>
          )}
        </div>
      </div>

      {isWithinRange && (
        <>
          {/* 2. Staff Selection */}
          <div className="mb-6">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Who is visiting?</label>
            <div className="relative">
              <select 
                value={selectedStaffId}
                onChange={(e) => {
                  setSelectedStaffId(e.target.value);
                  setSelectedSlot(null); // Reset slot
                }}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 appearance-none focus:border-blue-500 outline-none"
              >
                {allUsers.map((u: User) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
              <User className="absolute right-3 top-3.5 text-slate-500 pointer-events-none" size={18} />
            </div>
          </div>

          {/* 3. Traffic Light Calendar */}
          <div className="mb-6">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Select Date</label>
            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
              {calendarDays.map((day, idx) => {
                const isSelected = day.date.toDateString() === selectedDate.toDateString();
                const isBlocked = day.status === 'blocked';
                
                let borderColor = 'border-slate-700';
                let bgColor = 'bg-slate-800';
                
                if (day.status === 'open') { borderColor = 'border-green-600/30'; }
                if (day.status === 'partial') { borderColor = 'border-slate-500/50'; }
                if (day.status === 'blocked') { borderColor = 'border-red-600/50'; bgColor = 'bg-red-900/10'; }
                
                if (isSelected) {
                  borderColor = 'border-blue-500';
                  bgColor = 'bg-blue-900/30';
                }

                return (
                  <button
                    key={idx}
                    disabled={isBlocked}
                    onClick={() => {
                      setSelectedDate(day.date);
                      setSelectedSlot(null);
                    }}
                    className={`flex-shrink-0 w-[72px] h-[90px] rounded-xl border-2 flex flex-col items-center justify-center relative transition-all ${borderColor} ${bgColor} ${isBlocked ? 'opacity-60 cursor-not-allowed' : 'hover:bg-slate-700 cursor-pointer'}`}
                  >
                    <span className="text-xs text-slate-400">{day.date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span className="text-2xl font-bold text-white my-1">{day.date.getDate()}</span>
                    
                    {/* Status Dot */}
                    <div className={`w-2 h-2 rounded-full ${day.status === 'blocked' ? 'bg-red-500' : day.status === 'open' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                  </button>
                );
              })}
            </div>
            
            {/* Show Leave Reason if selected date is blocked (though we disabled click, if they select another staff on a blocked day) */}
            {(() => {
              const currentDay = calendarDays.find(d => d.date.toDateString() === selectedDate.toDateString());
              if (currentDay?.leave) {
                return (
                  <div className="mt-2 p-3 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center gap-2 text-red-300 text-sm">
                    <AlertTriangle size={16} />
                    {getLeaveReason(currentDay.leave)}
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* 4. Slots */}
          <div className="mb-8">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Select Time Slot</label>
            <div className="grid grid-cols-1 gap-3">
              {SLOTS.map(slot => {
                // Check if slot is taken
                const dateStr = selectedDate.toISOString().split('T')[0];
                const isTaken = visits.some((v: Visit) => v.visit_date === dateStr && v.staff_id === selectedStaffId && v.time_slot === slot);
                
                return (
                  <button
                    key={slot}
                    disabled={isTaken}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-4 rounded-lg border text-left transition-all flex justify-between items-center
                      ${selectedSlot === slot 
                        ? 'bg-blue-600 border-blue-500 text-white' 
                        : isTaken 
                          ? 'bg-slate-800/50 border-slate-800 text-slate-600 cursor-not-allowed'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                  >
                    <span className="font-medium">{slot}</span>
                    {isTaken && <span className="text-xs bg-slate-700 px-2 py-1 rounded">Taken</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Book Button */}
          <button
            onClick={handleBook}
            disabled={!selectedSlot}
            className="w-full py-4 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            CONFIRM BOOKING
          </button>
        </>
      )}
    </div>
  );
};

// 5. VISITS TAB
const VisitsTab = ({ visits, leads, currentUser, onMarkDone, onDealResult }: any) => {
  const myVisits = visits
    .filter((v: Visit) => currentUser.role === 'admin' ? true : v.staff_id === currentUser.id)
    .sort((a: Visit, b: Visit) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime());

  const [activeVisitId, setActiveVisitId] = useState<string | null>(null);

  const handleDoneClick = (visit: Visit) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onMarkDone(visit.id, `${latitude},${longitude}`);
        setActiveVisitId(visit.id); // Open Popup
      },
      (error) => alert(`Error getting location: ${error.message}`)
    );
  };

  return (
    <div className="space-y-4">
      {myVisits.length === 0 && <div className="text-center text-slate-500 mt-10">No Scheduled Visits</div>}
      
      {myVisits.map((visit: Visit) => {
        const lead = leads.find((l: Lead) => l.id === visit.lead_id);
        if (!lead) return null;

        return (
          <div key={visit.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <div className="flex justify-between mb-2">
               <span className="text-orange-400 text-xs font-bold uppercase tracking-wider">{visit.visit_date}</span>
               <span className={`text-xs px-2 py-0.5 rounded ${visit.status === 'Done' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'}`}>{visit.status}</span>
            </div>
            <h3 className="text-lg font-bold text-white">{lead.business_name}</h3>
            <p className="text-sm text-slate-400 mb-4">{visit.time_slot}</p>
            
            {visit.status === 'Scheduled' && (
              <button 
                onClick={() => handleDoneClick(visit)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium flex items-center justify-center gap-2"
              >
                <Navigation size={18} /> Mark Visit Done (GPS)
              </button>
            )}

            {visit.status === 'Done' && visit.gps_proof && (
              <div className="mt-2 text-xs text-slate-500 font-mono bg-slate-900 p-2 rounded truncate">
                GPS Proof: {visit.gps_proof}
              </div>
            )}
          </div>
        );
      })}

      {/* DEAL POPUP */}
      {activeVisitId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]">
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-sm border border-slate-700 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Visit Completed!</h3>
            <p className="text-slate-300 text-center mb-6">What was the outcome of this meeting?</p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  const v = visits.find((v: Visit) => v.id === activeVisitId);
                  onDealResult(v.lead_id, false);
                  setActiveVisitId(null);
                }}
                className="py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Deal Failed
              </button>
              <button 
                onClick={() => {
                  const v = visits.find((v: Visit) => v.id === activeVisitId);
                  onDealResult(v.lead_id, true);
                  setActiveVisitId(null);
                }}
                className="py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-500 shadow-lg shadow-green-900/20"
              >
                Deal Confirmed!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 6. CLIENTS TAB
const ClientsTab = ({ leads, onNewOrder, onDemote }: any) => {
  const clients = leads.filter((l: Lead) => l.status === 'Converted');

  return (
    <div className="space-y-4">
       {clients.length === 0 && <div className="text-center text-slate-500 mt-10">No Clients Yet</div>}
       
       {clients.map((client: Lead) => {
         const daysSince = Math.floor((new Date().getTime() - new Date(client.last_contact).getTime()) / (1000 * 3600 * 24));
         const isNeglected = daysSince > 10;

         return (
           <div key={client.id} className={`bg-slate-800 p-4 rounded-xl border-2 transition-all ${isNeglected ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-slate-700'}`}>
             <div className="flex justify-between items-start">
               <div>
                  <h3 className="text-lg font-bold text-white">{client.business_name}</h3>
                  <p className="text-sm text-slate-400">{client.owner_name}</p>
               </div>
               {isNeglected && <div className="animate-pulse bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">TIME UP!</div>}
             </div>

             <div className="mt-4 p-3 bg-slate-900 rounded-lg flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  Last Contact: <span className={isNeglected ? "text-red-400 font-bold" : "text-slate-200"}>{daysSince} days ago</span>
                </div>
                <Clock size={16} className={isNeglected ? "text-red-500" : "text-slate-600"} />
             </div>

             <div className="mt-4 grid grid-cols-2 gap-3">
                <button onClick={() => onDemote(client.id)} className="text-xs text-slate-400 hover:text-white py-2">No Order (Demote)</button>
                <button onClick={() => onNewOrder(client.id)} className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold py-2 rounded-lg">New Work Order</button>
             </div>
           </div>
         );
       })}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);