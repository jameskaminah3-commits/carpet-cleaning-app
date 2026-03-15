import { FileText } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function Terms() {
  return (
    <>
      <Navbar />

      <div className="max-w-5xl mx-auto py-16 px-6 md:py-24 bg-gradient-to-b from-blue-50 to-white rounded-xl">

        {/* HEADER */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <FileText className="w-10 h-10 text-primary" />
          </div>

          <h1 className="text-4xl font-bold mb-4">
            Booking Terms
          </h1>

          <p className="text-muted-foreground max-w-2xl mx-auto">
            These booking terms outline how appointments are scheduled and
            managed to ensure a smooth and reliable service experience with
            Sparkle n' Glee.
          </p>
        </div>

        {/* TERMS CONTENT */}
        <div className="space-y-10 text-muted-foreground leading-relaxed">

          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Booking Confirmation
            </h2>
            <p>
              Service appointments are confirmed once a booking is submitted
              through our website or confirmed directly via WhatsApp or phone
              communication with our team.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Payment Methods
            </h2>
            <p>
              Payments may be made via M-Pesa or cash depending on the
              available payment options communicated during booking.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Rescheduling or Cancellation
            </h2>
            <p>
              If you need to reschedule or cancel your appointment,
              please notify us as early as possible so we can adjust
              our service schedule accordingly.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Service Areas
            </h2>
            <p>
              Sparkle n' Glee provides carpet cleaning services across
              Nairobi and Kiambu including but not limited to Westlands, Kilimani, Karen,
              Ruiru, Thika, Ruai, Kasarani and surrounding neighborhoods.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Changes to These Terms
            </h2>
            <p>
              Sparkle n' Glee may update these booking terms occasionally
              to reflect improvements to our services or operational
              requirements.
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