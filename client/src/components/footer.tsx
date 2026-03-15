import { Phone, MessageCircle } from "lucide-react";
import { Link } from "wouter";

const PHONE_NUMBER = "0745016805";
const WHATSAPP_LINK = "https://wa.me/254745016805";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 py-14 grid gap-10 md:grid-cols-4">

        {/* BRAND */}
<div>
  <img
    src="Logos.png"
    alt="Sparkle n' Glee"
    className="h-12 w-auto mb-4"
  />

          <p className="text-sm text-muted-foreground leading-relaxed">
            Professional carpet cleaning across Nairobi & Kiambu.
            Powerful stain & odor removal. Fast drying. Family-safe cleaning.
          </p>

          <p className="text-sm text-muted-foreground mt-4">
            Trusted by homes across Nairobi & Kiambu.
          </p>
        </div>

        {/* CONTACT */}
        <div>
          <p className="font-semibold mb-4">Contact</p>

          <div className="space-y-3 text-sm text-muted-foreground">

            <a
              href={`tel:${PHONE_NUMBER}`}
              className="flex items-center gap-2 hover:text-primary transition"
            >
              <Phone className="w-4 h-4" />
              {PHONE_NUMBER}
            </a>

            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-green-500 transition"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Chat
            </a>

            <p>Serving Nairobi & Kiambu Areas</p>

          </div>
        </div>

        {/* COMPANY */}
        <div>
          <p className="font-semibold mb-4">Company</p>

          <div className="space-y-2 text-sm text-muted-foreground">

            <Link href="/about">
              <span className="block hover:text-primary transition">
                About Us
              </span>
            </Link>

            <Link href="/faq">
              <span className="block hover:text-primary transition">
                FAQs
              </span>
            </Link>

            <Link href="/privacy">
              <span className="block hover:text-primary transition">
                Privacy Policy
              </span>
            </Link>

            <Link href="/terms">
              <span className="block hover:text-primary transition">
                Booking Terms
              </span>
            </Link>

          </div>
        </div>

        {/* SOCIAL */}
        <div>
          <p className="font-semibold mb-4">Follow Us</p>

          <div className="space-y-2 text-sm text-muted-foreground">

            <a
              href="#"
              className="block hover:text-primary transition"
            >
              Instagram
            </a>

            <a
              href="#"
              className="block hover:text-primary transition"
            >
              Facebook
            </a>

            <a
              href="#"
              className="block hover:text-primary transition"
            >
              TikTok
            </a>

          </div>
        </div>

      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-border text-center py-6 text-sm text-muted-foreground">
        © {new Date().getFullYear()} Sparkle n' Glee. All rights reserved. Nairobi, Kenya.
      </div>
    </footer>
  );
}