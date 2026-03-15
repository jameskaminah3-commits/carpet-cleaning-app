import { Sparkles, Star, Zap, Clock, Wind, ShieldCheck } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function About() {
  return (
    <>
      <Navbar />

      <div className="max-w-5xl mx-auto py-16 px-6 md:py-24 bg-gradient-to-b from-blue-50 to-white rounded-xl">

      {/* HERO */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          Bringing Freshness Back to Homes Across Nairobi & Kiambu
        </h1>

        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Sparkle n' Glee delivers professional carpet and upholstery cleaning
          powered by advanced deep-extraction technology — restoring freshness,
          removing stubborn stains, and leaving carpets beautifully revived.
        </p>
      </div>

{/* CREDIBILITY STRIP */}
<div className="flex flex-wrap justify-center gap-8 mb-16 text-sm">

  <div className="flex items-center gap-2 text-muted-foreground">
    <Star className="w-4 h-4 text-yellow-500" />
    Trusted by Nairobi & Kiambu homes & Offices
  </div>

  <div className="flex items-center gap-2 text-muted-foreground">
    <Zap className="w-4 h-4 text-cyan-500" />
    95% water extraction technology
  </div>

  <div className="flex items-center gap-2 text-muted-foreground">
    <Clock className="w-4 h-4 text-emerald-500" />
    Fast same-day service available
  </div>

</div>

      {/* TRUST STRIP */}
      <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground mb-16">

        <span className="flex items-center gap-2">
          ✔ Serving Nairobi & Kiambu
        </span>

        <span className="flex items-center gap-2">
          ✔ Fast 2-Hour Drying
        </span>

        <span className="flex items-center gap-2">
          ✔ Safe for Kids & Pets
        </span>

        <span className="flex items-center gap-2">
          ✔ Professional Deep Cleaning
        </span>

      </div>


      {/* MISSION */}
      <section className="mb-16">
        <h2 className="text-3xl font-semibold mb-6">Our Mission</h2>

        <p className="text-muted-foreground leading-relaxed mb-6">
          We believe every home deserves clean, fresh, and hygienic carpets.
          At Sparkle n' Glee, our mission is to make professional carpet
          cleaning simple, reliable, and accessible for families and
          businesses across Nairobi and Kiambu.
        </p>

        <p className="text-muted-foreground leading-relaxed">
          Using powerful automatic deep-extraction equipment and
          eco-friendly cleaning solutions, we remove embedded dirt,
          stains, and allergens while protecting the comfort and
          safety of your home.
        </p>
      </section>


      {/* FEATURES */}
      <section className="mb-16 bg-muted/30 p-10 rounded-xl">

        <h2 className="text-3xl font-semibold mb-10 text-center">
          Why Customers Choose Sparkle n' Glee
        </h2>

        <div className="grid md:grid-cols-3 gap-8">

          {/* Feature 1 */}
          <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary/10 mb-4">
              <Sparkles className="text-primary w-6 h-6" />
            </div>

            <h3 className="text-xl font-semibold mb-2">
              Deep Extraction Technology
            </h3>

            <p className="text-muted-foreground">
              Our advanced automatic machines remove deep-seated dirt,
              stains, and allergens that normal cleaning methods
              simply can't reach.
            </p>
          </div>


          {/* Feature 2 */}
          <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-cyan-500/10 mb-4">
              <Wind className="text-cyan-500 w-6 h-6" />
            </div>

            <h3 className="text-xl font-semibold mb-2">
              Fast Drying Results
            </h3>

            <p className="text-muted-foreground">
              With up to 95% water extraction, carpets dry quickly —
              often within just a few hours — so your home returns to
              normal faster.
            </p>
          </div>


          {/* Feature 3 */}
          <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-emerald-500/10 mb-4">
              <ShieldCheck className="text-emerald-500 w-6 h-6" />
            </div>

            <h3 className="text-xl font-semibold mb-2">
              Safe for Families & Pets
            </h3>

            <p className="text-muted-foreground">
              We use safe cleaning solutions that leave no harmful
              residue, ensuring your carpets stay fresh and safe
              for everyone in your home.
            </p>
          </div>

        </div>
      </section>


      {/* LOCAL TRUST */}
      <section className="mb-16">
        <h2 className="text-3xl font-semibold mb-6">
          Proudly Serving Nairobi & Kiambu
        </h2>

        <p className="text-muted-foreground leading-relaxed mb-6">
          From apartments in Westlands and Kilimani to homes in
          Karen, Ruiru, and Thika — Sparkle n' Glee proudly serves
          households and businesses throughout the Nairobi and
          Kiambu region.
        </p>

        <p className="text-muted-foreground leading-relaxed">
          We are committed to delivering reliable service,
          transparent pricing, and outstanding results on
          every job — no matter the size.
        </p>
      </section>


      {/* CTA */}
      <div className="text-center bg-primary/5 p-10 rounded-xl">

        <p className="text-lg text-muted-foreground mb-6">
          Ready to restore freshness to your carpets?
        </p>

        <a
          href="/book"
          className="inline-block bg-primary text-primary-foreground px-8 py-4 rounded-lg font-medium text-lg hover:bg-primary/90 transition"
        >
          Get Your Free Quote
        </a>

      </div>

      </div>

      <Footer />
    </>
  );
}