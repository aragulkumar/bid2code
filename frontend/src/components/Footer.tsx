import React from 'react';
import { Code2, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-gray-800/80 bg-[#0B0F19] py-8 text-gray-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Code2 className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-white tracking-wide">BIT2CODE</span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400">IEEE Computer Society Student Branch</span>
        </div>

        <div className="text-center md:text-right">
          <p className="text-xs text-gray-500">
            Event Date: <span className="text-indigo-300 font-semibold">29 September 2026</span> • Sandboxed Execution via Judge0 CE
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Bid Smart. Code Smarter.
          </p>
        </div>
      </div>
    </footer>
  );
};
