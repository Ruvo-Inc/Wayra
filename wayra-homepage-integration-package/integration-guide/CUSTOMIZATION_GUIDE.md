# Wayra Homepage Customization Guide

## 🎨 Design System Customization

### Color Palette
The homepage uses a carefully crafted color system. Customize by updating CSS variables:

```css
:root {
  /* Primary Colors */
  --primary-blue: #2563eb;        /* Main brand color */
  --secondary-blue: #60a5fa;      /* Lighter accent */
  --accent-green: #10b981;        /* Success/CTA color */
  
  /* Text Colors */
  --text-dark: #1f2937;           /* Primary text */
  --text-light: #6b7280;          /* Secondary text */
  --text-muted: #9ca3af;          /* Muted text */
  
  /* Background Colors */
  --background-light: #f8fafc;    /* Light sections */
  --background-white: #ffffff;    /* White sections */
  --background-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  
  /* Interactive Elements */
  --button-primary: var(--accent-green);
  --button-hover: #059669;
  --border-light: #e5e7eb;
}
```

### Typography Scale
Customize font sizes and weights:

```css
:root {
  /* Font Families */
  --font-primary: 'Inter', sans-serif;
  --font-heading: 'Poppins', sans-serif;
  
  /* Font Sizes */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */
  --text-5xl: 3rem;       /* 48px */
  --text-6xl: 3.75rem;    /* 60px */
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

## 📝 Content Customization

### Headlines and Copy
Update the main headlines in the component:

```javascript
// Hero Section
const heroHeadline = "The AI That Doesn't Just Plan Your Trip… It Books It (While You Sleep)";
const heroSubheadline = "Set your budget. Pick your dream. Wayra's multi-agent AI hunts for hidden deals 24/7 and books your flights, hotels, and activities when prices hit your target.";

// Problem Section
const problemHeadline = "Travel Planning Shouldn't Feel Like a Second Job";

// Solution Section
const solutionHeadline = "Meet Wayra: Your AI Travel Team Working While You Sleep";
```

### Social Proof Numbers
Update the metrics to reflect your actual data:

```javascript
const socialProofData = {
  certification: "SOC 2 Type II Certified",
  avgSavings: "$312/trip saved",
  rating: "4.8/5 (2,500+ travelers)",
  tripsBooked: "10,000+",
  totalSaved: "$2.3M",
  bookingRate: "94%",
  starRating: "4.8/5"
};
```

### Testimonials
Replace with real customer testimonials:

```javascript
const testimonials = [
  {
    quote: "Our family trip was chaos-free and under budget.",
    author: "The Johnsons",
    details: "Family of 4",
    savings: "$650",
    timeSaved: "12 hours saved"
  },
  // Add more testimonials
];
```

## 🔧 Feature Customization

### AI Agents Section
Customize the four AI agents:

```javascript
const aiAgents = [
  {
    icon: "💰",
    title: "Budget Analyst Agent",
    description: "Optimizes every dollar, ensuring maximum value while staying within budget"
  },
  {
    icon: "🌍",
    title: "Destination Research Agent", 
    description: "Discovers hidden gems, local experiences, and insider tips"
  },
  {
    icon: "📅",
    title: "Itinerary Planning Agent",
    description: "Creates day-by-day schedules that maximize time and minimize stress"
  },
  {
    icon: "🎯",
    title: "Travel Coordinator Agent",
    description: "Handles logistics, bookings, and ensures seamless connections"
  }
];
```

### Features List
Update the features to match your platform capabilities:

```javascript
const features = [
  {
    icon: "🔍",
    title: "Price Monitoring Engine",
    description: "24/7 tracking across all major booking platforms"
  },
  {
    icon: "⚡",
    title: "Automated Booking",
    description: "Books when prices hit your target (with approval)"
  },
  {
    icon: "👁️",
    title: "Full Transparency", 
    description: "See all options before any booking decisions"
  },
  {
    icon: "📊",
    title: "Budget Optimization",
    description: "Average 23% savings through intelligent monitoring"
  },
  {
    icon: "⏰",
    title: "Time Savings",
    description: "87% less planning effort required"
  }
];
```

## 🎯 CTA Customization

### Button Text Variations
A/B test different CTA button text:

```javascript
const ctaVariations = [
  "Start My AI-Planned Trip — Free",
  "🔥 Start My AI-Planned Trip (Free)",
  "Get My Perfect Trip Plan",
  "Book My Dream Trip with AI",
  "Start Planning with AI",
  "Try Wayra Free"
];
```

### CTA Actions
Customize what happens when users click CTAs:

```javascript
const handleCTAClick = (source) => {
  // Analytics tracking
  gtag('event', 'cta_click', {
    event_category: 'conversion',
    event_label: source,
    value: 1
  });
  
  // Different actions based on user state
  if (user.isAuthenticated) {
    navigate('/dashboard');
  } else if (user.hasAccount) {
    navigate('/login');
  } else {
    navigate('/signup');
  }
};
```

## 📱 Mobile Customization

### Responsive Breakpoints
Customize breakpoints for different devices:

```css
/* Mobile First Approach */
.hero-section {
  padding: 2rem 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .hero-section {
    padding: 3rem 2rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .hero-section {
    padding: 4rem 3rem;
  }
}

/* Large Desktop */
@media (min-width: 1280px) {
  .hero-section {
    padding: 5rem 4rem;
  }
}
```

### Mobile-Specific Features
Add mobile-specific enhancements:

```javascript
// Mobile-specific CTA
const isMobile = window.innerWidth < 768;
const mobileCTA = isMobile ? "Tap to Start" : "Start My AI-Planned Trip";

// Touch-friendly interactions
const handleTouchStart = (e) => {
  e.target.style.transform = 'scale(0.98)';
};

const handleTouchEnd = (e) => {
  e.target.style.transform = 'scale(1)';
};
```

## 🎨 Animation Customization

### Framer Motion Variants
Customize animations:

```javascript
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.5 }
};
```

### Scroll Animations
Add scroll-triggered animations:

```javascript
import { useInView } from 'framer-motion';

const SectionWithAnimation = ({ children }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6 }}
    >
      {children}
    </motion.div>
  );
};
```

## 🔍 SEO Customization

### Meta Tags
Customize SEO elements:

```javascript
// Add to your document head or use React Helmet
const seoData = {
  title: "Wayra - AI That Books Your Perfect Trip While You Sleep",
  description: "Set your budget, pick your dream destination. Wayra's AI hunts for deals 24/7 and books your flights, hotels, and activities when prices hit your target.",
  keywords: "AI travel planning, automated booking, travel deals, budget travel, smart travel",
  ogImage: "/images/wayra-og-image.jpg",
  twitterCard: "summary_large_image"
};
```

### Structured Data
Add structured data for better SEO:

```javascript
const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Wayra",
  "description": "AI-powered travel planning and booking platform",
  "applicationCategory": "TravelApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
};
```

## 📊 Analytics Customization

### Google Analytics 4
Set up conversion tracking:

```javascript
// Track CTA clicks
const trackCTAClick = (location) => {
  gtag('event', 'cta_click', {
    event_category: 'engagement',
    event_label: location,
    value: 1
  });
};

// Track scroll depth
const trackScrollDepth = (percentage) => {
  gtag('event', 'scroll', {
    event_category: 'engagement',
    event_label: `${percentage}%`,
    value: percentage
  });
};
```

### Custom Events
Track specific user interactions:

```javascript
// Track feature interest
const trackFeatureClick = (feature) => {
  gtag('event', 'feature_interest', {
    event_category: 'product',
    event_label: feature,
    value: 1
  });
};

// Track FAQ interactions
const trackFAQClick = (question) => {
  gtag('event', 'faq_click', {
    event_category: 'support',
    event_label: question,
    value: 1
  });
};
```

## 🧪 A/B Testing Setup

### Headline Testing
Set up headline variations:

```javascript
const headlineVariants = [
  "The AI That Doesn't Just Plan Your Trip… It Books It (While You Sleep)",
  "Never Research Travel Again - AI Does Everything While You Sleep",
  "Set Your Budget, AI Books Your Dream Trip Automatically",
  "The Only Travel App That Actually Books Your Trip For You"
];

const selectedHeadline = headlineVariants[Math.floor(Math.random() * headlineVariants.length)];
```

### CTA Testing
Test different call-to-action approaches:

```javascript
const ctaTests = {
  control: "Start My AI-Planned Trip — Free",
  urgency: "🔥 Join 847 Beta Users - Start Free",
  benefit: "Save $300+ on Your Next Trip",
  action: "Get My Perfect Trip Plan Now"
};
```

## 🎯 Conversion Optimization

### Exit Intent
Add exit-intent popup:

```javascript
const handleExitIntent = (e) => {
  if (e.clientY <= 0) {
    // Show exit-intent offer
    setShowExitOffer(true);
  }
};

useEffect(() => {
  document.addEventListener('mouseleave', handleExitIntent);
  return () => document.removeEventListener('mouseleave', handleExitIntent);
}, []);
```

### Progressive Profiling
Collect user information gradually:

```javascript
const progressiveSteps = [
  { field: 'destination', label: 'Where do you want to go?' },
  { field: 'budget', label: 'What\'s your budget?' },
  { field: 'dates', label: 'When are you traveling?' },
  { field: 'email', label: 'Get your AI-planned trip:' }
];
```

**This customization guide helps you adapt the homepage to your specific brand, audience, and conversion goals while maintaining the proven psychological architecture that drives results.**

