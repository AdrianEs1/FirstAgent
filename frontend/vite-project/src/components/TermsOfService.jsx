import React from "react";
const VITE_API_URL_PRIVACY= import.meta.env.VITE_API_URL_PRIVACY

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 sm:px-6 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Card Principal */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
          
          {/* Header con estilo distintivo */}
          <header className="px-8 py-10 border-b border-slate-100 bg-slate-900 text-white">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Terms of Service – AssistWork
            </h1>
            <p className="mt-2 text-slate-400 text-sm">
              Last updated: <span className="font-semibold text-slate-200">January 22, 2026</span>
            </p>
          </header>

          {/* Contenido */}
          <div className="p-8 md:p-12 space-y-10 text-slate-600 leading-relaxed">
            
            {/* 1. Acceptance */}
            <section className="bg-amber-50/50 border-l-4 border-amber-400 p-6 rounded-r-lg">
              <h2 className="text-xl font-bold text-slate-900 mb-2">1. Acceptance of Terms</h2>
              <p className="text-sm">
                By accessing or using <strong>AssistWork</strong> ("the Service"), you agree to be bound by these Terms of Service. If you do not agree with these Terms, you must not use the Service.
              </p>
            </section>

            {/* 2. Description */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4 font-sans">2. Description of the Service</h2>
              <p>
                AssistWork is an AI-powered assistant designed to help individuals and small and medium-sized businesses (SMEs) execute productivity-related tasks.
              </p>
              <div className="mt-4 flex items-center gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm italic">
                <span>💡</span>
                <p>All actions are performed strictly based on explicit user instructions. AssistWork does not perform automated background actions.</p>
              </div>
            </section>

            {/* 3 & 4. Accounts & Google */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section>
                <h2 className="text-lg font-bold text-slate-900 mb-3 border-b pb-1">3. User Accounts</h2>
                <p className="text-sm">
                  Users are responsible for maintaining the confidentiality of their account credentials and for all activities performed under their account.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-slate-900 mb-3 border-b pb-1">4. Google Connection</h2>
                <ul className="text-xs space-y-2 list-none">
                  <li className="flex gap-2">📧 <span>Read/Search emails</span></li>
                  <li className="flex gap-2">📤 <span>Send emails on your behalf</span></li>
                  <li className="text-slate-400">No modification or permanent storage.</li>
                </ul>
              </section>
            </div>

            {/* 5. User Responsibilities - Estilo Checkbox */}
            <section className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-6">5. User Responsibilities</h2>
              <ul className="space-y-4">
                {[
                  "Accuracy of instructions provided to AssistWork.",
                  "Content of emails sent using the Service.",
                  "Compliance with applicable laws and regulations."
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="bg-blue-100 text-blue-600 rounded-full p-1 text-[10px]">✔</span>
                    <span className="text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* 6. Privacy Link */}
            <section className="text-center py-6 border-y border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 mb-2">6. Data Usage and Privacy</h2>
              <p className="text-sm mb-3">Our Privacy Policy explains how data is accessed and protected.</p>
              <a 
                href= "/privacy"
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-white px-4 py-2 border border-slate-300 rounded-full text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                View Privacy Policy →
              </a>
            </section>

            {/* 7. Subscriptions - Card con color */}
            <section className="bg-blue-600 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg shadow-blue-200">
              <div className="relative z-10">
                <h2 className="text-xl font-bold mb-2">7. Subscriptions and Payments</h2>
                <p className="text-blue-100 text-sm mb-4">
                  AssistWork offers a <strong>free trial period of seven (7) days</strong>. After the trial, you may choose to subscribe to one of our paid plans.
                </p>
                <p className="text-xs text-blue-200">
                  Subscription fees and billing cycles are presented clearly on our website.
                </p>
              </div>
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            </section>

            {/* 8 - 11 Secciones rápidas */}
            <div className="space-y-8 pt-4">
              <section>
                <h2 className="text-lg font-bold text-slate-900 mb-2">8. Termination</h2>
                <p className="text-sm">You may delete your account at any time without penalty. AssistWork reserves the right to suspend accounts that engage in abusive or illegal activities.</p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-slate-900 mb-2 font-mono text-[16px]">9. Limitation of Liability</h2>
                <p className="text-xs bg-slate-100 p-4 rounded-lg italic">
                  "AssistWork is provided on an 'as is' basis. We shall not be liable for any indirect, incidental, or consequential damages arising from the use of the Service."
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-slate-900 mb-2">11. Governing Law</h2>
                <p className="text-sm flex items-center gap-2 font-medium">
                  🇨🇴 These Terms are governed by the laws of the Republic of Colombia.
                </p>
              </section>
            </div>

            {/* 12. Contact */}
            <section className="bg-slate-900 p-8 rounded-2xl text-center text-white shadow-2xl shadow-slate-300"> 
              <h2 className="text-xl font-bold mb-2 text-slate-100">12. Contact Information</h2>
              <p className="text-slate-400 mb-4 text-sm">Questions? Contact our team at:</p>
              <a href="mailto:agenteiaservicios@gmail.com" className="text-xl font-bold text-blue-400 hover:text-blue-300 transition-colors underline-offset-8 underline">
                agenteiaservicios@gmail.com
              </a>
            </section>

          </div>
        </div>

        {/* Footer final */}
        <p className="mt-8 text-center text-slate-400 text-[10px] uppercase tracking-widest">
          AssistWork Productivity Suite • {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default TermsOfService;