import React from "react";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">

        {/* Card Principal */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">

          {/* Header */}
          <header className="px-8 py-10 border-b border-slate-100 bg-slate-900 text-white">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Refund Policy – AssistWork
            </h1>
            <p className="mt-2 text-slate-400 text-sm">
              Last updated:{" "}
              <span className="font-semibold text-slate-200">
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </p>
          </header>

          {/* Contenido */}
          <div className="p-8 md:p-12 space-y-10 text-slate-600 leading-relaxed">

            {/* 1. Introduction */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Introduction</h2>
              <p>
                <strong>AssistWork</strong> is committed to providing a high-quality service. This Refund Policy describes the conditions under which refunds are granted for subscriptions to <strong>AssistWork Pro</strong>, processed through our payment provider <strong>Paddle</strong>.
              </p>
              <p className="mt-4 italic">
                By subscribing to AssistWork Pro, you agree to this Refund Policy.
              </p>
            </section>

            {/* 2. Free Trial */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. Free Trial</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-xl border border-slate-100 text-sm">
                <div>
                  <span className="block uppercase tracking-wider text-[10px] font-bold text-slate-400">Trial Duration</span>
                  <span className="text-slate-900 font-medium text-base">7 days</span>
                </div>
                <div>
                  <span className="block uppercase tracking-wider text-[10px] font-bold text-slate-400">Credit Card Required</span>
                  <span className="text-slate-900 font-medium text-base">No</span>
                </div>
                <div>
                  <span className="block uppercase tracking-wider text-[10px] font-bold text-slate-400">Charge During Trial</span>
                  <span className="text-slate-900 font-medium text-base">None</span>
                </div>
                <div>
                  <span className="block uppercase tracking-wider text-[10px] font-bold text-slate-400">Cancel Anytime</span>
                  <span className="text-slate-900 font-medium text-base">Yes, no charge</span>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-500 italic">
                No charge will be made until the trial period ends. Canceling before the trial ends results in no billing whatsoever.
              </p>
            </section>

            {/* 3. Refund Policy */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">3. Refund Policy</h2>
              <p>
                We offer a <strong>full refund within the first 14 days</strong> from the date of the first charge. If you are not satisfied with AssistWork Pro for any reason, contact us within that period and we will process your refund — no questions asked.
              </p>
              <p className="mt-4 font-medium text-slate-800">
                After the 14-day refund window, no refunds will be issued for the current billing period.
              </p>
            </section>

            {/* 4. How to Request */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-2">4. How to Request a Refund</h2>
              <p className="mb-6">To request a refund, follow these steps:</p>
              <div className="space-y-4">
                <div className="bg-white border border-slate-100 shadow-sm p-5 rounded-lg">
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">Step 1 — Contact Us</h3>
                  <p className="text-sm">
                    Send an email to{" "}
                    <a href="agenteiaservicios@gmail.com" className="text-blue-600 hover:underline font-medium">
                      agenteiaservicios@gmail.com
                    </a>{" "}
                    with the subject: <strong>"Refund Request"</strong>.
                  </p>
                </div>
                <div className="bg-white border border-slate-100 shadow-sm p-5 rounded-lg">
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">Step 2 — Include Your Info</h3>
                  <ul className="list-disc ml-5 space-y-1 text-sm">
                    <li>The email address associated with your account</li>
                    <li>The date of the charge</li>
                    <li>A brief reason (optional)</li>
                  </ul>
                </div>
                <div className="bg-white border border-slate-100 shadow-sm p-5 rounded-lg">
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">Step 3 — Processing Time</h3>
                  <p className="text-sm text-slate-500 italic">
                    All refund requests are processed within <strong>3 to 5 business days</strong>.
                  </p>
                </div>
              </div>
            </section>

            {/* 5 y 6 en grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section>
                <h2 className="text-xl font-bold text-slate-900 mb-4">5. Subscription Cancellation</h2>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">✅ Cancel anytime from account settings</li>
                  <li className="flex items-center gap-2">✅ Access continues until end of billing period</li>
                  <li className="flex items-center gap-2">✅ No additional charges after cancellation</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-900 mb-4">6. Non-Eligible Cases</h2>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">❌ Requests after the 14-day window</li>
                  <li className="flex items-center gap-2">❌ Accounts that violated our Terms of Service</li>
                  <li className="flex items-center gap-2">❌ Free trial periods (no charge occurred)</li>
                </ul>
              </section>
            </div>

            {/* 7. Paddle */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">7. Payments Processed by Paddle</h2>
              <p>
                All payments for AssistWork Pro are processed by <strong>Paddle.com</strong>, who acts as the Merchant of Record. Paddle handles all fiscal and regulatory compliance aspects of transactions.
              </p>
              <p className="mt-2">
                For specific billing inquiries, you may also contact Paddle directly through their support portal at{" "}
                <a href="https://paddle.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  paddle.com
                </a>.
              </p>
            </section>

            {/* 8. Security */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">8. Security & Compliance</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "PCI-compliant payment processing via Paddle",
                  "No card data stored on our servers",
                  "HTTPS encryption on all transactions",
                  "User-level data isolation",
                ].map((li) => (
                  <li key={li} className="text-sm flex items-center gap-2 tracking-tight">
                    🛡️ {li}
                  </li>
                ))}
              </ul>
            </section>

            {/* Contact */}
            <section className="bg-slate-900 p-8 rounded-2xl text-center text-white shadow-2xl shadow-slate-300">
              <h2 className="text-xl font-bold mb-2 text-slate-100">9. Contact</h2>
              <p className="text-slate-400 mb-4 text-sm">
                For questions about this Refund Policy, contact us at:
              </p>
              <a
                href="mailto:support@assistwork.app"
                className="text-xl font-bold text-blue-400 hover:text-blue-300 transition-colors underline-offset-8 underline"
              >
                agenteiaservicios@gmail.com
              </a>
            </section>

          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-slate-400 text-xs">
          © {new Date().getFullYear()} AssistWork Colombia. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default RefundPolicy;