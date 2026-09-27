import Link from 'next/link';
import { User, Stethoscope, Building2, BriefcaseMedical, ArrowRight, HeartPulse, Activity } from 'lucide-react';

export default function LandingPage() {
  const portals = [
    {
      name: 'Health Worker',
      description: 'Conduct field operations, remote patient monitoring, and vitals tracking in villages.',
      icon: BriefcaseMedical,
      url: process.env.NEXT_PUBLIC_WORKER_URL || '/health-worker',
      color: 'from-amber-500/20 to-amber-600/20',
      border: 'hover:border-amber-500/50',
      text: 'text-amber-400'
    },
    {
      name: 'Patient',
      description: 'Book appointments, view medical records, and consult doctors directly online.',
      icon: User,
      url: process.env.NEXT_PUBLIC_PATIENT_URL || '/patient',
      color: 'from-blue-500/20 to-blue-600/20',
      border: 'hover:border-blue-500/50',
      text: 'text-blue-400'
    },
    {
      name: 'Doctor',
      description: 'Manage your daily appointments, access patient history, and conduct video calls.',
      icon: Stethoscope,
      url: process.env.NEXT_PUBLIC_DOCTOR_URL || '/doctor',
      color: 'from-emerald-500/20 to-emerald-600/20',
      border: 'hover:border-emerald-500/50',
      text: 'text-emerald-400'
    },
    {
      name: 'Hospital Admin',
      description: 'Oversee departments, medicine inventory, available beds, and staff performance.',
      icon: Building2,
      url: process.env.NEXT_PUBLIC_HOSPITAL_URL || '/hospital-admin',
      color: 'from-purple-500/20 to-purple-600/20',
      border: 'hover:border-purple-500/50',
      text: 'text-purple-400'
    },
    {
      name: 'Government Monitoring',
      description: 'Monitor nationwide health metrics, track disease outbreaks, and allocate resources.',
      icon: Activity,
      url: process.env.NEXT_PUBLIC_GOVT_URL || '/hospital-admin',
      color: 'from-red-500/20 to-red-600/20',
      border: 'hover:border-red-500/50',
      text: 'text-red-400'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-blue-500/30 overflow-x-hidden">
      {/* Abstract Background Glows */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/20 blur-[120px] mix-blend-screen" />
      </div>

      <div className="relative z-10">
        {/* Navigation Bar */}
        <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-8 h-8 text-blue-500" />
            <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              Upchaar
            </span>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="flex flex-col items-center justify-center min-h-[85vh] px-4 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-md mb-8 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Unified Healthcare Platform
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
            Seamless Healthcare, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-teal-400">
              Connected Together.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Upchaar bridges the gap between patients, doctors, hospitals, and field health workers. 
            Experience a modern, unified approach to managing medical records, appointments, and critical hospital resources.
          </p>

          {/* Scroll Down Button */}
          <a 
            href="#portals" 
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold text-white transition-all duration-300 ease-in-out bg-blue-600 border border-blue-500 rounded-full hover:bg-blue-500 hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] focus:ring-4 focus:ring-blue-500/20"
          >
            Access Portals
            <ArrowRight className="w-5 h-5 transition-transform group-hover:rotate-90" />
          </a>
        </main>

        {/* Portals Section */}
        <section id="portals" className="py-24 px-4 max-w-7xl mx-auto min-h-screen flex flex-col justify-center">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Who are you?</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Select your portal below to log in securely to your dedicated dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {portals.map((portal) => {
              const Icon = portal.icon;
              return (
                <Link 
                  key={portal.name}
                  href={portal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative flex flex-col p-8 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${portal.border}`}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${portal.color} border border-white/5`}>
                    <Icon className={`w-8 h-8 ${portal.text}`} />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-3 text-slate-100 group-hover:text-white transition-colors">
                    {portal.name}
                  </h3>
                  
                  <p className="text-slate-400 leading-relaxed mb-8 flex-grow">
                    {portal.description}
                  </p>

                  <div className={`flex items-center gap-2 font-medium ${portal.text} opacity-80 group-hover:opacity-100 transition-opacity`}>
                    Enter Portal
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 text-center text-slate-500 border-t border-slate-800/50">
          <p>© {new Date().getFullYear()} Upchaar Healthcare Platform. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
