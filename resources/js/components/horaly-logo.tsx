interface HoralyLogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export default function HoralyLogo({ className = '', size = 'md' }: HoralyLogoProps) {
    const sizeClasses = {
        sm: 'h-8',
        md: 'h-12',
        lg: 'h-16',
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <img src="/logo.png" alt="Horaly" className={`${sizeClasses[size]} object-contain`} />
        </div>
    );
}
