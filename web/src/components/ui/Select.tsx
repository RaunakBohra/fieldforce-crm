import { Fragment, useState } from 'react'
import { Combobox, Transition } from '@headlessui/react'
import { Check, ChevronDown, Loader2 } from 'lucide-react'

export interface SelectOption {
  id: string | number
  label: string
  sublabel?: string
  disabled?: boolean
}

interface SelectProps {
  value: string | number | ''
  onChange: (value: string | number) => void
  options: SelectOption[]
  placeholder?: string
  loading?: boolean
  error?: string
  required?: boolean
  disabled?: boolean
  searchable?: boolean
  onCreate?: (query: string) => void
  'aria-label': string
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  loading = false,
  error,
  required = false,
  disabled = false,
  searchable = true,
  onCreate,
  'aria-label': ariaLabel,
}: SelectProps) {
  const [query, setQuery] = useState('')

  const filteredOptions =
    query === ''
      ? options
      : options.filter((option) =>
          option.label.toLowerCase().includes(query.toLowerCase())
        )

  const selectedOption = options.find((opt) => opt.id === value)

  const handleChange = (newValue: string | number | null) => {
    if (newValue !== null) {
      onChange(newValue)
    }
  }

  return (
    <div className="w-full">
      <Combobox value={value || undefined} onChange={handleChange} disabled={disabled || loading}>
        <div className="relative">
          <div className="relative">
            <Combobox.Input
              className={`input-field w-full pr-10 ${
                error ? 'border-danger-500 focus:ring-danger-500' : ''
              }`}
              displayValue={() => selectedOption?.label || ''}
              onChange={(e) => searchable && setQuery(e.target.value)}
              placeholder={placeholder}
              aria-label={ariaLabel}
              aria-required={required}
              aria-invalid={!!error}
              aria-describedby={error ? `${ariaLabel}-error` : undefined}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
              {loading ? (
                <Loader2 className="h-5 w-5 text-neutral-400 animate-spin" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-5 w-5 text-neutral-400" aria-hidden="true" />
              )}
            </Combobox.Button>
          </div>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              {filteredOptions.length === 0 && query !== '' ? (
                <div className="relative px-4 py-8 text-center text-neutral-500">
                  {onCreate ? (
                    <button
                      type="button"
                      onClick={() => {
                        onCreate(query)
                        setQuery('')
                      }}
                      className="text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
                    >
                      Create "{query}"
                    </button>
                  ) : (
                    'No results found'
                  )}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <Combobox.Option
                    key={option.id}
                    value={option.id}
                    disabled={option.disabled}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-3 pl-10 pr-4 ${
                        active ? 'bg-primary-50 text-primary-900' : 'text-neutral-900'
                      } ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <div className="flex flex-col">
                          <span
                            className={`block truncate ${
                              selected ? 'font-semibold' : 'font-normal'
                            }`}
                          >
                            {option.label}
                          </span>
                          {option.sublabel && (
                            <span className="text-sm text-neutral-500">
                              {option.sublabel}
                            </span>
                          )}
                        </div>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
                            <Check className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>

      {error && (
        <p
          id={`${ariaLabel}-error`}
          className="mt-1 text-sm text-danger-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}
