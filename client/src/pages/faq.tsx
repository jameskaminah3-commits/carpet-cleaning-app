import { HelpCircle, MessageCircle } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const WHATSAPP_LINK = `https://wa.me/254745016805?text=${encodeURIComponent("Hi Sparkle n' Glee!")}`;

export default function FAQ() {
  return (
    <>
      <Navbar />

      <div className="max-w-5xl mx-auto py-16 px-6 md:py-24 bg-gradient-to-b from-blue-50 to-white rounded-xl">

        {/* HEADER */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <HelpCircle className="w-10 h-10 text-primary" />
          </div>

          <h1 className="text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h1>

          <p className="text-muted-foreground max-w-2xl mx-auto">
            Here are some common questions customers ask about our carpet
            cleaning services across Nairobi and Kiambu.
          </p>
        </div>

        {/* FAQ GRID */}
        <div className="grid md:grid-cols-2 gap-8">

          <div className="bg-muted/30 p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">
              How long does carpet cleaning and drying take?
            </h3>
            <p className="text-muted-foreground">
              Most carpets take as less as 2 hours depending on the
              size of carpets being cleaned.
            </p>
          </div>

          <div className="bg-muted/30 p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">
              How do you ensure my carpet is dry within such a short time?
            </h3>
            <p className="text-muted-foreground">
              Thanks to our powerful extraction process, which removes upto 95% of water.
            </p>
          </div>

          <div className="bg-muted/30 p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">
              Do I have to bring my carpet to the premises?
            </h3>
            <p className="text-muted-foreground">
              It's optional. We do have pick up and delivery services within Nairobi and Kiambu areas. If you would 
              like it picked up and delivered,
              let us know. 
            </p>
          </div>

          <div className="bg-muted/30 p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">
              Does your cleaning helps remove stains and odor?
            </h3>
            <p className="text-muted-foreground">
              Yes. Our cleaning solutions and process are highly effectively in removing 
              stains and odor.
            </p>
          </div>

          <div className="bg-muted/30 p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">
              Do you offer same-day service?
            </h3>
            <p className="text-muted-foreground">
              Yes, same-day service is available.
            </p>
          </div>

          <div className="bg-muted/30 p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">
              Which areas do you serve?
            </h3>
            <p className="text-muted-foreground">
              Currently we serve homes and businesses within Nairobi and Kiambu enviroments.
            </p>
          </div>

        </div>

        {/* CTA */}
        <div className="text-center mt-16 bg-primary/5 p-10 rounded-xl">
          <p className="text-lg text-muted-foreground mb-6">
            Still have questions?
          </p>

          <a
            href="/book"
            className="inline-block bg-primary text-primary-foreground px-8 py-4 rounded-lg font-medium hover:bg-primary/90 transition"
          >
            Book Your Carpet Cleaning
          </a>
        </div>

        {/* WHATSAPP HELP */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Prefer to ask directly?
          </p>

          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition"
          >
            <MessageCircle className="w-5 h-5" />
            Chat with us on WhatsApp
          </a>
        </div>

      </div>

      <Footer />
    </>
  );
}