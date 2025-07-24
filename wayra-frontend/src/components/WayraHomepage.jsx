import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight,
  Search,
  Calendar,
  Users,
  Star,
  MapPin,
  Clock,
  Shield,
  Globe,
  Zap,
  Quote,
  Play
} from 'lucide-react';
import '../styles/homepage.css';

const WayraHomepage = ({ onCTAClick }) => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Sample destinations data
  const destinations = [
    {
      title: "Bali, Indonesia",
      description: "Tropical paradise with stunning beaches",
      price: "From $89/night",
      image: "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=400&h=300&fit=crop"
    },
    {
      title: "Tokyo, Japan", 
      description: "Modern city meets ancient traditions",
      price: "From $156/night",
      image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop"
    },
    {
      title: "Santorini, Greece",
      description: "Iconic white buildings and blue domes", 
      price: "From $203/night",
      image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=300&fit=crop"
    },
    {
      title: "Maldives",
      description: "Overwater villas in crystal clear waters",
      price: "From $450/night", 
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"
    }
  ];

  // Sample deals data
  const deals = [
    {
      title: "Paris Weekend Getaway",
      description: "3 nights at 4-star hotel + flights",
      price: "$599",
      originalPrice: "$999",
      discount: "Save 40%",
      image: "https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400&h=300&fit=crop"
    },
    {
      title: "Dubai Luxury Experience", 
      description: "5 nights at Burj Al Arab + activities",
      price: "$1,299",
      originalPrice: "$1,732",
      discount: "Save 25%",
      image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop"
    },
    {
      title: "Costa Rica Adventure",
      description: "7 days eco-lodge + guided tours", 
      price: "$899",
      originalPrice: "$1,284",
      discount: "Save 30%",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop"
    },
    {
      title: "Iceland Northern Lights",
      description: "4 nights + aurora hunting tours",
      price: "$749", 
      originalPrice: "$1,152",
      discount: "Save 35%",
      image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=300&fit=crop"
    }
  ];

  const testimonials = [
    {
      text: "Wayra found us incredible deals in Bali that saved us over $800. The AI recommendations were spot-on!",
      author: "Sarah Chen",
      role: "Travel Enthusiast",
      location: "San Francisco",
      rating: 5
    },
    {
      text: "Best travel booking experience ever. The AI found hidden gems and perfect accommodations for our family.",
      author: "The Rodriguez Family", 
      role: "Family Travelers",
      location: "Austin, TX",
      rating: 5
    },
    {
      text: "As a frequent traveler, I'm amazed by how Wayra optimizes every aspect of trip planning. Incredible value!",
      author: "Marcus Thompson",
      role: "Business Traveler", 
      location: "London, UK",
      rating: 5
    }
  ];

  const features = [
    {
      icon: <Search className="w-8 h-8" />,
      title: "Smart Search",
      description: "AI-powered search finds the best deals across millions of properties worldwide"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Booking",
      description: "Book your perfect trip in seconds with our streamlined booking process"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Best Price Guarantee", 
      description: "We guarantee the lowest prices or we'll match and beat any competitor"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Global Coverage",
      description: "Access to 2.5M+ properties in 150+ countries around the world"
    }
  ];

  // Testimonial rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="wayra-homepage">
      {/* Navigation */}
      <nav className="wayra-nav">
        <div className="wayra-container">
          <div className="flex items-center justify-between py-4">
            <div className="wayra-logo text-2xl font-bold text-white">
              ✈️ Wayra
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-white hover:text-yellow-300 transition-colors">Stays</a>
              <a href="#" className="text-white hover:text-yellow-300 transition-colors">Flights</a>
              <a href="#" className="text-white hover:text-yellow-300 transition-colors">Experiences</a>
              <a href="#" className="text-white hover:text-yellow-300 transition-colors">Support</a>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-white hover:text-yellow-300 transition-colors">Sign In</button>
              <button className="bg-yellow-500 text-blue-900 px-4 py-2 rounded-full font-semibold hover:bg-yellow-400 transition-colors">
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Search */}
      <section className="wayra-hero">
        <div className="wayra-hero-bg"></div>
        <div className="wayra-container">
          <div className="wayra-hero-content">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="wayra-hero-badge">
                🌟 AI-Powered Travel Planning
              </div>
              <h1 className="wayra-hero-title">
                Your Dream Trip Awaits
              </h1>
              <p className="wayra-hero-subtitle">
                Discover amazing destinations, find perfect accommodations, and book your next adventure with AI that works while you sleep.
              </p>
              
              {/* Hero Search Box */}
              <div className="wayra-hero-search">
                <div className="wayra-search-tabs">
                  <button className="wayra-search-tab active">🏨 Stays</button>
                  <button className="wayra-search-tab">✈️ Flights</button>
                  <button className="wayra-search-tab">🚗 Car Rentals</button>
                  <button className="wayra-search-tab">🎯 Experiences</button>
                </div>
                <div className="wayra-search-form">
                  <div className="wayra-search-field">
                    <label>Where are you going?</label>
                    <input type="text" placeholder="Enter destination, hotel, or landmark" />
                  </div>
                  <div className="wayra-search-dates">
                    <div className="wayra-search-field">
                      <label>Check-in</label>
                      <input type="date" />
                    </div>
                    <div className="wayra-search-field">
                      <label>Check-out</label>
                      <input type="date" />
                    </div>
                  </div>
                  <div className="wayra-search-field">
                    <label>Guests</label>
                    <select>
                      <option>2 adults</option>
                      <option>1 adult</option>
                      <option>3 adults</option>
                      <option>4+ adults</option>
                    </select>
                  </div>
                  <button className="wayra-search-button">
                    🔍 Search
                  </button>
                </div>
              </div>
              
              <div className="wayra-hero-stats">
                <div className="wayra-stat">
                  <div className="wayra-stat-number">2.5M+</div>
                  <div className="wayra-stat-label">Properties Worldwide</div>
                </div>
                <div className="wayra-stat">
                  <div className="wayra-stat-number">150+</div>
                  <div className="wayra-stat-label">Countries</div>
                </div>
                <div className="wayra-stat">
                  <div className="wayra-stat-number">24/7</div>
                  <div className="wayra-stat-label">AI Travel Assistant</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trending Destinations */}
      <section className="wayra-section wayra-section-light">
        <div className="wayra-container">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="wayra-headline text-3xl md:text-5xl text-gray-900 mb-6">
              🌍 Trending Destinations
            </h2>
            <p className="text-xl text-gray-600">
              Discover where travelers are booking their next adventures
            </p>
          </motion.div>

          <div className="wayra-destination-showcase">
            {destinations.map((destination, index) => (
              <motion.div 
                key={index}
                className="wayra-destination-card"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="wayra-destination-image">
                  <img src={destination.image} alt={destination.title} />
                  <div className="wayra-destination-overlay">
                    <button className="wayra-destination-heart">❤️</button>
                  </div>
                </div>
                <div className="wayra-destination-content">
                  <h3 className="wayra-destination-title">{destination.title}</h3>
                  <p className="wayra-destination-subtitle">{destination.description}</p>
                  <div className="wayra-destination-price">{destination.price}</div>
                  <div className="wayra-destination-features">
                    <span className="wayra-destination-tag">🏖️ Beach</span>
                    <span className="wayra-destination-tag">🍽️ Food</span>
                    <span className="wayra-destination-tag">🏛️ Culture</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Exclusive Deals */}
      <section className="wayra-section">
        <div className="wayra-container">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="wayra-headline text-3xl md:text-4xl text-white mb-6">
              🔥 Exclusive Deals & Offers
            </h2>
            <p className="text-xl text-white/80">
              Limited-time offers curated by our AI travel experts
            </p>
          </motion.div>

          <div className="wayra-destination-showcase">
            {deals.map((deal, index) => (
              <motion.div 
                key={index}
                className="wayra-destination-card wayra-deal-card"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="wayra-destination-image">
                  <img src={deal.image} alt={deal.title} />
                  <div className="wayra-deal-badge">{deal.discount}</div>
                </div>
                <div className="wayra-destination-content">
                  <h3 className="wayra-destination-title">{deal.title}</h3>
                  <p className="wayra-destination-subtitle">{deal.description}</p>
                  <div className="wayra-deal-pricing">
                    <span className="wayra-deal-price">{deal.price}</span>
                    <span className="wayra-deal-original">{deal.originalPrice}</span>
                  </div>
                  <button className="wayra-deal-button">
                    Book Now <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="wayra-section wayra-section-light">
        <div className="wayra-container">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="wayra-headline text-3xl md:text-4xl text-gray-900 mb-6">
              Why Choose Wayra?
            </h2>
          </motion.div>

          <div className="wayra-features-grid">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                className="wayra-feature-card"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="wayra-feature-icon">
                  {feature.icon}
                </div>
                <h3 className="wayra-feature-title">{feature.title}</h3>
                <p className="wayra-feature-description">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="wayra-section">
        <div className="wayra-container">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="wayra-headline text-3xl md:text-4xl text-white mb-6">
              Trusted by Travelers Worldwide
            </h2>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <motion.div 
              className="wayra-testimonial"
              key={currentTestimonial}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
            >
              <Quote className="w-8 h-8 text-yellow-400 mb-4" />
              <p className="text-xl text-white/90 mb-6 italic">
                "{testimonials[currentTestimonial].text}"
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">
                    {testimonials[currentTestimonial].author}
                  </div>
                  <div className="text-white/70">
                    {testimonials[currentTestimonial].role} • {testimonials[currentTestimonial].location}
                  </div>
                </div>
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="wayra-section wayra-section-light">
        <div className="wayra-container">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="wayra-headline text-3xl md:text-4xl text-gray-900 mb-6">
              Ready to Start Your Adventure?
            </h2>
            
            <p className="text-xl text-gray-600 mb-8">
              Join millions of travelers who trust Wayra for their perfect trips
            </p>

            <motion.button 
              className="wayra-cta-button-primary text-xl px-12 py-5 inline-flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCTAClick && onCTAClick('final')}
            >
              Start Planning Now
              <ArrowRight className="w-6 h-6" />
            </motion.button>

            <div className="mt-8 text-gray-500">
              <p>✅ Free to use • ✅ Best price guarantee • ✅ 24/7 support</p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default WayraHomepage;
