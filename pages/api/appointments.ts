import type { NextApiRequest, NextApiResponse } from 'next'

// Mock therapist data - replace with real database in production
const mockTherapists = [
  {
    id: '1',
    name: 'Dr. Priya Sharma',
    specialization: 'Anxiety & Depression',
    experience: '8 years',
    rating: 4.9,
    location: 'Malviya Nagar, Jaipur',
    bio: 'Specializes in cognitive behavioral therapy and mindfulness-based interventions with cultural sensitivity.',
    availability: ['2024-01-15', '2024-01-16', '2024-01-18'],
    timeSlots: ['09:00', '11:00', '14:00', '16:00']
  },
  {
    id: '2',
    name: 'Dr. Arjun Gupta',
    specialization: 'Trauma & PTSD',
    experience: '12 years',
    rating: 4.8,
    location: 'C-Scheme, Jaipur',
    bio: 'Expert in EMDR therapy and trauma-informed care with experience in cross-cultural healing approaches.',
    availability: ['2024-01-15', '2024-01-17', '2024-01-19'],
    timeSlots: ['10:00', '13:00', '15:00', '17:00']
  },
  {
    id: '3',
    name: 'Dr. Kavya Agarwal',
    specialization: 'Relationship Counseling',
    experience: '6 years',
    rating: 4.7,
    location: 'Vaishali Nagar, Jaipur',
    bio: 'Focuses on couples therapy and family dynamics using systemic approaches with Indian family values integration.',
    availability: ['2024-01-16', '2024-01-17', '2024-01-18'],
    timeSlots: ['09:30', '12:00', '14:30', '16:30']
  },
  {
    id: '4',
    name: 'Dr. Rohit Jain',
    specialization: 'Stress Management',
    experience: '10 years',
    rating: 4.9,
    location: 'Bani Park, Jaipur',
    bio: 'Integrates meditation, yoga therapy, and stress reduction techniques rooted in traditional Indian wellness practices.',
    availability: ['2024-01-15', '2024-01-16', '2024-01-19'],
    timeSlots: ['08:00', '11:30', '15:30', '18:00']
  },
  {
    id: '5',
    name: 'Dr. Meera Patel',
    specialization: 'Addiction Recovery',
    experience: '15 years',
    rating: 4.8,
    location: 'Tonk Road, Jaipur',
    bio: 'Specializes in substance abuse treatment and relapse prevention with holistic Ayurvedic approaches.',
    availability: ['2024-01-17', '2024-01-18', '2024-01-19'],
    timeSlots: ['09:00', '12:30', '15:00', '17:30']
  },
  {
    id: '6',
    name: 'Dr. Vikram Singh',
    specialization: 'Youth Counseling',
    experience: '7 years',
    rating: 4.6,
    location: 'Mansarovar, Jaipur',
    bio: 'Specializes in adolescent and young adult mental health with focus on academic and career stress.',
    availability: ['2024-01-15', '2024-01-17', '2024-01-18'],
    timeSlots: ['10:30', '13:30', '16:00', '18:30']
  },
  {
    id: '7',
    name: 'Dr. Anita Khanna',
    specialization: 'Women\'s Mental Health',
    experience: '11 years',
    rating: 4.8,
    location: 'Shyam Nagar, Jaipur',
    bio: 'Expert in women-specific mental health issues including postpartum depression and work-life balance.',
    availability: ['2024-01-16', '2024-01-18', '2024-01-19'],
    timeSlots: ['09:00', '11:30', '14:00', '17:00']
  },
  {
    id: '8',
    name: 'Dr. Rajesh Mittal',
    specialization: 'Geriatric Psychology',
    experience: '14 years',
    rating: 4.7,
    location: 'Civil Lines, Jaipur',
    bio: 'Focuses on elderly mental health, dementia care, and age-related psychological challenges.',
    availability: ['2024-01-15', '2024-01-16', '2024-01-17'],
    timeSlots: ['08:30', '11:00', '14:30', '16:00']
  }
];

let bookings: any[] = []

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    if (req.method === 'GET') {
      // Get therapists list with optional filtering
      const { specialty, location, search } = req.query
      
      let filteredTherapists = mockTherapists
      
      if (specialty) {
        filteredTherapists = filteredTherapists.filter(t => 
          t.specialization.toLowerCase().includes((specialty as string).toLowerCase())
        )
      }
      
      if (location) {
        filteredTherapists = filteredTherapists.filter(t => 
          t.location.toLowerCase().includes((location as string).toLowerCase())
        )
      }
      
      if (search) {
        const searchTerm = (search as string).toLowerCase()
        filteredTherapists = filteredTherapists.filter(t => 
          t.name.toLowerCase().includes(searchTerm) ||
          t.specialization.toLowerCase().includes(searchTerm) ||
          t.bio.toLowerCase().includes(searchTerm)
        )
      }

      res.status(200).json({
        status: 'success',
        therapists: filteredTherapists,
        total: filteredTherapists.length
      })
    }
    
    else if (req.method === 'POST') {
      // Book an appointment
      const { 
        therapistId, 
        date, 
        time, 
        userInfo,
        urgency = 'normal'
      } = req.body

      if (!therapistId || !date || !time || !userInfo?.name || !userInfo?.email) {
        res.status(400).json({ 
          status: 'error', 
          message: 'Missing required booking information' 
        })
        return
      }

      // Find the therapist
      const therapist = mockTherapists.find(t => t.id === therapistId)
      if (!therapist) {
        res.status(404).json({ 
          status: 'error', 
          message: 'Therapist not found' 
        })
        return
      }

      // Check availability (simplified for mock data)
      if (!therapist.availability.includes(date) || !therapist.timeSlots.includes(time)) {
        res.status(400).json({ 
          status: 'error', 
          message: 'Selected time slot is not available' 
        })
        return
      }

      // Create booking
      const booking = {
        id: `BK-${Date.now()}`,
        therapistId,
        therapistName: therapist.name,
        date,
        time,
        userInfo,
        urgency,
        status: 'confirmed',
        totalCost: 2500, // Fixed rate for all therapists
        createdAt: new Date().toISOString(),
        meetingLink: `https://meet.therapist.com/session/${Date.now()}`,
        confirmationCode: `CONF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      }

      bookings.push(booking)

      // Send confirmation (in real app, this would send actual emails/SMS)
      const confirmationMessage = urgency === 'crisis' 
        ? 'Crisis appointment booked. You will be contacted within 1 hour.'
        : urgency === 'urgent'
        ? 'Urgent appointment booked. Confirmation sent to your email.'
        : 'Appointment booked successfully. Confirmation sent to your email.'

      res.status(200).json({
        status: 'success',
        message: confirmationMessage,
        booking: {
          ...booking,
          nextSteps: [
            'Check your email for detailed confirmation',
            'Join the video call 5 minutes before your appointment',
            'Prepare any questions or topics you\'d like to discuss',
            'Ensure you have a quiet, private space'
          ]
        }
      })
    }
    
    else {
      res.setHeader('Allow', ['GET', 'POST', 'OPTIONS'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
    }

  } catch (error) {
    console.error('Appointments API Error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
