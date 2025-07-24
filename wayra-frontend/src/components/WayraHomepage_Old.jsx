import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Plane, 
  Hotel, 
  MapPin, 
  DollarSign, 
  Clock, 
  Shield, 
  Star, 
  CheckCircle, 
  TrendingDown, 
  Users, 
  Calendar, 
  Zap,
  ArrowRight,
  Play,
  Quote,
  Award,
  Globe,
  Brain,
  Target,
  Timer,
  Sparkles,
  Phone,
  Mail,
  ChevronDown,
  BarChart3,
  Search,
  Route,
  Compass
} from 'lucide-react';
import '../styles/homepage.css';

const WayraHomepage = ({ onCTAClick }) => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [tripsPlanned, setTripsPlanned] = useState(12847);
  const [moneySaved, setMoneySaved] = useState(2.3);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);

  // Animated counters
  useEffect(() => {
    const interval = setInterval(() => {
      setTripsPlanned(prev => prev + Math.floor(Math.random() * 3));
      setMoneySaved(prev => Math.round((prev + Math.random() * 0.01) * 100) / 100);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Testimonial rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const testimonials = [
    {
      text: "Wayra's AI agents planned our entire European tour. Saved us $1,200 and countless hours of research.",
      author: "Sarah Chen",
      role: "Marketing Director",
      location: "San Francisco"
    },
    {
      text: "The budget optimization was incredible. Our family of four traveled to Japan for 40% less than expected.",
      author: "The Rodriguez Family",
      role: "Family Travelers",
      location: "Austin, TX"
    },
    {
      text: "As a travel blogger, I'm amazed by the hidden gems Wayra discovered. Places I never would have found.",
      author: "Marcus Thompson",
      role: "Travel Content Creator",
      location: "London, UK"
    }
  ];

  const coreInitiatives = [
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Budget Optimization",
      description: "Advanced AI algorithms analyze millions of price points to ensure maximum value for every dollar spent",
      stat: "Average 32% savings"
    },
    {
      icon: <Search className="w-8 h-8" />,
      title: "Destination Intelligence", 
      description: "Deep research into local experiences, hidden gems, and authentic cultural opportunities",
      stat: "2M+ destinations analyzed"
    },
    {
      icon: <Route className="w-8 h-8" />,
      title: "Intelligent Planning",
      description: "Sophisticated itinerary creation that optimizes time, reduces travel fatigue, and maximizes experiences",
      stat: "98% satisfaction rate"
    },
    {
      icon: <Compass className="w-8 h-8" />,
      title: "Seamless Coordination",
      description: "End-to-end travel management with real-time monitoring and 24/7 support",
      stat: "99.7% success rate"
    }
  ];

  const benefits = [
    {
      icon: <Timer className="w-5 h-5" />,
      title: "Price Monitoring Engine",
      description: "24/7 tracking across all major booking platforms"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Automated Booking",
      description: "Books when prices hit your target (with approval)"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Full Transparency",
      description: "See all options before any booking decisions"
    },
    {
      icon: <TrendingDown className="w-5 h-5" />,
      title: "Budget Optimization",
      description: "Average 23% savings through intelligent monitoring"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Time Savings",
      description: "87% less planning effort required"
    }
  ];

  const stats = [
    { number: "10,000+", label: "Trips Booked" },
    { number: "$2.3M", label: "Saved for Travelers" },
    { number: "94%", label: "Book Their AI Itinerary" },
    { number: "4.8/5", label: "Star Rating" }
  ];

  const objections = [
    {
      question: "Will it actually save me money?",
      answer: "Average 23% savings. You see the prices before approving."
    },
    {
      question: "What if I don't trust AI?",
      answer: "You approve every booking. Plus: 24/7 human support."
    },
    {
      question: "Can I cancel or change plans?",
      answer: "Flexible bookings prioritized. Human help available."
    },
    {
      question: "Is this secure?",
      answer: "SOC 2 Certified. Never stores payment info."
    }
  ];

  const bonuses = [
    { icon: <CheckCircle className="w-5 h-5" />, text: "Free AI trip planning", value: "$49 value" },
    { icon: <CheckCircle className="w-5 h-5" />, text: "30-Day Money-Back Guarantee", value: "" },
    { icon: <CheckCircle className="w-5 h-5" />, text: "Priority Access to auto-booking", value: "" },
    { icon: <CheckCircle className="w-5 h-5" />, text: "1-on-1 Onboarding Call", value: "" },
    { icon: <CheckCircle className="w-5 h-5" />, text: "Exclusive Beta-Only Deals", value: "" }
  ];

  return (
    <div className="wayra-homepage">
      {/* Navigation */}
      <nav className="wayra-nav">
        <div className="wayra-container">
          <div className="flex items-center justify-between py-6">
            <div className="wayra-logo">
              <h2 className="text-2xl font-bold text-white">Wayra</h2>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#about" className="text-white/80 hover:text-white transition-colors">About</a>
              <a href="#initiatives" className="text-white/80 hover:text-white transition-colors">AI Agents</a>
              <a href="#contact" className="text-white/80 hover:text-white transition-colors">Contact</a>
              <button 
                onClick={() => onCTAClick && onCTAClick('nav')}
                className="wayra-cta-button-small px-6 py-2 text-sm"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="wayra-hero">
        <div className="wayra-hero-bg" />
        <div className="wayra-container">
          <motion.div 
            className="wayra-hero-content"
            style={{ y: heroY }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            {/* Hero Badge */}
                </div>
              </div>
            </motion.div>

            {/* Right Column - Visual */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-8 shadow-2xl">
                {/* Phone Mockup */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="text-center space-y-4">
                    <motion.div 
                      className="text-4xl"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      ✈️
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-900">Trip Booked!</h3>
                    <div className="space-y-2">
                      <p className="text-lg font-semibold">Paris, 4 Days</p>
                      <p className="text-3xl font-bold text-green-600">$1,247</p>
                      <p className="text-green-600 font-medium">(Saved $312)</p>
                    </div>
                    <motion.div 
                      className="flex justify-center space-x-1"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1, duration: 0.5 }}
                    >
                      {[...Array(5)].map((_, i) => (
                        <Sparkles key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </motion.div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <motion.div 
                  className="absolute -top-4 -right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium"
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Auto-booked at 3:47 AM
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
        </div>
      </motion.section>

      {/* Problem Section */}
      <section className="wayra-section bg-gray-50">
        <div className="wayra-container">
          <motion.div 
            className="max-w-4xl mx-auto text-center space-y-12"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="wayra-headline text-3xl md:text-5xl text-gray-900">
              Travel Planning Shouldn't Feel Like a Second Job
            </h2>
            
            <p className="wayra-body text-xl text-gray-600 leading-relaxed">
              You've been here: 14 tabs open. Flight price jumps mid-click. Hotels all look the same. 
              "Budget trip" somehow ends up 40% over.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {[
                { icon: <DollarSign className="w-6 h-6" />, title: "The Price-Jump Trap", desc: "Prices change while you research" },
                { icon: <Clock className="w-6 h-6" />, title: "Missed-Deal Syndrome", desc: "Best deals happen while you sleep" },
                { icon: <MapPin className="w-6 h-6" />, title: "Booking Chaos", desc: "Flights, hotels, activities scattered" },
                { icon: <TrendingDown className="w-6 h-6" />, title: "Budget Blowout", desc: "Hidden costs destroy your budget" },
                { icon: <Timer className="w-6 h-6" />, title: "The Time Vampire", desc: "Hours of research for mediocre results" }
              ].map((pain, index) => (
                <motion.div 
                  key={index}
                  className="wayra-card text-center"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="wayra-feature-icon mx-auto mb-4">
                    {pain.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{pain.title}</h3>
                  <p className="text-gray-600">{pain.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.p 
              className="wayra-body text-xl text-gray-700 font-medium"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              viewport={{ once: true }}
            >
              What if you never had to plan again—and still traveled smarter?
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="wayra-section">
        <div className="wayra-container">
          <motion.div 
            className="text-center space-y-12"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="max-w-4xl mx-auto">
              <h2 className="wayra-headline text-3xl md:text-5xl text-gray-900 mb-6">
                Meet Wayra: Your AI Travel Team Working While You Sleep
              </h2>
              <p className="wayra-body text-xl text-gray-600 leading-relaxed">
                Wayra isn't just another planner. It's an execution engine. Your trip is handled by{' '}
                <span className="font-semibold wayra-gradient-text">four specialized AI agents</span>:
              </p>
            </div>

            {/* AI Agents Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  className="wayra-card text-center group"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                >
                  <div className="wayra-feature-icon mx-auto mb-4 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-3">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Value Proposition */}
            <motion.div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                You approve the plan. We book the dream. Done.
              </h3>
              <p className="text-xl opacity-90">
                You're in control. The AI just makes you unstoppable.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features & Benefits */}
      <section className="wayra-section bg-gray-50">
        <div className="wayra-container">
          <motion.div 
            className="text-center space-y-12"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="wayra-headline text-3xl md:text-4xl text-gray-900">
              Everything You Need for Perfect Trips
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div 
                  key={index}
                  className="wayra-card group"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="wayra-feature-icon flex-shrink-0 group-hover:scale-110 transition-transform">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="wayra-section">
        <div className="wayra-container">
          <motion.div 
            className="text-center space-y-12"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="wayra-headline text-3xl md:text-4xl text-gray-900">
              Real Travelers. Real Trips. Real Results.
            </h2>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
              {stats.map((stat, index) => (
                <motion.div 
                  key={index}
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="wayra-counter wayra-gradient-text">{stat.number}</div>
                  <p className="text-gray-600 font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Testimonial Carousel */}
            <div className="max-w-4xl mx-auto">
              <motion.div 
                className="wayra-testimonial relative"
                key={currentTestimonial}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
              >
                <Quote className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                <blockquote className="text-xl md:text-2xl font-medium text-gray-900 mb-6">
                  "{testimonials[currentTestimonial].text}"
                </blockquote>
                <div className="flex items-center justify-center space-x-8">
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">{testimonials[currentTestimonial].author}</p>
                    <p className="text-gray-600">{testimonials[currentTestimonial].role}</p>
                  </div>
                  <div className="flex space-x-4">
                    <div className="wayra-badge wayra-badge-success">
                      Saved {testimonials[currentTestimonial].savings}
                    </div>
                    <div className="wayra-badge wayra-badge-primary">
                      {testimonials[currentTestimonial].time} saved
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Testimonial Indicators */}
              <div className="flex justify-center space-x-2 mt-8">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentTestimonial ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    onClick={() => setCurrentTestimonial(index)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Objections Handling */}
      <section className="wayra-section bg-gray-50">
        <div className="wayra-container">
          <motion.div 
            className="max-w-4xl mx-auto space-y-12"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="text-center">
              <h2 className="wayra-headline text-3xl md:text-4xl text-gray-900 mb-4">
                Still Skeptical? Good. Here's Your Safety Net.
              </h2>
            </div>

            <div className="space-y-6">
              {objections.map((objection, index) => (
                <motion.div 
                  key={index}
                  className="wayra-card"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="wayra-feature-icon flex-shrink-0">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 text-gray-900">{objection.question}</h3>
                      <p className="text-gray-600">{objection.answer}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Urgency & Bonuses */}
      <section className="wayra-section">
        <div className="wayra-container">
          <motion.div 
            className="max-w-4xl mx-auto text-center space-y-12"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            {/* Urgency Header */}
            <div className="wayra-gradient-border p-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Sparkles className="w-6 h-6 text-orange-500" />
                <h2 className="wayra-headline text-2xl md:text-3xl text-gray-900">
                  Limited Beta Offer: Only{' '}
                  <span className="wayra-counter text-orange-500">{spotsLeft}</span>{' '}
                  Spots Left
                </h2>
                <Sparkles className="w-6 h-6 text-orange-500" />
              </div>
            </div>

            {/* Bonus Stack */}
            <div className="wayra-card">
              <h3 className="text-2xl font-bold mb-6">Sign up today and get:</h3>
              <div className="space-y-4">
                {bonuses.map((bonus, index) => (
                  <motion.div 
                    key={index}
                    className="flex items-center justify-between p-4 bg-green-50 rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-green-600">{bonus.icon}</div>
                      <span className="font-medium">{bonus.text}</span>
                    </div>
                    {bonus.value && (
                      <span className="text-green-600 font-semibold">{bonus.value}</span>
                    )}
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-lg font-semibold">
                  Total Value: <span className="wayra-gradient-text">$297 — Yours Free</span>
                </p>
              </div>
            </div>

            {/* Final CTA */}
            <div className="space-y-6">
              <h2 className="wayra-headline text-3xl md:text-4xl text-gray-900">
                Ready to Never Research Travel Again?
              </h2>
              
              <motion.button 
                className="wayra-cta-button text-xl px-12 py-5 inline-flex items-center gap-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCTAClick && onCTAClick('final')}
              >
                🔥 Start My AI-Planned Trip (Free)
                <ArrowRight className="w-6 h-6" />
              </motion.button>

              <div className="space-y-2 text-gray-600">
                <p className="font-medium">30-day money-back guarantee • Cancel anytime • No hidden fees</p>
                <p className="text-sm">
                  Join the {spotsLeft} remaining beta testers who will experience the future of travel planning
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mobile Sticky CTA */}
      <div className="wayra-mobile-cta">
        <button 
          className="wayra-cta-button w-full text-center"
          onClick={() => onCTAClick && onCTAClick('mobile')}
        >
          Start My AI-Planned Trip — Free
        </button>
      </div>
    </div>
  );
};

export default WayraHomepage;

