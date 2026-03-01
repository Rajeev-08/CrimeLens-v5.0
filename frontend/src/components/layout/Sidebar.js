// frontend/src/components/layout/Sidebar.js
import React, { useState, useEffect, Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

function MultiSelect({ label, options, selected, onChange }) {
    return (
        <div className="w-full">
            <Listbox value={selected} onChange={onChange} multiple>
                <div className="relative mt-2">
                    <Listbox.Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">{label}</Listbox.Label>
                    <Listbox.Button className="cursor-target relative w-full cursor-pointer rounded-xl bg-white/70 backdrop-blur-md border border-white/60 py-3 pl-4 pr-10 text-left shadow-[0_2px_10px_rgba(0,0,0,0.03)] focus:outline-none focus:ring-2 focus:ring-blue-400/50 sm:text-sm font-medium text-slate-700 transition-all hover:bg-white/90">
                        <span className="block truncate">{selected.length} of {options.length} selected</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <ChevronUpDownIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                        </span>
                    </Listbox.Button>
                    <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <Listbox.Options className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white/90 backdrop-blur-xl border border-white/50 py-1 text-base shadow-[0_10px_40px_rgba(0,0,0,0.1)] focus:outline-none sm:text-sm custom-scrollbar">
                            {options.map((option, index) => (
                                <Listbox.Option
                                    key={index}
                                    className={({ active }) => `relative cursor-pointer select-none py-2.5 pl-10 pr-4 transition-colors ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
                                    value={option}
                                >
                                    {({ selected }) => (
                                        <>
                                            <span className={`block truncate ${selected ? 'font-bold' : 'font-medium'}`}>{option}</span>
                                            {selected ? (
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                </span>
                                            ) : null}
                                        </>
                                    )}
                                </Listbox.Option>
                            ))}
                        </Listbox.Options>
                    </Transition>
                </div>
            </Listbox>
        </div>
    );
}

const Sidebar = ({ onFileUpload, fileInfo, initialFilters, onFilterChange, isLoading }) => {
    const [selectedFilters, setSelectedFilters] = useState(null);

    useEffect(() => {
        if (initialFilters) {
            setSelectedFilters({
                areas: initialFilters.areas,
                crimes: initialFilters.crimes,
                severities: initialFilters.severities,
            });
        }
    }, [initialFilters]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) onFileUpload(file);
    };

    const handleFilterUpdate = (filterType, value) => {
        setSelectedFilters(prev => ({ ...prev, [filterType]: value }));
    };

    return (
        <aside className="w-80 lg:w-96 bg-white/40 backdrop-blur-2xl p-6 shadow-[4px_0_24px_rgba(0,0,0,0.02)] border-r border-white/60 overflow-y-auto flex flex-col space-y-6 h-full custom-scrollbar z-20 relative">
            
            {/* Control Section */}
            <div className="flex-shrink-0">
                <h2 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-2 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                    </svg>
                    System Controls
                </h2>
                
                {/* Modern Upload Box */}
                <div className="mt-2">
                    <label className="cursor-target flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300/80 rounded-2xl bg-white/50 hover:bg-white/80 hover:border-blue-400 hover:shadow-md transition-all duration-300 cursor-pointer group">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg aria-hidden="true" className="w-8 h-8 mb-2 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                            <p className="mb-1 text-sm text-slate-500 group-hover:text-blue-600 font-semibold"><span className="font-bold">Click to upload</span> CSV</p>
                        </div>
                        <input type="file" onChange={handleFileChange} accept=".csv" className="hidden" />
                    </label>
                </div>

                {isLoading && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-blue-600 animate-pulse">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Processing Data...
                    </div>
                )}

                {fileInfo && !isLoading && (
                    <div className="mt-4 p-3 bg-green-50/80 border border-green-200 rounded-xl flex items-center gap-3 shadow-sm">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" /></svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800 truncate w-48">{fileInfo.name}</p>
                            <p className="text-xs font-medium text-green-700">{fileInfo.totalRecords.toLocaleString()} records loaded</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Filters Section */}
            {initialFilters && selectedFilters && (
                <div className="flex-grow border-t border-slate-200/60 pt-6">
                    <h3 className="text-lg font-extrabold text-slate-800 tracking-tight mb-4">Active Filters</h3>
                    <div className="space-y-5">
                        <MultiSelect label="Neighborhood / Area" options={initialFilters.areas} selected={selectedFilters.areas} onChange={(val) => handleFilterUpdate('areas', val)} />
                        <MultiSelect label="Crime Category" options={initialFilters.crimes} selected={selectedFilters.crimes} onChange={(val) => handleFilterUpdate('crimes', val)} />
                        <MultiSelect label="Severity Level" options={initialFilters.severities} selected={selectedFilters.severities} onChange={(val) => handleFilterUpdate('severities', val)} />
                    </div>
                    
                    <button 
                        onClick={() => onFilterChange(selectedFilters)} 
                        className="cursor-target mt-8 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl hover:from-blue-500 hover:to-indigo-500 shadow-[0_4px_14px_rgba(59,130,246,0.4)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.6)] transform hover:-translate-y-0.5 transition-all duration-300"
                    >
                        Apply Filters
                    </button>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;