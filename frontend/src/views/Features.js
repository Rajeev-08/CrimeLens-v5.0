import React from 'react';
import Galaxy from '../components/Galaxy';

const Features = ({ onBack, onEnterDashboard }) => {
  const featuresList = [
    {
      title: "Predictive AI",
      desc: "Leverage advanced machine learning models to forecast potential crime hotspots before they emerge.",
      icon: "🧠"
    },
    {
      title: "3D Geospatial Mapping",
      desc: "Visualize crime density with immersive 3D city models, identifying high-risk zones instantly.",
      icon: "🗺️"
    },
    {
      title: "Public Perception Engine",
      desc: "Real-time NLP analysis of local news headlines to gauge community fear levels and sentiment.",
      icon: "📰"
    },
    {
      title: "Smart Safety Routing",
      desc: "Intelligent navigation algorithms that calculate the safest paths by avoiding historical danger zones.",
      icon: "🛡️"
    },
    {
      title: "Temporal Trend Analysis",
      desc: "Deep-dive into historical data to identify seasonal patterns, peak crime hours, and long-term trends.",
      icon: "📈"
    },
    {
      title: "AI Safety Assistant",
      desc: "An interactive AI companion that answers queries, generates reports, and provides instant safety tips.",
      icon: "🤖"
    }
  ];

  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden font-sans text-white">
      
      {/* --- BACKGROUND: GALAXY --- */}
      <div className="absolute inset-0 z-0">
        <Galaxy 
          mouseRepulsion={true}
          mouseInteraction={true}
          density={1.5}
          glowIntensity={0.5}
          saturation={0.8}
          hueShift={240} // Deep Blue/Purple theme
        />
        {/* Dark overlay to ensure text is readable */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
      </div>

      {/* --- CONTENT LAYER --- */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 flex flex-col h-full">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={onBack}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-sm shadow-lg group-hover:shadow-blue-500/50 transition-all">CL</div>
            <span className="text-xl font-bold tracking-tight">CrimeLens</span>
          </div>
          <button 
            onClick={onBack}
            className="text-sm text-gray-300 hover:text-white transition-colors uppercase tracking-widest font-medium border-b border-transparent hover:border-white pb-1"
          >
            ← Back Home
          </button>
        </div>

        {/* Title Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-100 via-white to-blue-100 drop-shadow-sm">
            Core Capabilities
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg md:text-xl font-light leading-relaxed">
            A comprehensive suite of tools designed to analyze, predict, and prevent crime using data-driven intelligence.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-20">
          {featuresList.map((f, i) => (
            <div key={i} className="group p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-2 shadow-lg">
              <div className="text-4xl mb-5 grayscale group-hover:grayscale-0 transition-all transform group-hover:scale-110 origin-left duration-300">{f.icon}</div>
              <h3 className="text-xl font-bold mb-3 text-white group-hover:text-blue-300 transition-colors">{f.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm group-hover:text-gray-200 transition-colors">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-auto pb-10">
          <button 
            onClick={onEnterDashboard}
            className="px-12 py-4 bg-white text-black font-bold text-lg rounded-full hover:scale-105 hover:bg-blue-50 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-300"
          >
            Access Dashboard
          </button>
          <p className="mt-4 text-xs text-gray-500 uppercase tracking-widest">Powered by Gemini AI & Real-Time Data</p>
        </div>

      </div>
    </div>
  );
};

export default Features;