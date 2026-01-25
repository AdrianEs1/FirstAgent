import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Card Principal */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
          
          {/* Header */}
          <header className="px-8 py-10 border-b border-slate-100 bg-slate-900 text-white">

            <h1 className="text-3xl font-extrabold tracking-tight">
            
              Privacy Policy – AssistWork
            </h1>
            <p className="mt-2 text-slate-400 text-sm">
              Last updated: <span className="font-semibold text-slate-200">January 22, 2026</span>
            </p>
          </header>

          {/* Contenido */}
          <div className="p-8 md:p-12 space-y-10 text-slate-600 leading-relaxed">
            
            {/* 1. Introduction */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Introduction</h2>
              <p>
                <strong>AssistWork</strong> (“AssistWork”, “we”, “our”, or “us”) is an intelligent assistant designed to help users and small and medium-sized businesses (SMEs) execute productivity-related processes such as reading and sending emails, processing user-provided documents, and automating workflows explicitly requested by the user.
              </p>
              <p className="mt-4 italic">
                This Privacy Policy explains how we collect, use, store, and protect user data when you use AssistWork, including when you connect your Google account.
              </p>
            </section>

            {/* 2. Identity - Estilo Card Informativa */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. Identity of the Service</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-xl border border-slate-100 text-sm">
                <div>
                  <span className="block uppercase tracking-wider text-[10px] font-bold text-slate-400">Official App Name</span>
                  <span className="text-slate-900 font-medium text-base">AssistWork</span>
                </div>
                <div>
                  <span className="block uppercase tracking-wider text-[10px] font-bold text-slate-400">Commercial Name</span>
                  <span className="text-slate-900 font-medium text-base">AssistWork</span>
                </div>
                <div>
                  <span className="block uppercase tracking-wider text-[10px] font-bold text-slate-400">Website</span>
                  <a href="https://assistwork.vercel.app" className="text-blue-600 hover:underline text-base">assistwork.vercel.app</a>
                </div>
                <div>
                  <span className="block uppercase tracking-wider text-[10px] font-bold text-slate-400">Contact</span>
                  <span className="text-slate-900 font-medium text-base">agenteiaservicios@gmail.com</span>
                </div>
              </div>
            </section>

            {/* 3. Types of Users */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">3. Types of Users</h2>
              <p>
                AssistWork is available to individual users and businesses, including Small and Medium-sized Enterprises (SMEs). Users create an AssistWork account. Google authentication is used exclusively to grant permissions required for Gmail-related functionality.
              </p>
            </section>

            {/* 4. Data We Access */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-2">4. Data We Access</h2>
              <p className="mb-6">
                AssistWork accesses user data strictly on demand and only when the user explicitly authorizes and requests an action.
              </p>

              <div className="space-y-6">
                <div className="bg-white border border-slate-100 shadow-sm p-5 rounded-lg">
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">4.1 Gmail Data</h3>
                  <ul className="list-disc ml-5 space-y-1 mb-3">
                    <li>Read emails</li>
                    <li>Search emails</li>
                    <li>Send emails</li>
                  </ul>
                  <p className="text-sm text-slate-500 border-t pt-2 italic">
                    AssistWork does <strong>not</strong> modify, delete, or access Gmail data without a user-initiated request.
                  </p>
                </div>

                <div className="bg-white border border-slate-100 shadow-sm p-5 rounded-lg">
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">4.2 Other Data</h3>
                  <ul className="list-disc ml-5 space-y-1 mb-3">
                    <li>User-uploaded files only</li>
                  </ul>
                  <p className="text-sm text-slate-500 border-t pt-2 italic">
                    AssistWork does not access Google Drive, Contacts, or Calendar.
                  </p>
                </div>
              </div>
            </section>

            {/* 5. Use of Data */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">5. Use of Data</h2>
              <p>
                AssistWork uses user data exclusively to execute processes explicitly requested by the user and generate outputs required to complete those processes. 
              </p>
              <p className="mt-2 font-medium text-slate-800">
                AssistWork does not use data for advertising, profiling, or training machine learning models.
              </p>
            </section>

            {/* 6, 7, 8 - Secciones de lista corta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section>
                <h2 className="text-xl font-bold text-slate-900 mb-4 font-sans">6. Automation</h2>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">✅ All actions are user-initiated</li>
                  <li className="flex items-center gap-2">✅ No background processes</li>
                  <li className="flex items-center gap-2">✅ Executions are isolated</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-900 mb-4">8. Data Deletion</h2>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">🗑️ Temporary data deleted after execution</li>
                  <li className="flex items-center gap-2">🗑️ Users can delete conversation history</li>
                  <li className="flex items-center gap-2">🗑️ Users can delete accounts anytime</li>
                </ul>
              </section>
            </div>

            {/* 7. Data Storage */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">7. Data Storage and Retention</h2>
              <p>
                Gmail content is processed temporarily in memory during execution and is <strong>never stored permanently</strong>. Execution data is cleared immediately after completion.
              </p>
              <p className="mt-2">
                Stored data may include OAuth tokens (encrypted), technical logs, and user-uploaded files.
              </p>
            </section>

            {/* 9 - 13 Secciones directas */}
            {[
              { id: 9, title: "Data Sharing", content: "AssistWork does not share or sell user data to third parties." },
              { id: 10, title: "Security Measures", list: ["HTTPS encryption", "Authenticated access", "User-level data isolation", "Secure cloud infrastructure"] },
              { id: 11, title: "User Rights", content: "Users may revoke Google account access, manage permissions, and delete their account without penalty." },
              { id: 12, title: "Monetization", content: "AssistWork offers a free 7-day trial and paid subscription plans. Gmail access is available during the trial, with higher usage limits in paid plans." },
              { id: 13, title: "Compliance", content: "AssistWork complies with the Google API Services User Data Policy, including Limited Use requirements." }
            ].map((section) => (
              <section key={section.id}>
                <h2 className="text-xl font-bold text-slate-900 mb-3">{section.id}. {section.title}</h2>
                {section.content && <p>{section.content}</p>}
                {section.list && (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {section.list.map(li => <li key={li} className="text-sm flex items-center gap-2 tracking-tight">🛡️ {li}</li>)}
                  </ul>
                )}
              </section>
            ))}

            {/* 14. Contact */}
            <section className="bg-slate-900 p-8 rounded-2xl text-center text-white shadow-2xl shadow-slate-300">
              <h2 className="text-xl font-bold mb-2 text-slate-100">14. Contact</h2>
              <p className="text-slate-400 mb-4 text-sm">For questions about this Privacy Policy, contact us at:</p>
              <a href="mailto:agenteiaservicios@gmail.com" className="text-xl font-bold text-blue-400 hover:text-blue-300 transition-colors underline-offset-8 underline">
                agenteiaservicios@gmail.com
              </a>
            </section>

          </div>
        </div>

        {/* Footer final */}
        <p className="mt-8 text-center text-slate-400 text-xs">
          © {new Date().getFullYear()} AssistWork Colombia. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;