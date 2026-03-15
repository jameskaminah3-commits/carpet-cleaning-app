import { ShieldCheck } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function Privacy() {
  return (
    <>
      <Navbar />

      <div className="max-w-5xl mx-auto py-16 px-6 md:py-24 bg-gradient-to-b from-blue-50 to-white rounded-xl">

        {/* HEADER */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>

          <h1 className="text-4xl font-bold mb-4">
            Privacy Policy
          </h1>

          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your privacy is important to us. This policy explains how
            Sparkle n' Glee collects, uses, and protects your information
            when you use our services.
          </p>
        </div>

        {/* POLICY CONTENT */}
        <div className="space-y-10 text-muted-foreground leading-relaxed">

          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Information We Collect
            </h2>

            <p>
              When you book a service with Sparkle n' Glee, we may collect
              basic information necessary to process your request including
              your name, phone number, email, service address, and booking
              details.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              How We Use Your Information
            </h2>

            <p>
              The information you provide is used strictly to deliver our
              carpet cleaning services, manage bookings, and communicate
              with you about your appointment.
            </p>

            <p className="mt-3">
              We may also use your contact details to provide service
              updates or respond to customer support inquiries.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Information Sharing
            </h2>

            <p>
              Sparkle n' Glee does not sell, rent, or trade your personal
              information to third parties.
            </p>

            <p className="mt-3">
              Information may only be shared where necessary to process
              payments, comply with legal requirements, or deliver
              requested services.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Data Security
            </h2>

            <p>
              We take reasonable steps to protect your personal information
              and ensure it is handled securely. Access to customer data is
              limited to authorized personnel involved in providing our
              services.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Contact Us
            </h2>

            <p>
              If you have questions about this privacy policy or how your
              information is handled, please contact Sparkle n' Glee through
              our website or WhatsApp support.
            </p>
          </div>

        </div>

        {/* FOOTNOTE */}
        <div className="mt-16 text-sm text-muted-foreground text-center">
          Last updated: {new Date().getFullYear()}
        </div>

      </div>

      <Footer />
    </>
  );
}