import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">

          {/* Header */}
          <header className="px-8 py-10 border-b border-slate-100 bg-slate-900 text-white">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Privacy Policy – AssistWork
            </h1>
            <p className="mt-2 text-slate-400 text-sm">
              Last updated: <span className="font-semibold text-slate-200">April 21, 2026</span>
            </p>
          </header>

          {/* Contenido */}
          <div className="p-8 md:p-12 space-y-10 text-slate-600 leading-relaxed">

            {/* 1. Introduction */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Introduction</h2>
              <p>
                <strong>AssistWork</strong> ("AssistWork", "we", "our", or "us") is an intelligent
                assistant designed to help users and small and medium-sized businesses (SMEs) execute
                productivity-related processes such as reading and sending emails, processing
                user-provided documents, managing CRM data, and automating workflows explicitly
                requested by the user.
              </p>
              <p className="mt-4 italic">
                This Privacy Policy explains how we collect, use, store, and protect user data when
                you use AssistWork, including when you connect third-party services to your account.
              </p>
            </section>

            {/* 2. Identity */}
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
                  <a href="https://assistwork.online" className="text-blue-600 hover:underline text-base">assistwork.online</a>
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
                AssistWork is available to individual users and businesses, including Small and
                Medium-sized Enterprises (SMEs). Users create an AssistWork account and may
                optionally connect third-party services such as Google, Microsoft, or CRM platforms
                to enable additional functionality.
              </p>
            </section>

            {/* 4. Data We Access */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-2">4. Data We Access</h2>
              <p className="mb-6">
                AssistWork accesses third-party service data strictly on demand and only when the
                user explicitly authorizes and requests an action. Depending on the integrations the
                user connects, AssistWork may access:
              </p>

              <div className="space-y-4">
                <div className="bg-white border border-slate-100 shadow-sm p-5 rounded-lg">
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">4.1 Communication Services (e.g. Gmail)</h3>
                  <ul className="list-disc ml-5 space-y-1 text-sm">
                    <li>Read emails</li>
                    <li>Search emails</li>
                    <li>Send emails on behalf of the user</li>
                  </ul>
                </div>

                <div className="bg-white border border-slate-100 shadow-sm p-5 rounded-lg">
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">4.2 Productivity Services (e.g. Google Sheets)</h3>
                  <ul className="list-disc ml-5 space-y-1 text-sm">
                    <li>Read, create, and edit spreadsheets</li>
                    <li>Write and append data to existing sheets</li>
                  </ul>
                </div>

                <div className="bg-white border border-slate-100 shadow-sm p-5 rounded-lg">
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">4.3 CRM Services (e.g. HubSpot)</h3>
                  <ul className="list-disc ml-5 space-y-1 text-sm">
                    <li>Read, create, and update contacts</li>
                    <li>Read, create, and update deals and companies</li>
                  </ul>
                </div>

                <div className="bg-white border border-slate-100 shadow-sm p-5 rounded-lg">
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">4.4 Communication & Collaboration Tools (e.g. Microsoft Teams)</h3>
                  <ul className="list-disc ml-5 space-y-1 text-sm">
                    <li>Read and send messages in authorized chats and channels</li>
                  </ul>
                </div>

                <div className="bg-white border border-slate-100 shadow-sm p-5 rounded-lg">
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">4.5 File Storage</h3>
                  <ul className="list-disc ml-5 space-y-1 text-sm">
                    <li>User-uploaded files processed on demand</li>
                    <li>Files stored securely in Google Cloud Storage</li>
                  </ul>
                  <p className="text-sm text-slate-500 border-t pt-2 mt-2 italic">
                    AssistWork does <strong>not</strong> access any data beyond what is required to
                    complete the user's explicit request.
                  </p>
                </div>
              </div>
            </section>

            {/* 5. Use of Data */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">5. Use of Data</h2>
              <p>
                AssistWork uses user data exclusively to execute processes explicitly requested by
                the user and generate outputs required to complete those processes.
              </p>
              <p className="mt-2 font-medium text-slate-800">
                AssistWork does not use data for advertising, profiling, or training machine
                learning models.
              </p>
            </section>

            {/* 6 & 8 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section>
                <h2 className="text-xl font-bold text-slate-900 mb-4">6. Automation</h2>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">✅ All actions are user-initiated</li>
                  <li className="flex items-center gap-2">✅ No background processes</li>
                  <li className="flex items-center gap-2">✅ Executions are isolated per request</li>
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
                Third-party service content (emails, spreadsheet data, CRM records) is processed
                temporarily in memory during execution and is <strong>never stored permanently</strong>.
                Execution data is cleared immediately after completion.
              </p>
              <p className="mt-2">
                Stored data may include OAuth tokens (encrypted), technical logs, and
                user-uploaded files persisted in Google Cloud Storage at the user's request.
              </p>
            </section>

            {/* 9–13 */}
            {[
              {
                id: 9,
                title: "Data Sharing",
                content: "AssistWork does not share or sell user data to third parties. Data is only transmitted to the third-party platforms explicitly connected and authorized by the user."
              },
              {
                id: 10,
                title: "Security Measures",
                list: ["HTTPS encryption in transit", "Encrypted OAuth token storage", "User-level data isolation", "Secure cloud infrastructure (Google Cloud)"]
              },
              {
                id: 11,
                title: "User Rights",
                content: "Users may revoke access to any connected service at any time from the Apps menu. Users may also request account deletion and removal of all associated data by contacting us."
              },
              {
                id: 12,
                title: "Monetization",
                content: "AssistWork offers a free 7-day trial with up to 20 conversations. After the trial, users may subscribe to a paid plan. AssistWork does not display ads and does not monetize user data in any form."
              },
              {
                id: 13,
                title: "Compliance",
                content: "AssistWork complies with the Google API Services User Data Policy, including Limited Use requirements, as well as the terms of service of all third-party platforms it integrates with, including but not limited to Google, Microsoft, and HubSpot."
              }
            ].map((section) => (
              <section key={section.id}>
                <h2 className="text-xl font-bold text-slate-900 mb-3">{section.id}. {section.title}</h2>
                {section.content && <p>{section.content}</p>}
                {section.list && (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {section.list.map(li => (
                      <li key={li} className="text-sm flex items-center gap-2 tracking-tight">🛡️ {li}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            {/* 14. Contact */}
            <section className="bg-slate-900 p-8 rounded-2xl text-center text-white shadow-2xl shadow-slate-300">
              <h2 className="text-xl font-bold mb-2 text-slate-100">14. Contact</h2>
              <p className="text-slate-400 mb-4 text-sm">For questions about this Privacy Policy, contact us at:</p>
              <a
                href="mailto:agenteiaservicios@gmail.com"
                className="text-xl font-bold text-blue-400 hover:text-blue-300 transition-colors underline-offset-8 underline"
              >
                agenteiaservicios@gmail.com
              </a>
            </section>
          </div>
        </div>

        <p className="mt-8 text-center text-slate-400 text-xs">
          © {new Date().getFullYear()} AssistWork Colombia. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;