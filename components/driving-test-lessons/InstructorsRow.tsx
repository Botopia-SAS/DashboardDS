"use client";

import React, { useState, useMemo } from "react";

export interface Instructor {
  _id: string;
  name: string;
  photo?: string;
  email?: string;
  canTeachDrivingTest?: boolean;
  canTeachDrivingLesson?: boolean;
  schedule_driving_test?: any[];
  schedule_driving_lesson?: any[];
}

interface InstructorsRowProps {
  instructors: Instructor[];
  centerSearch?: boolean;
  onInstructorSelect?: (instructor: Instructor) => void;
  selectedInstructor?: Instructor | null;
}

const MAX_VISIBLE = 4;

const InstructorsRow: React.FC<InstructorsRowProps> = ({ 
  instructors, 
  centerSearch, 
  onInstructorSelect,
  selectedInstructor 
}) => {
  const [search, setSearch] = useState("");
  const [start, setStart] = useState(0);

  const filtered = useMemo(() =>
    instructors
      .filter(i => 
        // Solo instructores que pueden enseñar driving test O driving lesson
        (i.canTeachDrivingTest === true || i.canTeachDrivingLesson === true) &&
        // Y que coincidan con la búsqueda
        i.name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name)),
    [search, instructors]
  );

  const visible = filtered.slice(start, start + MAX_VISIBLE);

  const canPrev = start > 0;
  const canNext = start + MAX_VISIBLE < filtered.length;

  const handleInstructorClick = (instructor: Instructor) => {
    if (onInstructorSelect) {
      onInstructorSelect(instructor);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <div className={centerSearch ? "flex justify-center" : undefined}>
        <input
          type="text"
          placeholder="Buscar instructor..."
          value={search}
          onChange={e => { setSearch(e.target.value); setStart(0); }}
          className="mb-4 px-4 py-2 w-64 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
        />
      </div>
      <div className="flex items-center gap-4 justify-center">
        <button
          onClick={() => setStart(s => Math.max(0, s - 1))}
          disabled={!canPrev}
          className={`rounded-full p-2 transition ${canPrev ? 'bg-blue-100 hover:bg-blue-200 text-blue-600' : 'bg-white text-gray-400 cursor-not-allowed'}`}
        >
          <span className="text-2xl">&#60;</span>
        </button>
        {visible.map(instr => {
          const isSelected = selectedInstructor?._id === instr._id;
          return (
            <div 
              key={instr._id} 
              className={`flex flex-col items-center w-56 mx-2 cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? 'transform scale-105' 
                  : 'hover:transform hover:scale-102'
              }`}
              onClick={() => handleInstructorClick(instr)}
            >
              <div className={`w-16 h-16 rounded-full overflow-hidden border-2 shadow-sm mb-2 bg-white flex items-center justify-center transition-all duration-200 ${
                isSelected 
                  ? 'border-blue-500 ring-4 ring-blue-100' 
                  : 'border-blue-200 hover:border-blue-300'
              }`}>
              <img
                src={instr.photo || '/logo.png'}
                alt={instr.name}
                className="object-cover w-full h-full"
                onError={e => (e.currentTarget.src = '/logo.png')}
              />
            </div>
              <div className={`text-sm font-medium text-center truncate w-full transition-colors duration-200 ${
                isSelected ? 'text-blue-600' : 'text-gray-700'
              }`} title={instr.name}>
                {instr.name}
              </div>
              {instr.email && (
                <div className={`text-xs text-center w-full break-all transition-colors duration-200 ${
                  isSelected ? 'text-blue-500' : 'text-gray-500'
                }`} title={instr.email}>
                  {instr.email}
                </div>
              )}
              {isSelected && (
                <div className="mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Selected
                </div>
              )}
          </div>
          );
        })}
        <button
          onClick={() => setStart(s => Math.min(filtered.length - MAX_VISIBLE, s + 1))}
          disabled={!canNext}
          className={`rounded-full p-2 transition ${canNext ? 'bg-blue-100 hover:bg-blue-200 text-blue-600' : 'bg-white text-gray-400 cursor-not-allowed'}`}
        >
          <span className="text-2xl">&#62;</span>
        </button>
      </div>
    </div>
  );
};

export default InstructorsRow; 