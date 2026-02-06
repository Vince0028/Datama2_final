import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface StaffLayoutProps {
    children: ReactNode;
}

export function StaffLayout({ children }: StaffLayoutProps) {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="ml-0 md:ml-64 min-h-screen p-4 md:p-8 transition-all duration-300">
                {children}
            </main>
        </div>
    );
}
