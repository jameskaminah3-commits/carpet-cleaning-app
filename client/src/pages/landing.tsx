import { useMemo, useState, useEffect, useCallback } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Phone, Star, ChevronRight, ArrowRight, CheckCircle2,
  Shield, Droplets, Wind, Bug, Home, Baby, Dog, Zap, Timer, Award,
  MessageCircle
} from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Review, User } from "@shared/schema";

const PHONE_NUMBER = "0707255598";
const WHATSAPP_LINK = `https://wa.me/254707255598?text=${encodeURIComponent("Hi CarpetPro! I'd like to get a free estimate for carpet cleaning.")}`;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

function HeroBackground() {
  const { scrollYProgress } = useScroll();
  const fiberY = useTransform(scrollYProgress, [0, 0.4], [0, -60]);

  const bubbles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      left: `${2 + (i * 3.3) % 96}%`,
      bottom: `${-5 - (i * 2) % 10}%`,
      size: 5 + (i % 6) * 4,
      duration: `${8 + (i % 8) * 2}s`,
      delay: `${(i * 0.7) % 10}s`,
      opacity: 0.25 + (i % 4) * 0.12,
    })), []);

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0c2d6b] via-[#1a4a8a] to-[#0e3570]" />

      <div className="absolute inset-0 hero-gradient-mesh" />

      <div className="hero-glow-pulse absolute w-[500px] h-[500px] rounded-full bg-sky-400/15 blur-[100px] top-[20%] left-[15%]" />
      <div className="hero-glow-pulse absolute w-[400px] h-[400px] rounded-full bg-cyan-300/12 blur-[80px] top-[50%] right-[20%]" style={{ animationDelay: "3s" }} />
      <div className="hero-glow-pulse absolute w-[300px] h-[300px] rounded-full bg-blue-300/10 blur-[60px] bottom-[10%] left-[40%]" style={{ animationDelay: "5s" }} />

      <div className="hero-ripple-1 absolute w-[700px] h-[700px] rounded-full border-2 border-cyan-300/25 top-[55%] left-[25%]" />
      <div className="hero-ripple-2 absolute w-[500px] h-[500px] rounded-full border-2 border-sky-200/20 top-[35%] left-[55%]" />
      <div className="hero-ripple-3 absolute w-[900px] h-[900px] rounded-full border border-blue-200/15 top-[45%] left-[35%]" />
      <div className="hero-ripple-4 absolute w-[600px] h-[600px] rounded-full border-2 border-cyan-200/18 top-[60%] left-[45%]" />

      {bubbles.map((b, i) => (
        <div
          key={i}
          className="hero-bubble absolute rounded-full"
          style={{
            left: b.left,
            bottom: b.bottom,
            width: b.size,
            height: b.size,
            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,${b.opacity}), rgba(186,230,253,${b.opacity * 0.6}) 50%, transparent)`,
            boxShadow: `0 0 ${b.size * 2.5}px rgba(186,230,253,${b.opacity * 0.4})`,
            "--duration": b.duration,
            "--delay": b.delay,
          } as React.CSSProperties}
        />
      ))}

      <motion.div
        className="absolute inset-0 hero-fiber-texture"
        style={{ y: fiberY }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_45%,transparent,rgba(12,45,107,0.4)_60%,rgba(12,45,107,0.7))]" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}

const technologies = [
  {
    id: "no-damp",
    badge: "The No-Damp Promise",
    title: "\"Ready-to-Use\" Advantage",
    subtitle: "High-Velocity Vortex Extraction",
    description: "Our industrial-grade High-Velocity Vortex Extraction system pulls out 95% of the water instantly. Your carpet comes back ready to lay down and walk on — no damp smell, no waiting days to dry.",
    stat: "95%",
    statLabel: "Water Extracted Instantly",
    icon: Wind,
    gradient: "from-cyan-500 to-blue-600",
    bgGlow: "bg-cyan-500/10",
  },
  {
    id: "dust",
    badge: "Heavy-Duty Power",
    title: "Dust De-Clogging Technology",
    subtitle: "Industrial Extraction Power",
    description: "Nairobi's red soil doesn't stand a chance. Our Heavy-Duty Dust De-Clogging system uses industrial-grade suction and agitation to remove compacted dust, soil, and debris that household vacuums can't reach.",
    stat: "10x",
    statLabel: "More Powerful Than Home Vacuums",
    icon: Zap,
    gradient: "from-amber-500 to-orange-600",
    bgGlow: "bg-amber-500/10",
  },
  {
    id: "deep-fiber",
    badge: "Deep Extraction",
    title: "Deep-Fiber Agitation",
    subtitle: "Foundation-Level Cleaning",
    description: "Our Deep-Fiber Agitation technology reaches the 'foundation' of your carpet, extracting the hidden red soil and allergens that household machines miss. We clean from the base up, not just the surface.",
    stat: "100%",
    statLabel: "Fiber Depth Penetration",
    icon: Bug,
    gradient: "from-emerald-500 to-green-600",
    bgGlow: "bg-emerald-500/10",
  },
  {
    id: "zero-residue",
    badge: "Family & Pet Friendly",
    title: "\"Zero-Residue\" Safety",
    subtitle: "Clean-Rinse Fluidics System",
    description: "Our specialized tech uses Clean-Rinse Fluidics to ensure zero chemical residue. It leaves your carpet soft to the touch and safe for your kids and pets to crawl on immediately.",
    stat: "0%",
    statLabel: "Chemical Residue Left Behind",
    icon: Shield,
    gradient: "from-purple-500 to-violet-600",
    bgGlow: "bg-purple-500/10",
  },
];

const testimonials = [
  {
    name: "Sarah M.",
    location: "Karen, Nairobi",
    text: "I was amazed — my carpet was completely dry and ready to use the same day! No damp smell at all. The kids were playing on it within hours.",
    rating: 5,
  },
  {
    name: "James K.",
    location: "Westlands, Nairobi",
    text: "Living near a construction site, the red soil was embedded deep in my Persian rug. CarpetPro's deep extraction brought back colors I'd forgotten existed.",
    rating: 5,
  },
  {
    name: "Amina O.",
    location: "Kilimani, Nairobi",
    text: "With a toddler and two cats, chemical-free cleaning was non-negotiable. CarpetPro delivered — the carpet felt softer than when we first bought it!",
    rating: 5,
  },
  {
    name: "Peter N.",
    location: "Lavington, Nairobi",
    text: "Our office carpets hadn't been properly cleaned in years. CarpetPro revived them in a single visit — the entire floor looks brand new. Highly recommend for corporate clients.",
    rating: 5,
  },
  {
    name: "Grace W.",
    location: "Runda, Nairobi",
    text: "I've tried 4 different cleaning services. CarpetPro is the only one that didn't leave my silk carpet feeling stiff. They understand premium fabrics.",
    rating: 5,
  },
  {
    name: "David M.",
    location: "Kileleshwa, Nairobi",
    text: "Fast pickup, same-day cleaning, and my shag carpet came back fluffier than ever. The pickup and delivery service is incredibly convenient.",
    rating: 5,
  },
];

const steps = [
  { step: "1", title: "Get Free Estimate", desc: "Tell us your carpet type and dimensions — no login needed, no obligations" },
  { step: "2", title: "We Pick Up", desc: "Our team collects your carpets from your doorstep at your preferred time" },
  { step: "3", title: "Deep Extraction", desc: "Industrial-grade cleaning with our proprietary vortex extraction technology" },
  { step: "4", title: "Ready to Use", desc: "Carpets returned dry, fresh, and ready to walk on — as fast as 2 hours" },
];

type GallerySlide =
  | { type: "photo"; before: string; after: string; label: string; desc: string }
  | { type: "video"; src: string; label: string; desc: string };

const gallerySlides: GallerySlide[] = [
  { type: "photo", before: "/images/before-1.png", after: "/images/after-1.png", label: "Wool Carpet", desc: "Red soil stains removed" },
  { type: "video", src: "/images/video-cleaning-1.mp4", label: "Deep Extraction", desc: "Watch our process in action" },
  { type: "photo", before: "/images/before-2.png", after: "/images/after-2.png", label: "Persian Rug", desc: "Colors fully restored" },
  { type: "photo", before: "/images/before-3.png", after: "/images/after-3.png", label: "Shag Carpet", desc: "Pet stains eliminated" },
  { type: "video", src: "/images/video-cleaning-2.mp4", label: "Fresh Results", desc: "See the transformation" },
  { type: "photo", before: "/images/before-4.png", after: "/images/after-4.png", label: "Office Carpet", desc: "Traffic wear reversed" },
];

function BeforeAfterGallery() {
  const observerRef = { current: null as ResizeObserver | null };
  const trackRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!node) return;
    const measure = () => {
      const firstChild = node.firstElementChild as HTMLElement | null;
      if (!firstChild) return;
      const computedGap = parseFloat(getComputedStyle(node).gap) || 0;
      const childWidth = firstChild.offsetWidth + computedGap;
      const setWidth = childWidth * gallerySlides.length;
      node.style.setProperty("--single-set-width", `${setWidth}px`);
    };
    measure();
    observerRef.current = new ResizeObserver(measure);
    observerRef.current.observe(node);
  }, []);

  const trackItems = [...gallerySlides, ...gallerySlides, ...gallerySlides];

  return (
    <section className="py-20 sm:py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden" data-testid="section-before-after">
      <div className="absolute w-80 h-80 rounded-full bg-primary/8 blur-3xl -top-20 -right-20" />
      <div className="absolute w-64 h-64 rounded-full bg-emerald-500/8 blur-3xl bottom-0 left-10" />

      <div className="relative z-10">
        <div className="text-center mb-12 px-4 sm:px-6 lg:px-8">
          <Badge variant="secondary" className="mb-4 bg-white/10 border-white/20 text-white text-xs">Real Results</Badge>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold" data-testid="text-before-after-title">
            Before & <span className="text-primary">After</span>
          </h2>
          <p className="mt-4 text-white/60 max-w-2xl mx-auto">
            See the difference our Deep Extraction Technology makes. Every carpet tells a transformation story.
          </p>
        </div>

        <div className="overflow-hidden">
          <div
            ref={trackRef}
            className="flex gap-6 gallery-scroll-track"
            style={{ ["--duration" as string]: `${gallerySlides.length * 5}s` }}
          >
            {trackItems.map((slide, i) => (
              <div key={i} className="flex-shrink-0 w-[280px] sm:w-[340px] lg:w-[400px]">
                {slide.type === "photo" ? (
                  <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden">
                    <div className="relative">
                      <img
                        src={slide.before}
                        alt={`${slide.label} before cleaning`}
                        className="w-full aspect-[4/3] object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <span className="absolute bottom-2 left-2 bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">Before</span>
                    </div>
                    <div className="relative">
                      <img
                        src={slide.after}
                        alt={`${slide.label} after cleaning`}
                        className="w-full aspect-[4/3] object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <span className="absolute bottom-2 left-2 bg-green-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">After</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl overflow-hidden relative">
                    <video
                      src={slide.src}
                      className="w-full aspect-video object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      data-testid={`video-gallery-${i}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                    <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      VIDEO
                    </div>
                  </div>
                )}
                <div className="mt-3 text-center">
                  <p className="font-semibold text-sm text-white">{slide.label}</p>
                  <p className="text-xs text-white/50">{slide.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-10 px-4">
          <p className="text-white/50 text-xs">Trusted by 5,000+ Nairobi homes and offices</p>
        </div>
      </div>
    </section>
  );
}

function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { data: publicReviews = [] } = useQuery<(Review & { customer?: User })[]>({ queryKey: ["/api/reviews/public"] });

  const allTestimonials = useMemo(() => {
    const real = publicReviews.map(r => ({
      name: r.customer?.name || "Customer",
      location: "Nairobi",
      text: r.comment || "Great service!",
      rating: r.rating,
    }));
    return [...real, ...testimonials];
  }, [publicReviews]);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % allTestimonials.length);
  }, [allTestimonials.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + allTestimonials.length) % allTestimonials.length);
  }, [allTestimonials.length]);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  const getVisibleIndices = () => {
    const indices = [];
    for (let i = -1; i <= 1; i++) {
      indices.push((current + i + allTestimonials.length) % allTestimonials.length);
    }
    return indices;
  };

  const visible = getVisibleIndices();

  return (
    <section id="testimonials" className="py-20 sm:py-24 bg-card overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4 text-xs px-4 py-1">Client Stories</Badge>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold" data-testid="text-reviews-title">What Our Clients Say</h2>
        </div>

        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="hidden md:grid grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {visible.map((idx, pos) => {
                const t = allTestimonials[idx];
                return (
                  <motion.div
                    key={`${t.name}-${idx}`}
                    initial={{ opacity: 0, x: 80, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -80, scale: 0.9 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                      <div className="flex gap-1 mb-4">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-sm leading-relaxed mb-4 text-muted-foreground italic" data-testid={`text-testimonial-${idx}`}>"{t.text}"</p>
                      <div>
                        <p className="font-semibold text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.location}</p>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="md:hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: allTestimonials[current]?.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-4 text-muted-foreground italic">"{allTestimonials[current]?.text}"</p>
                  <div>
                    <p className="font-semibold text-sm">{allTestimonials[current]?.name}</p>
                    <p className="text-xs text-muted-foreground">{allTestimonials[current]?.location}</p>
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={prev}
              className="w-9 h-9 rounded-full border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
              data-testid="button-testimonial-prev"
              aria-label="Previous review"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <div className="flex gap-2">
              {allTestimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === current ? "bg-primary w-6" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  data-testid={`button-testimonial-dot-${i}`}
                  aria-label={`Go to review ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="w-9 h-9 rounded-full border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
              data-testid="button-testimonial-next"
              aria-label="Next review"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2 h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-serif text-xl font-bold" data-testid="text-brand-name">
              <span className="text-muted-foreground">Carpet</span>Pro{" "}
              <span className="italic text-primary">Executive</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#technology" className="hover:text-foreground transition-colors" data-testid="link-technology">Technology</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors" data-testid="link-how-it-works">How It Works</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors" data-testid="link-testimonials">Reviews</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/login")} data-testid="button-login">
              Sign In
            </Button>
            <Button size="sm" onClick={() => navigate("/book")} data-testid="button-book-now">
              Free Estimate
            </Button>
          </div>
        </div>
      </header>

      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <HeroBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-3xl"
          >
            <motion.div variants={fadeUp}>
              <Badge variant="secondary" className="mb-6 text-xs font-medium bg-white/10 text-white border-white/20 backdrop-blur-sm px-4 py-1.5" data-testid="badge-hero-tag">
                <Zap className="w-3 h-3 mr-1.5 text-primary" />
                Nairobi's Only Deep Extraction Carpet Specialists
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold text-white leading-[1.1] tracking-tight"
              data-testid="text-hero-title"
            >
              Deep Extraction{" "}
              <span className="relative">
                <span className="text-primary">Technology</span>
                <motion.span
                  className="absolute -bottom-1 left-0 right-0 h-1 bg-primary/50 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                />
              </span>
              <br />
              <span className="text-white/90">for Carpets That Feel New</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-6 text-lg sm:text-xl text-white/70 max-w-2xl leading-relaxed"
              data-testid="text-hero-subtitle"
            >
              Industrial-grade vortex extraction that removes deep-embedded dirt, red soil, and allergens — then returns your carpet dry and ready to use in as little as <strong className="text-white">2 hours</strong>.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate("/book")} className="text-base px-8 h-13 shadow-lg shadow-primary/25" data-testid="button-hero-estimate">
                Get a Free Estimate <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <a href={`tel:${PHONE_NUMBER}`}>
                <Button size="lg" variant="outline" className="bg-white/5 border-white/20 text-white backdrop-blur-sm text-base h-13" data-testid="button-hero-call">
                  <Phone className="mr-2 w-4 h-4" /> Call Us Now
                </Button>
              </a>
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="bg-green-500/10 border-green-500/30 text-green-400 backdrop-blur-sm text-base h-13" data-testid="button-hero-whatsapp">
                  <MessageCircle className="mr-2 w-4 h-4" /> Chat on WhatsApp
                </Button>
              </a>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>Returns Dry & Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-primary" />
                <span>As Fast as 2 Hours</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Zero Chemical Residue</span>
              </div>
              <div className="flex items-center gap-2">
                <Baby className="w-4 h-4 text-pink-400" />
                <span>Safe for Kids & Pets</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-card border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
          >
            {[
              { value: "2hrs", label: "Fastest Turnaround", color: "text-primary" },
              { value: "95%", label: "Water Extracted Instantly", color: "text-cyan-500" },
              { value: "0%", label: "Chemical Residue", color: "text-purple-500" },
              { value: "5,000+", label: "Carpets Cleaned", color: "text-emerald-500" },
            ].map((item) => (
              <motion.div key={item.label} variants={scaleIn} className="space-y-1">
                <p className={`text-3xl sm:text-4xl font-serif font-bold ${item.color}`} data-testid={`text-stat-${item.label.replace(/\s+/g, '-').toLowerCase()}`}>
                  {item.value}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">{item.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="technology" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp}>
              <Badge variant="outline" className="mb-4 text-xs px-4 py-1">Our Technology</Badge>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold" data-testid="text-tech-title">
              Why Our Cleaning Is <span className="text-primary">Different</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-muted-foreground max-w-2xl mx-auto text-lg">
              We don't just clean the surface. Our proprietary extraction technology goes deep to restore your carpet from the foundation up.
            </motion.p>
          </motion.div>

          <div className="space-y-20">
            {technologies.map((tech, i) => (
              <motion.div
                key={tech.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={stagger}
                className={`grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${i % 2 === 1 ? "lg:direction-rtl" : ""}`}
              >
                <motion.div variants={fadeUp} className={i % 2 === 1 ? "lg:order-2" : ""}>
                  <Badge variant="secondary" className="mb-4 text-xs">{tech.badge}</Badge>
                  <h3 className="text-2xl sm:text-3xl font-serif font-bold mb-2" data-testid={`text-tech-${tech.id}`}>
                    {tech.title}
                  </h3>
                  <p className="text-sm font-medium text-primary mb-4">{tech.subtitle}</p>
                  <p className="text-muted-foreground leading-relaxed text-base mb-6">
                    {tech.description}
                  </p>
                  {tech.id === "zero-residue" && (
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Baby className="w-5 h-5 text-pink-500" />
                        <span>Safe for Babies</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Dog className="w-5 h-5 text-amber-500" />
                        <span>Safe for Pets</span>
                      </div>
                    </div>
                  )}
                  <Button size="lg" onClick={() => navigate("/book")} data-testid={`button-estimate-${tech.id}`}>
                    Get a Free Estimate <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </motion.div>

                <motion.div variants={scaleIn} className={`relative ${i % 2 === 1 ? "lg:order-1" : ""}`}>
                  <div className={`relative rounded-2xl overflow-hidden ${tech.bgGlow} p-8 sm:p-12`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/5" />
                    <div className="relative text-center">
                      <motion.div
                        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br ${tech.gradient} flex items-center justify-center mx-auto mb-6 shadow-xl`}
                        whileHover={{ scale: 1.05, rotate: 2 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <tech.icon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                      </motion.div>
                      <p className={`text-5xl sm:text-6xl font-serif font-bold bg-gradient-to-br ${tech.gradient} bg-clip-text text-transparent`}>
                        {tech.stat}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2 font-medium">{tech.statLabel}</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <BeforeAfterGallery />

      <section id="how-it-works" className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs px-4 py-1">Simple Process</Badge>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold" data-testid="text-how-title">How It Works</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              From estimate to delivery, we make the entire process seamless. No login required to get started.
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
                className="text-center relative"
              >
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
                )}
                <motion.div
                  className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold font-serif relative z-10"
                  whileHover={{ scale: 1.1 }}
                >
                  {s.step}
                </motion.div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialsCarousel />

      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="absolute w-64 h-64 rounded-full bg-primary/8 blur-3xl top-0 right-0" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mb-4" data-testid="text-cta-title">
              Ready for Carpets That Feel{" "}
              <span className="text-primary">Brand New</span>?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground mb-8 max-w-xl mx-auto text-lg">
              Get your free estimate in under 2 minutes. No login required — just tell us about your carpets and we'll handle the rest.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3 justify-center">
              <Button size="lg" onClick={() => navigate("/book")} className="text-base px-8 h-13 shadow-lg shadow-primary/25" data-testid="button-cta-estimate">
                Get a Free Estimate <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <a href={`tel:${PHONE_NUMBER}`}>
                <Button size="lg" variant="outline" className="text-base h-13" data-testid="button-cta-call">
                  <Phone className="mr-2 w-4 h-4" /> {PHONE_NUMBER}
                </Button>
              </a>
            </motion.div>
            <motion.p variants={fadeUp} className="mt-6 text-sm text-muted-foreground">
              Or chat with us on{" "}
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="text-green-600 font-medium hover:underline" data-testid="link-whatsapp-cta">
                WhatsApp
              </a>{" "}
              for instant answers
            </motion.p>
          </motion.div>
        </div>
      </section>

      <footer className="border-t py-12 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <span className="font-serif font-bold">CarpetPro Executive</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Nairobi's premium carpet cleaning service using proprietary deep extraction technology.
              </p>
            </div>
            <div>
              <p className="font-semibold text-sm mb-3">Contact</p>
              <div className="space-y-2 text-sm text-slate-400">
                <a href={`tel:${PHONE_NUMBER}`} className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone className="w-4 h-4" /> {PHONE_NUMBER}
                </a>
                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-green-400 transition-colors">
                  <MessageCircle className="w-4 h-4" /> WhatsApp Chat
                </a>
              </div>
            </div>
            <div>
              <p className="font-semibold text-sm mb-3">Quick Links</p>
              <div className="space-y-2 text-sm text-slate-400">
                <a href="#technology" className="block hover:text-white transition-colors">Our Technology</a>
                <a href="#how-it-works" className="block hover:text-white transition-colors">How It Works</a>
                <button onClick={() => navigate("/book")} className="block hover:text-white transition-colors">Get Free Estimate</button>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center">
            <p className="text-sm text-slate-500">
              &copy; 2026 CarpetPro Executive. All rights reserved. Nairobi, Kenya.
            </p>
          </div>
        </div>
      </footer>

      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50"
        data-testid="button-whatsapp-fab"
      >
        <motion.div
          className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30 hover:bg-green-600 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </motion.div>
      </a>
    </div>
  );
}
