import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Shield, Truck, Clock, Phone, Star, ChevronRight, ArrowRight, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const services = [
  {
    title: "Deep Steam Cleaning",
    description: "Professional hot water extraction that removes embedded dirt and allergens from deep within carpet fibers.",
    icon: Sparkles,
    price: "From KES 500/m²",
  },
  {
    title: "Stain Removal",
    description: "Specialized treatment for tough stains including wine, coffee, pet accidents, and more.",
    icon: Shield,
    price: "From KES 800/m²",
  },
  {
    title: "Pickup & Delivery",
    description: "We come to you. Free pickup and delivery within Nairobi for orders above KES 5,000.",
    icon: Truck,
    price: "Free for 5K+",
  },
  {
    title: "Express Service",
    description: "Need it fast? Get your carpets cleaned and returned within 24 hours with our express option.",
    icon: Clock,
    price: "From KES 1,200/m²",
  },
];

const testimonials = [
  {
    name: "Sarah M.",
    location: "Karen, Nairobi",
    text: "CarpetPro transformed my 20-year-old Persian rug. It looks brand new! The before and after photos they shared were incredible.",
    rating: 5,
  },
  {
    name: "James K.",
    location: "Westlands, Nairobi",
    text: "Fast, reliable, and extremely professional. They picked up my carpets in the morning and delivered them spotless the next day.",
    rating: 5,
  },
  {
    name: "Amina O.",
    location: "Kilimani, Nairobi",
    text: "Best carpet cleaning service in Nairobi. Fair pricing and the quality of work is outstanding. Highly recommend!",
    rating: 5,
  },
];

const steps = [
  { step: "1", title: "Book Online", desc: "Select your carpet type and upload photos for an instant estimate" },
  { step: "2", title: "We Pick Up", desc: "Our team collects your carpets from your doorstep at your convenience" },
  { step: "3", title: "Expert Cleaning", desc: "Professional deep cleaning with eco-friendly solutions" },
  { step: "4", title: "Fresh Delivery", desc: "Your spotless carpets returned, looking and smelling brand new" },
];

export default function LandingPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2 h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-serif text-xl font-bold" data-testid="text-brand-name">CarpetPro</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#services" className="transition-colors" data-testid="link-services">Services</a>
            <a href="#how-it-works" className="transition-colors" data-testid="link-how-it-works">How It Works</a>
            <a href="#testimonials" className="transition-colors" data-testid="link-testimonials">Reviews</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/login")} data-testid="button-login">
              Sign In
            </Button>
            <Button size="sm" onClick={() => navigate("/book")} data-testid="button-book-now">
              Book Now
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-visible">
        <div className="absolute inset-0 z-0">
          <img src="/images/hero-carpet.png" alt="Clean carpet" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-2xl"
          >
            <motion.div variants={fadeUp}>
              <Badge variant="secondary" className="mb-6 text-xs font-medium bg-white/10 text-white border-white/20 backdrop-blur-sm" data-testid="badge-hero-tag">
                Nairobi's Premium Carpet Care
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight tracking-tight"
              data-testid="text-hero-title"
            >
              Your Carpets Deserve{" "}
              <span className="text-primary">Executive</span> Treatment
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-6 text-lg sm:text-xl text-white/80 max-w-xl leading-relaxed"
              data-testid="text-hero-subtitle"
            >
              Professional deep cleaning for all carpet types. We pick up, clean, and deliver — leaving your home fresh and spotless.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate("/book")} data-testid="button-hero-book">
                Get a Free Estimate <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="bg-white/5 border-white/20 text-white backdrop-blur-sm" data-testid="button-hero-call">
                <Phone className="mr-2 w-4 h-4" /> Call Us Now
              </Button>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-6 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>Free Pickup</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>48hr Turnaround</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>Satisfaction Guaranteed</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="services" className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.p variants={fadeUp} className="text-sm font-medium text-primary uppercase tracking-widest mb-2">Our Services</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-serif font-bold" data-testid="text-services-title">
              Premium Carpet Care Solutions
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              From everyday maintenance to deep restoration, we handle all carpet types with professional-grade equipment and eco-friendly solutions.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {services.map((service) => (
              <motion.div key={service.title} variants={fadeUp}>
                <Card className="p-6 h-full hover-elevate">
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                    <service.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2" data-testid={`text-service-${service.title.toLowerCase().replace(/\s+/g, '-')}`}>{service.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{service.description}</p>
                  <p className="text-sm font-semibold text-primary">{service.price}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 sm:py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-medium text-primary uppercase tracking-widest mb-2">Before & After</p>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4" data-testid="text-ba-title">See the Difference</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Our professional cleaning process removes years of dirt, stains, and allergens, restoring your carpets to their original beauty. Every job is documented with before and after photos for your satisfaction.
              </p>
              <ul className="space-y-3">
                {["99.9% allergen removal", "Eco-friendly cleaning solutions", "Color restoration technology", "Deodorizing treatment included"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl overflow-visible">
              <img
                src="/images/before-after.png"
                alt="Before and after carpet cleaning"
                className="w-full rounded-xl"
                data-testid="img-before-after"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-2">Simple Process</p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold" data-testid="text-how-title">How It Works</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              From booking to delivery, we make the entire process seamless and hassle-free.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold font-serif">
                  {s.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-20 sm:py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-2">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold" data-testid="text-reviews-title">What Our Clients Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <Card key={t.name} className="p-6 hover-elevate">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4 text-muted-foreground">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.location}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4" data-testid="text-cta-title">
            Ready for Spotless Carpets?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of satisfied customers across Nairobi. Get your free estimate in under 2 minutes.
          </p>
          <Button size="lg" onClick={() => navigate("/book")} data-testid="button-cta-book">
            Get Started <ChevronRight className="ml-1 w-4 h-4" />
          </Button>
        </div>
      </section>

      <footer className="border-t py-12 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-serif font-bold">CarpetPro Executive</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; 2026 CarpetPro Executive. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
