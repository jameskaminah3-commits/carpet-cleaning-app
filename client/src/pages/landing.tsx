import { useMemo, useState, useEffect, useCallback } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Phone,
  Star,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Shield,
  Droplets,
  Wind,
  Bug,
  Home,
  Baby,
  Dog,
  Zap,
  Timer,
  Award,
  MessageCircle,
  Menu,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Review, User, Media } from "@shared/schema";
import logoClear from "@assets/Logos.png";
import imgSisalJute from "@assets/Sisal_Jute_1771953293164.jpg";
import imgPersian from "@assets/persian_oriental_1771953293167.jpg";
import imgFrieze from "@assets/frieze_carpet_1771953293167.jpg";
import imgBerber from "@assets/berber-carpet_1771953293168.jpg";
import imgShag from "@assets/Shag_carpet_1771953293168.jpg";
import imgWallToWall from "@assets/wall_to_wall_carpet_1771953293169.jpg";
import imgFluffy from "@assets/fluffy_carpet_1771953293170.jpeg";
import imgSilk from "@assets/silk_carpets_1771953315954.webp";

const PHONE_NUMBER = "0745016805";
const WHATSAPP_LINK = `https://wa.me/254745016805?text=${encodeURIComponent("Hi Sparkle n' Glee! I'd like to get a free estimate for carpet cleaning.")}`;

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

function SparkleStarSVG({
  size = 16,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

function HeroBackground() {
  const sparkles = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => ({
        left: `${3 + ((i * 3.9) % 94)}%`,
        top: `${3 + ((i * 4.1) % 90)}%`,
        size: 3 + (i % 5) * 2,
        duration: `${3 + (i % 5) * 1.5}s`,
        delay: `${(i * 0.4) % 8}s`,
      })),
    [],
  );

  return (
    <div className="absolute inset-0">
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/hero-video-poster.jpg"
        className="absolute inset-0 w-full h-full object-cover"
        aria-hidden="true"
        data-testid="video-hero-background"
      >
        <source src="/hero-video.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-[#AED6F1]/35" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#3A86E9]/50 via-[#3A86E9]/10 to-[#1a1a2e]/15" />

      {sparkles.map((s, i) => (
        <motion.div
          key={i}
          className="absolute text-white/40"
          style={{ left: s.left, top: s.top }}
          animate={{
            opacity: [0, 0.6, 0],
            scale: [0.3, 1, 0.3],
          }}
          transition={{
            duration: parseFloat(s.duration),
            delay: parseFloat(s.delay),
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <SparkleStarSVG size={s.size * 3} />
        </motion.div>
      ))}
    </div>
  );
}

const technologies = [
  {
    id: "no-damp",
    badge: "Dry & Ready Fast",
    title: "Back Home Dry & Ready in Hours",
    subtitle: "No Waiting!",
    description:
      "We use powerful suction to pull out almost all the water right away (up to 95%). Your carpet dries super fast — no damp smell, no mould worries, and you can walk on it or let the kids play almost immediately.",
    stat: "95%",
    statLabel: "Water Extracted Instantly",
    icon: Wind,
    gradient: "from-cyan-500 to-blue-600",
    bgGlow: "bg-cyan-500/10",
  },
  {
    id: "dust",
    badge: "Heavy-Duty Power",
    title: "Super Strong Cleaning for even the Tougher Dirt",
    subtitle: "10× More Powerful",
    description:
      "Our machines are 10× stronger than your home vacuum. They suck out deep-down red soil, dust, and grime that normal cleaners miss — your carpet looks and feels brand new.",
    stat: "10x",
    statLabel: "More Powerful Than Home Vacuums",
    icon: Zap,
    gradient: "from-[#6ED3FF] to-[#3A86E9]",
    bgGlow: "bg-sky-500/10",
  },
  {
    id: "deep-fiber",
    badge: "Deep Clean",
    title: "Cleans Right Down to the Roots",
    subtitle: "Every Fibre, Top to Bottom",
    description:
      "We don't just clean the top — we get to the bottom of every fibre, pulling out hidden dirt, sand, and allergens so your carpet stays fresh longer.",
    stat: "100%",
    statLabel: "Fiber Depth Penetration",
    icon: Bug,
    gradient: "from-emerald-500 to-green-600",
    bgGlow: "bg-emerald-500/10",
  },
  {
    id: "zero-residue",
    badge: "Safe for Everyone",
    title: "Completely Safe for Kids & Pets",
    subtitle: "Nothing Left Behind",
    description:
      "We rinse everything out properly so zero soap or chemicals stay in your carpet. It's soft, fresh, and 100% safe for babies crawling or pets rolling around — no irritation, no worries.",
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
    text: "Living near a construction site, the red soil was embedded deep in my Persian rug. Sparkle n' Glee's deep extraction brought back colors I'd forgotten existed.",
    rating: 5,
  },
  {
    name: "Amina O.",
    location: "Kilimani, Nairobi",
    text: "With a toddler and two cats, chemical-free cleaning was non-negotiable. Sparkle n' Glee delivered — the carpet felt softer than when we first bought it!",
    rating: 5,
  },
  {
    name: "Peter N.",
    location: "Lavington, Nairobi",
    text: "Our office carpets hadn't been properly cleaned in years. Sparkle n' Glee revived them in a single visit — the entire floor looks brand new. Highly recommend for corporate clients.",
    rating: 5,
  },
  {
    name: "Grace W.",
    location: "Runda, Nairobi",
    text: "I've tried 4 different cleaning services. Sparkle n' Glee is the only one that didn't leave my silk carpet feeling stiff. They understand premium fabrics.",
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
  {
    step: "1",
    title: "Get Free Estimate",
    desc: "Tell us your carpet type and dimensions — no login needed, no obligations",
  },
  {
    step: "2",
    title: "We Pick Up",
    desc: "Our team collects your carpets from your doorstep at your preferred time",
  },
  {
    step: "3",
    title: "Deep Extraction",
    desc: "Industrial-grade cleaning with our proprietary vortex extraction technology",
  },
  {
    step: "4",
    title: "Ready to Use",
    desc: "Carpets returned dry, fresh, and ready to walk on — as fast as 2 hours",
  },
];

function BeforeAfterGallery() {
  const { data: publicMedia = [] } = useQuery<Media[]>({
    queryKey: ["/api/media/public"],
  });
  const [lightbox, setLightbox] = useState<{
    src: string;
    isVideo: boolean;
    title: string;
    subtitle: string;
  } | null>(null);

  const slides = useMemo(() => {
    if (publicMedia.length === 0) return [];
    return publicMedia.map((item) => ({
      id: item.id,
      src: item.fileKey,
      isVideo: item.mimeType.startsWith("video"),
      title: item.title,
      subtitle: item.subtitle || "",
    }));
  }, [publicMedia]);

  const observerRef = { current: null as ResizeObserver | null };
  const trackRef = useCallback(
    (node: HTMLDivElement | null) => {
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
        const setWidth = childWidth * Math.max(slides.length, 1);
        node.style.setProperty("--single-set-width", `${setWidth}px`);
      };
      measure();
      observerRef.current = new ResizeObserver(measure);
      observerRef.current.observe(node);
    },
    [slides.length],
  );

  if (slides.length === 0) return null;

  const trackItems =
    slides.length >= 3 ? [...slides, ...slides, ...slides] : [...slides];

  return (
    <>
      <section
        className="py-20 sm:py-24 bg-gradient-to-b from-[#EBF3FF] via-white to-white relative overflow-hidden"
        data-testid="section-before-after"
      >
        <div className="absolute w-80 h-80 rounded-full bg-primary/8 blur-3xl -top-20 -right-20" />
        <div className="absolute w-64 h-64 rounded-full bg-[#5EE6A8]/8 blur-3xl bottom-0 left-10" />

        <div className="relative z-10">
          <div className="text-center mb-12 px-4 sm:px-6 lg:px-8">
            <Badge variant="secondary" className="mb-4 text-xs">
              Real Results
            </Badge>
            <h2
              className="text-3xl sm:text-4xl font-bold text-foreground"
              data-testid="text-before-after-title"
            >
              Before & <span className="text-primary">After</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              See the sparkling difference we make. Every carpet tells a
              transformation story.
            </p>
          </div>

          <div className="overflow-hidden">
            <div
              ref={trackRef}
              className={`flex gap-6 ${slides.length >= 3 ? "gallery-scroll-track" : "justify-center"}`}
              style={
                slides.length >= 3
                  ? { ["--duration" as string]: `${slides.length * 5}s` }
                  : undefined
              }
            >
              {trackItems.map((slide, i) => (
                <div
                  key={`${slide.id}-${i}`}
                  className="flex-shrink-0 w-[280px] sm:w-[340px] lg:w-[400px] cursor-pointer group"
                  onClick={() => setLightbox(slide)}
                  data-testid={`gallery-item-${i}`}
                >
                  {slide.isVideo ? (
                    <div className="rounded-xl overflow-hidden relative">
                      <video
                        src={slide.src}
                        className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        data-testid={`video-gallery-${i}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                      <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                        VIDEO
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl overflow-hidden relative">
                      <img
                        src={slide.src}
                        alt={slide.title}
                        className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mt-3 text-center">
                    <p
                      className="font-semibold text-sm text-foreground"
                      data-testid={`text-gallery-title-${i}`}
                    >
                      {slide.title}
                    </p>
                    {slide.subtitle && (
                      <p
                        className="text-xs text-muted-foreground"
                        data-testid={`text-gallery-subtitle-${i}`}
                      >
                        {slide.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-10 px-4">
            <p className="text-muted-foreground text-xs">
              Trusted by 5,000+ Nairobi homes and offices
            </p>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
            onClick={() => setLightbox(null)}
            data-testid="lightbox-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setLightbox(null)}
                className="absolute -top-2 -right-2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                data-testid="button-close-lightbox"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              {lightbox.isVideo ? (
                <video
                  src={lightbox.src}
                  className="w-full max-h-[75vh] rounded-xl object-contain"
                  autoPlay
                  loop
                  controls
                  playsInline
                  preload="auto"
                  data-testid="lightbox-video"
                />
              ) : (
                <img
                  src={lightbox.src}
                  alt={lightbox.title}
                  className="w-full max-h-[75vh] rounded-xl object-contain"
                  data-testid="lightbox-image"
                />
              )}

              <div className="mt-4 text-center">
                <h3
                  className="text-white font-semibold text-lg"
                  data-testid="lightbox-title"
                >
                  {lightbox.title}
                </h3>
                {lightbox.subtitle && (
                  <p
                    className="text-white/60 text-sm mt-1"
                    data-testid="lightbox-subtitle"
                  >
                    {lightbox.subtitle}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { data: publicReviews = [] } = useQuery<
    (Review & { customer?: User })[]
  >({ queryKey: ["/api/reviews/public"] });

  const allTestimonials = useMemo(() => {
    const real = publicReviews.map((r) => ({
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
    setCurrent(
      (prev) => (prev - 1 + allTestimonials.length) % allTestimonials.length,
    );
  }, [allTestimonials.length]);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  const getVisibleIndices = () => {
    const indices = [];
    for (let i = -1; i <= 1; i++) {
      indices.push(
        (current + i + allTestimonials.length) % allTestimonials.length,
      );
    }
    return indices;
  };

  const visible = getVisibleIndices();

  return (
    <section
      id="testimonials"
      className="py-20 sm:py-24 bg-card overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4 text-xs px-4 py-1">
            Client Stories
          </Badge>
          <h2
            className="text-3xl sm:text-4xl font-sans font-bold"
            data-testid="text-reviews-title"
          >
            What Our Clients Say
          </h2>
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
                          <Star
                            key={i}
                            className="w-4 h-4 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                      <p
                        className="text-sm leading-relaxed mb-4 text-muted-foreground italic"
                        data-testid={`text-testimonial-${idx}`}
                      >
                        "{t.text}"
                      </p>
                      <div>
                        <p className="font-semibold text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.location}
                        </p>
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
                    {Array.from({
                      length: allTestimonials[current]?.rating || 5,
                    }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-4 text-muted-foreground italic">
                    "{allTestimonials[current]?.text}"
                  </p>
                  <div>
                    <p className="font-semibold text-sm">
                      {allTestimonials[current]?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {allTestimonials[current]?.location}
                    </p>
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
                    i === current
                      ? "bg-primary w-6"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activityLocations = [
  "Westlands",
  "Kilimani",
  "Karen",
  "Lavington",
  "Thindigua",
  "Runda",
  "Kahawa Sukari",
  "Kiambu",
  "Roysambu",
  "Kamuru",
  "Membley Estate",
  "Mwiki",
  "Joska",
  "Mihango",
  "Garden Estate",
  "Ruai",
  "Githurai",
  "Ruaka",
  "Thome Estate",
  "Umoja",
  "Juja",
  "Thika Rd",
  "Buruburu",
  "Kahawa Wendani",
  "Thika Town",
  "Parklands",
  "Ngong",
  "Kamarock",
  "Kasarani",
  "Zimmerman",
  "Kileleshwa",
  "Fedha Estate",
  "South B",
  "Kinoo",
  "CBD",
  "Dohnholm",
  "Kayole",
  "Langata",
];
const [carpetsCleaned, setCarpetsCleaned] = useState(2634);
const [activityLocation, setActivityLocation] = useState(activityLocations[0]);

useEffect(() => {
  const updateActivity = () => {
    setCarpetsCleaned((prev) => prev + Math.floor(Math.random() * 3));

    const random =
      activityLocations[Math.floor(Math.random() * activityLocations.length)];

    setActivityLocation(random);

    const nextDelay = Math.floor(Math.random() * 40000) + 20000; 
    setTimeout(updateActivity, nextDelay);
  };

  updateActivity();
}, []);
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2 h-16">
<div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
  <img
    src="/rlogo.jpg"
    alt="Sparkle n' Glee"
    className="h-14 sm:h-16 w-auto"
  />
</div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a
              href="#our-process"
              className="hover:text-foreground transition-colors"
              data-testid="link-our-process"
            >
              Our Process
            </a>
            <a
              href="#how-it-works"
              className="hover:text-foreground transition-colors"
              data-testid="link-how-it-works"
            >
              How It Works
            </a>
            <a
              href="#testimonials"
              className="hover:text-foreground transition-colors"
              data-testid="link-testimonials"
            >
              Reviews
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex rounded-full"
              onClick={() => navigate("/login")}
              data-testid="button-login"
            >
              Sign In
            </Button>
            <button
              onClick={() => navigate("/book")}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-white px-5 py-2 rounded-full bg-gradient-to-r from-[#2E77D0] to-[#3A86E9] shadow-md hover:scale-105 transition-all duration-200"
              data-testid="button-book-now"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Free Quote
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-mobile-menu"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t bg-background"
              id="mobile-nav-menu"
              data-testid="mobile-menu"
            >
              <div className="px-4 py-4 space-y-3">
                <a
                  href="#our-process"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="link-our-process-mobile"
                >
                  Our Process
                </a>
                <a
                  href="#how-it-works"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="link-how-it-works-mobile"
                >
                  How It Works
                </a>
                <a
                  href="#testimonials"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="link-testimonials-mobile"
                >
                  Reviews
                </a>
                <div className="pt-2 flex flex-col gap-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-full"
                    onClick={() => { setMobileMenuOpen(false); navigate("/login"); }}
                    data-testid="button-login-mobile"
                  >
                    Sign In
                  </Button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); navigate("/book"); }}
                    className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-white px-5 py-2 rounded-full bg-gradient-to-r from-[#2E77D0] to-[#3A86E9] shadow-md"
                    data-testid="button-book-now-mobile"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Free Quote
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <HeroBackground />

        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 0.5,
            duration: 0.8,
            type: "spring",
            damping: 18,
          }}
          className="absolute inset-0 z-[5] pointer-events-none overflow-hidden"
        >
          <motion.div
            className="absolute top-[12%] right-[8%] sm:top-[10%] sm:right-[12%] text-white/30"
            animate={{ opacity: [0, 0.8, 0], scale: [0.4, 1.1, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.3 }}
          >
            <SparkleStarSVG size={14} />
          </motion.div>
          <motion.div
            className="absolute top-[30%] left-[5%] sm:top-[25%] sm:left-[8%] text-[#5EE6A8]/35"
            animate={{ opacity: [0, 0.7, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 3.5, repeat: Infinity, delay: 1.0 }}
          >
            <SparkleStarSVG size={10} />
          </motion.div>
          <motion.div
            className="absolute bottom-[20%] right-[15%] sm:bottom-[25%] sm:right-[20%] text-[#6ED3FF]/30"
            animate={{ opacity: [0, 0.9, 0], scale: [0.3, 1.2, 0.3] }}
            transition={{ duration: 2.8, repeat: Infinity, delay: 0.7 }}
          >
            <SparkleStarSVG size={18} />
          </motion.div>
          <motion.div
            className="absolute bottom-[35%] left-[12%] sm:bottom-[30%] sm:left-[15%] text-white/25"
            animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, delay: 1.8 }}
          >
            <SparkleStarSVG size={8} />
          </motion.div>
          <motion.div
            className="absolute top-[55%] right-[5%] sm:top-[50%] sm:right-[6%] text-[#C8A2F8]/25"
            animate={{ opacity: [0, 0.7, 0], scale: [0.4, 1, 0.4] }}
            transition={{ duration: 3.2, repeat: Infinity, delay: 2.2 }}
          >
            <SparkleStarSVG size={12} />
          </motion.div>

          <motion.img
            src={logoClear}
            alt="Sparkle n' Glee mascot"
            className="absolute top-1/2 left-1/2 w-[100px] sm:w-[140px] lg:w-[200px] h-auto drop-shadow-2xl"
            style={{ marginTop: "-50px", marginLeft: "-50px" }}
            animate={{
              x: [
                "30vw",
                "-25vw",
                "-25vw",
                "20vw",
                "20vw",
                "-35vw",
                "-35vw",
                "10vw",
                "10vw",
                "30vw",
              ],
              y: [
                "-30vh",
                "15vh",
                "15vh",
                "-35vh",
                "-35vh",
                "10vh",
                "10vh",
                "-20vh",
                "-20vh",
                "-30vh",
              ],
              opacity: [0.85, 0.1, 0.9, 0.08, 0.85, 0.1, 0.9, 0.08, 0.85, 0.85],
              scale: [1, 0.4, 1, 0.35, 1, 0.4, 1, 0.35, 1, 1],
              rotate: [0, 15, -5, -12, 3, 18, -8, -15, 5, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            data-testid="img-hero-mascot"
          />
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 w-full">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-2xl"
          >
            <motion.div variants={fadeUp}>
              <Badge
                variant="secondary"
                className="mb-5 text-xs font-medium bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-1.5 rounded-full"
                data-testid="badge-hero-tag"
              >
                <Sparkles className="w-3 h-3 mr-1.5" />
                Sparkling, Spotless, Fast
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="font-bold text-white leading-[1.12] tracking-tight"
              style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
              data-testid="text-hero-title"
            >
              Carpets So Clean, <br className="hidden sm:block" />
              They Practically{" "}
              <span className="relative inline-block">
                <span className="text-[#5EE6A8]">Sparkle</span>
                <motion.span
                  className="absolute -bottom-1.5 left-0 right-0 h-[3px] bg-[#5EE6A8]/60 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                />
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-5 text-base sm:text-lg text-white/85 max-w-lg leading-relaxed"
              data-testid="text-hero-subtitle"
            >
              We deep-clean your carpets, remove stubborn dirt and allergens —
              and return them fresh, dry and ready to enjoy in as little as{" "}
              <strong className="text-white font-semibold">2 hours</strong>.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/book")}
                className="inline-flex items-center gap-2 text-base font-semibold text-white px-8 py-3.5 rounded-full bg-gradient-to-r from-[#2E77D0] to-[#3A86E9] shadow-lg shadow-blue-500/30 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200"
                data-testid="button-hero-estimate"
              >
                <Sparkles className="w-4 h-4" />
                Get My Free Quote
              </button>
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                <button
                  className="inline-flex items-center gap-2 text-base font-semibold text-white px-7 py-3.5 rounded-full bg-[#25D366] shadow-lg shadow-green-500/25 hover:scale-105 hover:shadow-xl hover:shadow-green-500/35 transition-all duration-200"
                  data-testid="button-hero-whatsapp"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat on WhatsApp
                </button>
              </a>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-6 flex flex-wrap gap-2 sm:gap-3"
            >
              {[
                {
                  icon: Zap,
                  label: "Book Online in Seconds",
                  color: "text-[#5EE6A8]",
                },
                {
                  icon: Timer,
                  label: "Track Cleaning in Real Time",
                  color: "text-[#6ED3FF]",
                },
                {
                  icon: Wind,
                  label: "Ready in as Little as 2 Hours",
                  color: "text-[#C8A2F8]",
                },
                {
                  icon: Shield,
                  label: "Secure Payment via M-Pesa",
                  color: "text-[#FFB3C6]",
                },
              ].map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-1.5 text-xs sm:text-sm text-white/90 bg-white/15 backdrop-blur-[8px] rounded-[20px] px-3 sm:px-4 py-1.5 sm:py-2 shadow-sm"
                  data-testid={`badge-${badge.label.replace(/\s+/g, "-").toLowerCase()}`}
                >
                  <badge.icon
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${badge.color}`}
                  />
                  <span>{badge.label}</span>
                </div>
              ))}
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
  {
    value: "2hrs",
    label: "Fastest Turnaround",
    color: "text-primary",
  },
  {
    value: "95%",
    label: "Water Extracted Instantly",
    color: "text-cyan-500",
  },
  {
    value: "0%",
    label: "Chemical Residue",
    color: "text-purple-500",
  },
].map((item) => (
  <motion.div
    key={item.label}
    variants={scaleIn}
    className="space-y-1"
  >
    <motion.p
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`text-3xl sm:text-4xl font-sans font-bold ${item.color}`}
      data-testid={`text-stat-${item.label.replace(/\s+/g, "-").toLowerCase()}`}
    >
      {item.value}
    </motion.p>

    <p className="text-xs sm:text-sm text-muted-foreground">
      {item.label}
    </p>
  </motion.div>
))}

{/* LIVE ACTIVITY STAT */}
<motion.div
  variants={scaleIn}
  className="space-y-1"
>
  <motion.p
    className="text-3xl sm:text-4xl font-sans font-bold text-emerald-500"
  >
    {carpetsCleaned.toLocaleString()}+
  </motion.p>

  <p className="text-xs sm:text-sm text-muted-foreground">
    Carpets sparkling soon in {activityLocation}
  </p>
</motion.div>

</motion.div>
</div>
      </section>

      <BeforeAfterGallery />

      <section
        id="carpet-types"
        className="py-20 sm:py-24 bg-gradient-to-b from-white to-[#EBF3FF]/40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.div variants={fadeUp}>
              <Badge variant="outline" className="mb-4 text-xs px-4 py-1">
                All Carpet Types
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="text-3xl sm:text-4xl font-sans font-bold"
              data-testid="text-carpet-types-title"
            >
              We Clean All Popular Types –{" "}
              <span className="text-primary">Yours Included!</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
          >
            {[
              {
                name: "Shag Carpet",
                img: imgShag,
                desc: "Deep-pile luxury — we restore volume & remove trapped dust.",
                color: "from-stone-50 to-neutral-50 border-stone-100",
              },
              {
                name: "Fluffy Carpet",
                img: imgFluffy,
                desc: "Lifts & fluffs long fibers, removes pet hair — no matting.",
                color: "from-purple-50 to-pink-50 border-purple-100",
              },
              {
                name: "Wall-to-Wall",
                img: imgWallToWall,
                desc: "Even deep clean for big rooms & offices — handles high traffic.",
                color: "from-blue-50 to-cyan-50 border-blue-100",
              },
              {
                name: "Persian / Oriental",
                img: imgPersian,
                desc: "Gentle on designs & wool — revives colors, lifts stains.",
                color: "from-amber-50 to-orange-50 border-amber-100",
              },
              {
                name: "Berber Carpet",
                img: imgBerber,
                desc: "Pulls embedded grime from loops — stays springy & clean.",
                color: "from-emerald-50 to-teal-50 border-emerald-100",
              },
              {
                name: "Frieze Carpet",
                img: imgFrieze,
                desc: "Twisted fibers refreshed — extracts deep dirt, restores bounce.",
                color: "from-sky-50 to-indigo-50 border-sky-100",
              },
              {
                name: "Sisal / Jute",
                img: imgSisalJute,
                desc: "Natural fiber care — gentle cleaning that preserves texture.",
                color: "from-yellow-50 to-amber-50 border-yellow-100",
              },
              {
                name: "Silk Carpet",
                img: imgSilk,
                desc: "Delicate luxury treatment — preserves sheen & intricate patterns.",
                color: "from-teal-50 to-cyan-50 border-teal-100",
              },
            ].map((carpet) => (
              <motion.div
                key={carpet.name}
                variants={fadeUp}
                className={`rounded-xl border bg-gradient-to-br ${carpet.color} overflow-hidden hover:shadow-lg transition-shadow duration-200`}
                data-testid={`card-carpet-${carpet.name.replace(/[\s\/]+/g, "-").toLowerCase()}`}
              >
                <div className="h-36 sm:h-40 overflow-hidden">
                  <img
                    src={carpet.img}
                    alt={carpet.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-4 sm:p-5">
                  <p className="font-semibold text-sm sm:text-base text-foreground mb-1">
                    {carpet.name}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {carpet.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mt-10"
          >
            <p className="text-muted-foreground text-sm sm:text-base mb-4">
              Unsure about your carpet type? WhatsApp us a photo —{" "}
              <span className="font-semibold text-foreground">
                free advice & quote in minutes!
              </span>
            </p>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/20 hover:scale-105 hover:shadow-xl transition-all duration-200"
              data-testid="button-carpet-types-whatsapp"
            >
              <MessageCircle className="w-4 h-4" />
              Send a Photo on WhatsApp
            </a>
          </motion.div>
        </div>
      </section>

      <section id="our-process" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp}>
              <Badge variant="outline" className="mb-4 text-xs px-4 py-1">
                Why We're Different
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold"
              data-testid="text-tech-title"
            >
              Why Your Carpet Comes Back{" "}
              <span className="text-primary">Better & Faster</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-4 text-muted-foreground max-w-2xl mx-auto text-lg"
            >
              No damp carpets, no chemical residue, no waiting around. Just a
              deep, thorough clean that's safe for your family and ready when
              you are.
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
                <motion.div
                  variants={fadeUp}
                  className={i % 2 === 1 ? "lg:order-2" : ""}
                >
                  <Badge variant="secondary" className="mb-4 text-xs">
                    {tech.badge}
                  </Badge>
                  <h3
                    className="text-2xl sm:text-3xl font-sans font-bold mb-2"
                    data-testid={`text-tech-${tech.id}`}
                  >
                    {tech.title}
                  </h3>
                  <p className="text-sm font-medium text-primary mb-4">
                    {tech.subtitle}
                  </p>
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
                  <button
                    onClick={() => navigate("/book")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-full bg-gradient-to-r from-[#2E77D0] to-[#3A86E9] shadow-lg shadow-blue-500/20 hover:scale-105 hover:shadow-xl transition-all duration-200"
                    data-testid={`button-estimate-${tech.id}`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Get a Free Quote
                  </button>
                </motion.div>

                <motion.div
                  variants={scaleIn}
                  className={`relative ${i % 2 === 1 ? "lg:order-1" : ""}`}
                >
                  <div
                    className={`relative rounded-2xl overflow-hidden ${tech.bgGlow} p-8 sm:p-12`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/5" />
                    <div className="relative text-center">
                      <motion.div
                        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br ${tech.gradient} flex items-center justify-center mx-auto mb-6 shadow-xl`}
                        whileHover={{ scale: 1.05, rotate: 2 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <tech.icon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                      </motion.div>
                      <p
                        className={`text-5xl sm:text-6xl font-sans font-bold bg-gradient-to-br ${tech.gradient} bg-clip-text text-transparent`}
                      >
                        {tech.stat}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2 font-medium">
                        {tech.statLabel}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs px-4 py-1">
              Simple Process
            </Badge>
            <h2
              className="text-3xl sm:text-4xl font-sans font-bold"
              data-testid="text-how-title"
            >
              How It Works
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              From estimate to delivery, we make the entire process seamless. No
              login required to get started.
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
                  className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold font-sans relative z-10"
                  whileHover={{ scale: 1.1 }}
                >
                  {s.step}
                </motion.div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
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
            <motion.h2
              variants={fadeUp}
              className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold mb-4"
              data-testid="text-cta-title"
            >
              Ready for Carpets That Feel{" "}
              <span className="text-primary">Brand New</span>?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-muted-foreground mb-8 max-w-xl mx-auto text-lg"
            >
              Get your free estimate in under 2 minutes. No login required —
              just tell us about your carpets and we'll handle the rest.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap gap-3 justify-center"
            >
              <button
                onClick={() => navigate("/book")}
                className="inline-flex items-center gap-2 text-base font-semibold text-white px-8 py-3.5 rounded-full bg-gradient-to-r from-[#2E77D0] to-[#3A86E9] shadow-lg shadow-blue-500/25 hover:scale-105 hover:shadow-xl transition-all duration-200"
                data-testid="button-cta-estimate"
              >
                <Sparkles className="w-4 h-4" />
                Get My Free Quote
              </button>
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                <button
                  className="inline-flex items-center gap-2 text-base font-semibold text-white px-7 py-3.5 rounded-full bg-[#25D366] shadow-lg shadow-green-500/20 hover:scale-105 hover:shadow-xl transition-all duration-200"
                  data-testid="button-cta-whatsapp"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat on WhatsApp
                </button>
              </a>
            </motion.div>
            <motion.p
              variants={fadeUp}
              className="mt-6 text-sm text-muted-foreground"
            >
              Or call us directly at{" "}
              <a
                href={`tel:${PHONE_NUMBER}`}
                className="text-primary font-medium hover:underline"
                data-testid="link-phone-cta"
              >
                {PHONE_NUMBER}
              </a>
            </motion.p>
          </motion.div>
        </div>
      </section>

      <footer className="border-t py-12 bg-gradient-to-b from-[#EBF3FF] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">

{/* BRAND */}
<div>
  <div className="flex items-center gap-2 mb-4">
    <img
      src={logoClear}
      alt="Sparkle n' Glee"
      className="h-12 w-auto drop-shadow-sm"
    />
  </div>

  <p className="text-sm text-muted-foreground leading-relaxed">
    Professional carpet cleaning across Nairobi & Kiambu.
    Powerful stain & odor removal. Fast drying. Family-safe cleaning.
  </p>

  <p className="text-xs text-muted-foreground mt-3">
    Trusted by homes across Nairobi & Kiambu.
  </p>
</div>

{/* CONTACT */}
<div>
  <p className="font-semibold text-sm mb-3 text-foreground">
    Contact
  </p>

  <div className="space-y-2 text-sm text-muted-foreground">
    <a
      href={`tel:${PHONE_NUMBER}`}
      className="flex items-center gap-2 hover:text-primary transition-colors"
    >
      <Phone className="w-4 h-4" /> {PHONE_NUMBER}
    </a>

    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 hover:text-green-500 transition-colors"
    >
      <MessageCircle className="w-4 h-4" /> WhatsApp Chat
    </a>

    <p className="text-xs text-muted-foreground mt-2">
      Serving Nairobi & Kiambu Areas
    </p>
  </div>
</div>

{/* COMPANY */}
<div>
  <p className="font-semibold text-sm mb-3 text-foreground">
    Company
  </p>

  <div className="space-y-2 text-sm text-muted-foreground">
    <a href="#" className="block hover:text-primary transition-colors">
      About Us
    </a>

    <a href="#" className="block hover:text-primary transition-colors">
      FAQs
    </a>

    <a href="#" className="block hover:text-primary transition-colors">
      Privacy Policy
    </a>

    <a href="#" className="block hover:text-primary transition-colors">
      Booking Terms
    </a>
  </div>
</div>

{/* SOCIAL */}
<div>
  <p className="font-semibold text-sm mb-3 text-foreground">
    Follow Us
  </p>

  <div className="space-y-2 text-sm text-muted-foreground">
    <a href="https://instagram.com" target="_blank" className="block hover:text-primary">
      Instagram
    </a>

    <a href="https://facebook.com" target="_blank" className="block hover:text-primary">
      Facebook
    </a>

    <a href="https://tiktok.com" target="_blank" className="block hover:text-primary">
      TikTok
    </a>
  </div>
</div>

</div>
          <div className="mt-8 pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              &copy; 2026 Sparkle n' Glee. All rights reserved. Nairobi, Kenya.
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
