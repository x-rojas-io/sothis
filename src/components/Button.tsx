import React from 'react';
import { Link } from '@/i18n/routing';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    href?: string;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    target?: string;
    rel?: string;
}

export default function Button({
    children,
    href,
    variant = 'primary',
    size = 'md',
    className,
    ...props
}: ButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
        primary: 'bg-primary text-primary-foreground hover:bg-stone-800',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-amber-800',
        outline: 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
    };

    const sizes = {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-8 text-lg',
    };

    const styles = clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        className
    );

    if (href) {
        // Remove button-specific props that are invalid for links
        const { type, ...rest } = props;
        return (
            <Link href={href} className={styles} {...(rest as any)}>
                {children}
            </Link>
        );
    }

    return (
        <button className={styles} {...props}>
            {children}
        </button>
    );
}
