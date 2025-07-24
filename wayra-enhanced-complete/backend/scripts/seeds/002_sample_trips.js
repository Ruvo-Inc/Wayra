/**
 * Seed: Sample Trips
 * Order: 2
 * Created: 2025-01-23T00:00:00.000Z
 */

// Environments where this seed should run
const environments = ['development'];

// Whether this seed is required (will stop seeding if it fails)
const required = false;

// Description of what this seed does
const description = 'Creates sample trips for development users';

/**
 * Execute seed - Create sample trips
 * @param {Object} db - MongoDB database connection
 */
async function seed(db) {
  console.log('Running seed: Sample Trips');
  
  try {
    // Check if trips already exist
    const existingTrips = await db.collection('trips').countDocuments();
    if (existingTrips > 0) {
      console.log(`⏭️ Skipping trip creation - ${existingTrips} trips already exist`);
      return;
    }

    // Get development users
    const users = await db.collection('users').find({
      email: { $regex: '@wayra\\.dev$' }
    }).toArray();

    if (users.length === 0) {
      console.log('⚠️ No development users found, skipping trip creation');
      return;
    }

    const trips = [
      {
        title: 'European Adventure',
        description: 'A 2-week journey through the best of Europe',
        destination: {
          name: 'Paris, France',
          country: 'France',
          coordinates: { lat: 48.8566, lng: 2.3522 }
        },
        dates: {
          start: new Date('2025-06-15'),
          end: new Date('2025-06-29'),
          flexible: false
        },
        budget: {
          total: 2800,
          currency: 'USD',
          breakdown: {
            accommodation: 1120,
            transportation: 840,
            food: 560,
            activities: 280,
            miscellaneous: 0
          },
          spent: 0,
          remaining: 2800
        },
        travelers: {
          adults: 2,
          children: 0,
          infants: 0
        },
        owner: users[0]._id,
        collaborators: [
          {
            userId: users[1]._id,
            role: 'editor',
            invitedBy: users[0]._id,
            invitedAt: new Date('2025-01-20'),
            acceptedAt: new Date('2025-01-21'),
            permissions: ['view', 'edit', 'comment']
          }
        ],
        status: 'planning',
        visibility: 'shared',
        aiGenerated: {
          itinerary: {
            days: [
              {
                day: 1,
                location: 'Paris',
                activities: ['Arrive at CDG Airport', 'Check into hotel', 'Evening stroll along Seine']
              },
              {
                day: 2,
                location: 'Paris',
                activities: ['Visit Louvre Museum', 'Lunch at local bistro', 'Eiffel Tower at sunset']
              }
            ]
          },
          budgetAnalysis: {
            recommendations: ['Book flights early for better prices', 'Consider museum passes'],
            savings: 200
          },
          destinationInsights: {
            bestTimeToVisit: 'June is perfect for Paris weather',
            localTips: ['Learn basic French phrases', 'Validate metro tickets']
          },
          travelCoordination: {
            bookingStatus: 'pending',
            nextSteps: ['Book flights', 'Reserve accommodations']
          },
          generatedAt: new Date('2025-01-22'),
          agentVersions: {
            budgetAnalyst: '1.0',
            destinationResearch: '1.0',
            itineraryPlanning: '1.0',
            travelCoordinator: '1.0'
          }
        },
        customizations: [],
        activityLog: [
          {
            userId: users[0]._id,
            action: 'created_trip',
            details: { title: 'European Adventure' },
            timestamp: new Date('2025-01-20')
          },
          {
            userId: users[0]._id,
            action: 'invited_collaborator',
            details: { invitedUser: users[1].email },
            timestamp: new Date('2025-01-20')
          }
        ],
        bookings: [],
        tags: ['europe', 'culture', 'adventure'],
        createdAt: new Date('2025-01-20'),
        updatedAt: new Date('2025-01-22')
      },
      {
        title: 'Tokyo Food & Culture Tour',
        description: 'Exploring the culinary delights and rich culture of Tokyo',
        destination: {
          name: 'Tokyo, Japan',
          country: 'Japan',
          coordinates: { lat: 35.6762, lng: 139.6503 }
        },
        dates: {
          start: new Date('2025-09-10'),
          end: new Date('2025-09-17'),
          flexible: true
        },
        budget: {
          total: 2200,
          currency: 'USD',
          breakdown: {
            accommodation: 770,
            transportation: 440,
            food: 660,
            activities: 330,
            miscellaneous: 0
          },
          spent: 0,
          remaining: 2200
        },
        travelers: {
          adults: 1,
          children: 0,
          infants: 0
        },
        owner: users[1]._id,
        collaborators: [],
        status: 'planning',
        visibility: 'private',
        aiGenerated: {
          itinerary: {
            days: [
              {
                day: 1,
                location: 'Tokyo',
                activities: ['Arrive at Narita Airport', 'Check into hotel in Shibuya', 'Explore Shibuya Crossing']
              },
              {
                day: 2,
                location: 'Tokyo',
                activities: ['Tsukiji Fish Market tour', 'Sushi making class', 'Asakusa Temple visit']
              }
            ]
          },
          budgetAnalysis: {
            recommendations: ['JR Pass for transportation', 'Street food for authentic experience'],
            savings: 150
          },
          destinationInsights: {
            bestTimeToVisit: 'September offers pleasant weather and fewer crowds',
            localTips: ['Download Google Translate', 'Carry cash - many places don\'t accept cards']
          },
          travelCoordination: {
            bookingStatus: 'research',
            nextSteps: ['Research neighborhoods', 'Book food tours']
          },
          generatedAt: new Date('2025-01-21'),
          agentVersions: {
            budgetAnalyst: '1.0',
            destinationResearch: '1.0',
            itineraryPlanning: '1.0',
            travelCoordinator: '1.0'
          }
        },
        customizations: [],
        activityLog: [
          {
            userId: users[1]._id,
            action: 'created_trip',
            details: { title: 'Tokyo Food & Culture Tour' },
            timestamp: new Date('2025-01-21')
          }
        ],
        bookings: [],
        tags: ['japan', 'food', 'culture', 'solo'],
        createdAt: new Date('2025-01-21'),
        updatedAt: new Date('2025-01-21')
      },
      {
        title: 'Budget Backpacking Europe',
        description: 'Low-cost adventure through Eastern Europe',
        destination: {
          name: 'Prague, Czech Republic',
          country: 'Czech Republic',
          coordinates: { lat: 50.0755, lng: 14.4378 }
        },
        dates: {
          start: new Date('2025-07-01'),
          end: new Date('2025-07-21'),
          flexible: true
        },
        budget: {
          total: 1200,
          currency: 'USD',
          breakdown: {
            accommodation: 360,
            transportation: 300,
            food: 420,
            activities: 120,
            miscellaneous: 0
          },
          spent: 0,
          remaining: 1200
        },
        travelers: {
          adults: 1,
          children: 0,
          infants: 0
        },
        owner: users[2]._id,
        collaborators: [],
        status: 'planning',
        visibility: 'public',
        aiGenerated: {
          itinerary: {
            days: [
              {
                day: 1,
                location: 'Prague',
                activities: ['Arrive by train', 'Check into hostel', 'Free walking tour']
              },
              {
                day: 2,
                location: 'Prague',
                activities: ['Prague Castle', 'Charles Bridge', 'Local beer tasting']
              }
            ]
          },
          budgetAnalysis: {
            recommendations: ['Stay in hostels', 'Use public transportation', 'Cook some meals'],
            savings: 400
          },
          destinationInsights: {
            bestTimeToVisit: 'July is peak season but great weather',
            localTips: ['Czech Republic uses Czech Koruna', 'Tipping 10% is standard']
          },
          travelCoordination: {
            bookingStatus: 'planning',
            nextSteps: ['Book hostel beds', 'Research train routes']
          },
          generatedAt: new Date('2025-01-19'),
          agentVersions: {
            budgetAnalyst: '1.0',
            destinationResearch: '1.0',
            itineraryPlanning: '1.0',
            travelCoordinator: '1.0'
          }
        },
        customizations: [],
        activityLog: [
          {
            userId: users[2]._id,
            action: 'created_trip',
            details: { title: 'Budget Backpacking Europe' },
            timestamp: new Date('2025-01-19')
          }
        ],
        bookings: [],
        tags: ['europe', 'budget', 'backpacking', 'solo'],
        createdAt: new Date('2025-01-19'),
        updatedAt: new Date('2025-01-19')
      }
    ];

    const result = await db.collection('trips').insertMany(trips);
    console.log(`✅ Inserted ${result.insertedCount} sample trips`);
    
    // Log created trips for reference
    trips.forEach(trip => {
      const owner = users.find(u => u._id.equals(trip.owner));
      console.log(`   - ${trip.title} (${owner?.profile.displayName})`);
    });
    
  } catch (error) {
    console.error('❌ Failed to create sample trips:', error.message);
    throw error;
  }
}

module.exports = {
  seed,
  environments,
  required,
  description
};