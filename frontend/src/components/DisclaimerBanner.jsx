import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const DisclaimerBanner = () => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-6 flex items-start gap-3 shadow-xs">
      <div className="p-2 bg-amber-100/80 rounded-lg text-amber-700 shrink-0">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
        <span className="font-bold text-amber-950 block mb-0.5">
          NON-DIAGNOSTIC MEDICAL INFORMATION ASSISTANT
        </span>
        This system organizes, retrieves, and translates your uploaded official medical documents. It does <strong>not</strong> independently diagnose medical conditions, prescribe medication, or modify doctor instructions. Always consult a licensed healthcare professional for medical advice.
      </div>
    </div>
  );
};
