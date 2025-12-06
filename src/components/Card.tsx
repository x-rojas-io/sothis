import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export default function Card({ children, className }: CardProps) {
    return (
        <div className={clsx('bg-white rounded-lg shadow-md overflow-hidden border border-stone-100', className)}>
            {children}
        </div>
    );
}

export function CardHeader({ children, className }: CardProps) {
    return <div className={clsx('p-6 pb-3', className)}>{children}</div>;
}

export function CardContent({ children, className }: CardProps) {
    return <div className={clsx('p-6 pt-0', className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardProps) {
    return <div className={clsx('p-6 pt-0 flex items-center', className)}>{children}</div>;
}
