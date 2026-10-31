import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur'> {
  label?: string;
  name: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  hint,
  leftIcon,
  rightIcon,
  disabled = false,
  required = false,
  className = '',
  ...rest
}) => {
  const inputClasses = [
    'input',
    error ? 'input-error' : '',
    leftIcon ? 'input-has-left-icon' : '',
    rightIcon ? 'input-has-right-icon' : '',
    disabled ? 'input-disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="input-field">
      {label && (
        <label htmlFor={name} className="input-label">
          {label}
          {required && <span className="input-required" aria-hidden="true"> *</span>}
        </label>
      )}
      <div className="input-wrapper">
        {leftIcon && (
          <span className="input-icon input-icon-left" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${name}-error` : hint ? `${name}-hint` : undefined
          }
          className={inputClasses}
          {...rest}
        />
        {rightIcon && (
          <span className="input-icon input-icon-right" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </div>
      {error && (
        <p id={`${name}-error`} className="input-error-text" role="alert">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${name}-hint`} className="input-hint-text">
          {hint}
        </p>
      )}
    </div>
  );
};

export default Input;
