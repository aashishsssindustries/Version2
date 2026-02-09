import { useState, InputHTMLAttributes, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    error?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ className = '', error, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);

        return (
            <div className="password-input-wrapper">
                <input
                    ref={ref}
                    type={showPassword ? 'text' : 'password'}
                    className={`input ${error ? 'input-error' : ''} ${className}`}
                    {...props}
                />
                <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
        );
    }
);

PasswordInput.displayName = 'PasswordInput';
