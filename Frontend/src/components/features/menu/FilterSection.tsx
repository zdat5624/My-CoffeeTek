'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FilterSectionProps {
    title: string;
    children: React.ReactNode;
    isOpenDefault?: boolean;
}

export const FilterSection = ({
    title,
    children,
    isOpenDefault = true
}: FilterSectionProps) => {
    const [isOpen, setIsOpen] = useState(isOpenDefault);

    return (
        <div className="border-b border-gray-200 py-5 last:border-0">
            <div
                className="flex justify-between items-center cursor-pointer mb-3"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h4 className="font-bold text-gray-800">{title}</h4>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                    {children}
                </div>
            )}
        </div>
    );
};