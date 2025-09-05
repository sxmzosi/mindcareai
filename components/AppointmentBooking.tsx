import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin, Phone, Mail, Star, Filter, Search } from 'lucide-react';

interface Therapist {
  id: string;
  name: string;
  specialties: string[];
  rating: number;
  experience: number;
  location: string;
  avatar: string;
  bio: string;
  hourlyRate: number;
  availability: {
    date: string;
    slots: string[];
  }[];
}

interface AppointmentBookingProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingComplete: (booking: any) => void;
}

const AppointmentBooking: React.FC<AppointmentBookingProps> = ({
  isOpen,
  onClose,
  onBookingComplete
}) => {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [step, setStep] = useState<'search' | 'select' | 'confirm' | 'success'>('search');
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    reason: '',
    urgency: 'normal' as 'normal' | 'urgent' | 'crisis'
  });

  // Fetch therapists from API
  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        const response = await fetch('/api/appointments');
        const data = await response.json();
        if (data.status === 'success') {
          // Convert API data to component format
          const convertedTherapists = data.therapists.map((t: any) => ({
            id: t.id,
            name: t.name,
            specialties: [t.specialization],
            rating: t.rating,
            experience: parseInt(t.experience),
            location: t.location,
            avatar: '👩‍⚕️',
            bio: t.bio,
            hourlyRate: 2500, // ₹2500 per session
            availability: t.availability.map((date: string) => ({
              date,
              slots: t.timeSlots
            }))
          }));
          setTherapists(convertedTherapists);
        }
      } catch (error) {
        console.error('Failed to fetch therapists:', error);
        // Fallback to empty array
        setTherapists([]);
      }
    };
    
    fetchTherapists();
  }, []);

  const filteredTherapists = therapists.filter(therapist => {
    const matchesSearch = therapist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         therapist.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSpecialty = !specialtyFilter || therapist.specialties.includes(specialtyFilter);
    return matchesSearch && matchesSpecialty;
  });

  const allSpecialties = Array.from(new Set(therapists.flatMap(t => t.specialties)));

  const handleTherapistSelect = (therapist: Therapist) => {
    setSelectedTherapist(therapist);
    setStep('select');
  };

  const handleTimeSlotSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setStep('confirm');
  };

  const handleBookingSubmit = async () => {
    if (!selectedTherapist || !selectedDate || !selectedTime) return;

    const booking = {
      therapistId: selectedTherapist.id,
      therapistName: selectedTherapist.name,
      date: selectedDate,
      time: selectedTime,
      userInfo,
      bookingId: `BK-${Date.now()}`,
      status: 'confirmed',
      totalCost: selectedTherapist.hourlyRate
    };

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onBookingComplete(booking);
    setStep('success');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Book Therapy Appointment</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center mt-4 space-x-2">
            {['search', 'select', 'confirm', 'success'].map((s, index) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s ? 'bg-blue-500 text-white' : 
                  ['search', 'select', 'confirm', 'success'].indexOf(step) > index ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                {index < 3 && <div className="w-8 h-0.5 bg-gray-200 mx-1" />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {step === 'search' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Find Your Therapist</h3>
              
              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search by name or specialty..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="md:w-48">
                  <select
                    value={specialtyFilter}
                    onChange={(e) => setSpecialtyFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Specialties</option>
                    {allSpecialties.map(specialty => (
                      <option key={specialty} value={specialty}>{specialty}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Therapist List */}
              <div className="grid gap-4">
                {filteredTherapists.map(therapist => (
                  <div key={therapist.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="text-4xl">{therapist.avatar}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-800">{therapist.name}</h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                              <Star className="text-yellow-400 fill-current" size={16} />
                              <span>{therapist.rating}</span>
                              <span>•</span>
                              <span>{therapist.experience} years experience</span>
                              <span>•</span>
                              <MapPin size={14} />
                              <span>{therapist.location}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-green-600">₹{therapist.hourlyRate}/session</div>
                            <button
                              onClick={() => handleTherapistSelect(therapist)}
                              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              Select
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-600 mt-2">{therapist.bio}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {therapist.specialties.map(specialty => (
                            <span key={specialty} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'select' && selectedTherapist && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <button
                  onClick={() => setStep('search')}
                  className="text-blue-500 hover:text-blue-700"
                >
                  ← Back to therapists
                </button>
              </div>
              
              <h3 className="text-xl font-semibold mb-4">
                Select Appointment Time with {selectedTherapist.name}
              </h3>

              <div className="grid gap-4">
                {selectedTherapist.availability.map(day => (
                  <div key={day.date} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      <Calendar className="inline mr-2" size={16} />
                      {formatDate(day.date)}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {day.slots.map(time => (
                        <button
                          key={time}
                          onClick={() => handleTimeSlotSelect(day.date, time)}
                          className="p-2 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-center"
                        >
                          <Clock className="inline mr-1" size={14} />
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'confirm' && selectedTherapist && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <button
                  onClick={() => setStep('select')}
                  className="text-blue-500 hover:text-blue-700"
                >
                  ← Back to time selection
                </button>
              </div>

              <h3 className="text-xl font-semibold mb-4">Confirm Your Appointment</h3>

              {/* Appointment Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-800 mb-2">Appointment Details</h4>
                <div className="space-y-1 text-blue-700">
                  <p><User className="inline mr-2" size={16} />{selectedTherapist.name}</p>
                  <p><Calendar className="inline mr-2" size={16} />{formatDate(selectedDate)}</p>
                  <p><Clock className="inline mr-2" size={16} />{selectedTime}</p>
                  <p className="font-semibold">Total: ₹{selectedTherapist.hourlyRate}</p>
                </div>
              </div>

              {/* User Information Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo({...userInfo, name: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={userInfo.phone}
                  onChange={(e) => setUserInfo({...userInfo, phone: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Reason for appointment (optional)"
                  value={userInfo.reason}
                  onChange={(e) => setUserInfo({...userInfo, reason: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
                />
                <select
                  value={userInfo.urgency}
                  onChange={(e) => setUserInfo({...userInfo, urgency: e.target.value as any})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">Normal Priority</option>
                  <option value="urgent">Urgent (within 48 hours)</option>
                  <option value="crisis">Crisis (immediate attention needed)</option>
                </select>
              </div>

              <button
                onClick={handleBookingSubmit}
                disabled={!userInfo.name || !userInfo.email}
                className="w-full mt-6 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Confirm Booking
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-semibold text-green-600 mb-4">Appointment Booked Successfully!</h3>
              <p className="text-gray-600 mb-6">
                You will receive a confirmation email shortly with appointment details and preparation instructions.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-green-800 mb-2">Next Steps:</h4>
                <ul className="text-green-700 text-left space-y-1">
                  <li>• Check your email for confirmation and video call link</li>
                  <li>• Prepare any questions or topics you'd like to discuss</li>
                  <li>• Ensure you have a quiet, private space for the session</li>
                  <li>• Test your internet connection and camera beforehand</li>
                </ul>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;
