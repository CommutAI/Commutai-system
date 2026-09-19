import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface FormContextValue {
  values: Record<string, any>
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
  handleChange: (name: string, value: any) => void
  handleBlur: (name: string) => void
  setFieldValue: (name: string, value: any) => void
  setFieldError: (name: string, error: string) => void
}

const FormContext = createContext<FormContextValue | null>(null)

export function useForm() {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error('useForm must be used within a Form component')
  }
  return context
}

interface FormProps {
  initialValues?: Record<string, any>
  onSubmit: (values: Record<string, any>) => void | Promise<void>
  validate?: (values: Record<string, any>) => Record<string, string>
  children: ReactNode
  className?: string
}

export function Form({ initialValues = {}, onSubmit, validate, children, className }: FormProps) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    if (touched[name]) {
      if (validate) {
        const validationErrors = validate({ ...values, [name]: value })
        setErrors(validationErrors)
      }
    }
  }

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    if (validate) {
      const validationErrors = validate(values)
      setErrors(validationErrors)
    }
  }

  const setFieldValue = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
  }

  const setFieldError = (name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {}))
    
    if (validate) {
      const validationErrors = validate(values)
      setErrors(validationErrors)
      if (Object.keys(validationErrors).length > 0) {
        return
      }
    }

    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormContext.Provider
      value={{
        values,
        errors,
        touched,
        isSubmitting,
        handleChange,
        handleBlur,
        setFieldValue,
        setFieldError,
      }}
    >
      <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
        {children}
      </form>
    </FormContext.Provider>
  )
}

interface FormFieldProps {
  name: string
  label?: string
  required?: boolean
  children: (field: {
    value: any
    onChange: (value: any) => void
    onBlur: () => void
    error?: string
    touched: boolean
  }) => ReactNode
}

export function FormField({ name, label, required, children }: FormFieldProps) {
  const { values, errors, touched, handleChange, handleBlur } = useForm()
  const error = touched[name] ? errors[name] : undefined

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      {children({
        value: values[name],
        onChange: (value: any) => handleChange(name, value),
        onBlur: () => handleBlur(name),
        error,
        touched: touched[name],
      })}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function Select({ value, onChange, options, placeholder, disabled, className }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg',
        'text-white placeholder-gray-400',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
}

export function Checkbox({ checked, onChange, label, disabled, className }: CheckboxProps) {
  return (
    <label className={cn('flex items-center gap-2 cursor-pointer', disabled && 'cursor-not-allowed opacity-50', className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-primary-600 focus:ring-primary-500 focus:ring-offset-gray-900"
      />
      {label && <span className="text-sm text-gray-300">{label}</span>}
    </label>
  )
}

interface FormActionsProps {
  children: ReactNode | ((props: { isSubmitting: boolean }) => ReactNode)
  className?: string
}

export function FormActions({ children, className }: FormActionsProps) {
  const { isSubmitting } = useForm()
  return (
    <div className={cn('flex items-center gap-3 pt-4', className)}>
      {typeof children === 'function' ? (children as (props: { isSubmitting: boolean }) => ReactNode)({ isSubmitting }) : children}
    </div>
  )
}
