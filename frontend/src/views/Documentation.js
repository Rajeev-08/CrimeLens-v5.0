import React, { useState } from 'react';
import Aurora from '../components/Aurora';

const Documentation = ({ onBack }) => {
  const [activeSection, setActiveSection] = useState('introduction');

  // --- MOCK CONTENT DATA ---
  const sections = [
    {
      id: 'introduction',
      title: 'Introduction',
      content: (
        <>
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            CrimeLens API Documentation
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            Welcome to the CrimeLens Developer API. Our platform provides programmatic access to 
            predictive crime analytics, 3D geospatial density mapping, and real-time sentiment analysis.
          </p>
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-200 text-sm">
              <strong>Note:</strong> This API is currently in <strong>v2.0 Beta</strong>. Rate limits apply to free tier accounts.
            </p>
          </div>
        </>
      )
    },
    {
      id: 'authentication',
      title: 'Authentication',
      content: (
        <>
          <h2 className="text-3xl font-bold mb-4 text-white">Authentication</h2>
          <p className="text-gray-300 mb-4">
            The CrimeLens API uses API keys to authenticate requests. You can view and manage your API keys in the Dashboard settings.
          </p>
          <p className="text-gray-300 mb-4">
            Authentication to the API is performed via HTTP Basic Auth. Provide your API key as the basic auth username value. You do not need to provide a password.
          </p>
          
          <CodeBlock 
            language="bash" 
            code={`curl https://api.crimelens.ai/v1/crimes \\
  -u YOUR_API_KEY`} 
          />
        </>
      )
    },
    {
      id: 'predict',
      title: 'Predictive Analysis',
      content: (
        <>
          <h2 className="text-3xl font-bold mb-4 text-white">Get Risk Prediction</h2>
          <p className="text-gray-300 mb-4">
            Generates a crime risk score for a specific geospatial coordinate based on historical data and temporal patterns.
          </p>
          
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-1 bg-green-500/20 text-green-400 font-mono text-sm border border-green-500/30 rounded">POST</span>
            <span className="text-gray-300 font-mono">/v1/predict/risk</span>
          </div>

          <h3 className="text-xl font-semibold text-white mb-2 mt-6">Request Body</h3>
          <CodeBlock 
            language="json" 
            code={`{
  "latitude": 34.0522,
  "longitude": -118.2437,
  "time_frame": "next_24h",
  "include_sentiment": true
}`} 
          />

          <h3 className="text-xl font-semibold text-white mb-2 mt-6">Response</h3>
          <CodeBlock 
            language="json" 
            code={`{
  "risk_score": 87,
  "risk_level": "High",
  "primary_factors": ["Poor Lighting", "Historical Pattern"],
  "sentiment_index": 45
}`} 
          />
        </>
      )
    },
    {
      id: 'sentiment',
      title: 'Sentiment Engine',
      content: (
        <>
          <h2 className="text-3xl font-bold mb-4 text-white">Public Perception</h2>
          <p className="text-gray-300 mb-4">
            Retrieve real-time public fear indices based on NLP analysis of local news sources and social feeds.
          </p>
          
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 font-mono text-sm border border-blue-500/30 rounded">GET</span>
            <span className="text-gray-300 font-mono">/v1/sentiment?area=Chicago_North</span>
          </div>
        </>
      )
    }
  ];

  return (
    <div className="relative w-full h-screen bg-[#060606] overflow-hidden font-sans text-white flex flex-col">
      
      {/* --- BACKGROUND LAYER: AURORA --- */}
      <div className="absolute inset-0 z-0">
        <Aurora
          colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
        {/* Dark Overlay for Readability */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      {/* --- TOP BAR --- */}
      <header className="relative z-20 flex justify-between items-center px-8 py-4 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-sm">CL</div>
          <span className="text-lg font-bold tracking-tight">CrimeLens <span className="text-gray-400 font-normal">Docs</span></span>
        </div>
        <button 
          onClick={onBack}
          className="text-sm text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-full border border-white/10 hover:bg-white/10"
        >
          Back to Dashboard
        </button>
      </header>

      {/* --- MAIN LAYOUT --- */}
      <div className="relative z-10 flex flex-1 overflow-hidden max-w-7xl mx-auto w-full">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-64 hidden md:flex flex-col py-8 px-6 border-r border-white/10 overflow-y-auto custom-scrollbar">
          <div className="mb-6">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Getting Started</h4>
            <nav className="flex flex-col gap-2">
              {sections.slice(0, 2).map(section => (
                <NavItem 
                  key={section.id} 
                  active={activeSection === section.id} 
                  onClick={() => setActiveSection(section.id)}
                >
                  {section.title}
                </NavItem>
              ))}
            </nav>
          </div>
          
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Endpoints</h4>
            <nav className="flex flex-col gap-2">
              {sections.slice(2).map(section => (
                <NavItem 
                  key={section.id} 
                  active={activeSection === section.id} 
                  onClick={() => setActiveSection(section.id)}
                >
                  {section.title}
                </NavItem>
              ))}
            </nav>
          </div>
        </aside>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
          <div className="max-w-3xl mx-auto">
             {sections.map(section => (
               <div 
                 key={section.id} 
                 className={`transition-opacity duration-300 ${activeSection === section.id ? 'block opacity-100' : 'hidden opacity-0'}`}
               >
                 {section.content}
               </div>
             ))}
          </div>
          
          {/* Footer inside content for spacing */}
          <div className="mt-20 pt-10 border-t border-white/10 text-center text-gray-500 text-sm">
            &copy; 2025 CrimeLens Inc. All rights reserved.
          </div>
        </main>

      </div>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const NavItem = ({ children, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`text-left text-sm py-2 px-3 rounded-md transition-all ${
      active 
      ? 'bg-blue-500/20 text-blue-200 font-medium border border-blue-500/20' 
      : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`}
  >
    {children}
  </button>
);

const CodeBlock = ({ code, language = "json" }) => (
  <div className="relative group mt-4 mb-6">
    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
    <div className="relative bg-[#0d1117] rounded-lg border border-white/10 p-4 overflow-x-auto">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-500 font-mono lowercase">{language}</span>
        <button className="text-xs text-gray-500 hover:text-white transition-colors">Copy</button>
      </div>
      <pre className="font-mono text-sm text-gray-300 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  </div>
);

export default Documentation;