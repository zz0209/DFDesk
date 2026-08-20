import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export default function TacticalSelect({ value, options, onChange, ariaLabel, icon: Icon, meta, className = '' }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const listId = useId()
  const normalized = options.map((option) => typeof option === 'string' ? { value: option, label: option } : option)
  const selectedIndex = Math.max(0, normalized.findIndex((option) => option.value === value))
  const selected = normalized[selectedIndex]

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  const choose = (next) => {
    onChange?.(next)
    setOpen(false)
  }

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }
    if (!['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) return
    event.preventDefault()
    if (!open) {
      setOpen(true)
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      choose(selected.value)
      return
    }
    const direction = event.key === 'ArrowDown' ? 1 : -1
    const nextIndex = (selectedIndex + direction + normalized.length) % normalized.length
    onChange?.(normalized[nextIndex].value)
  }

  return (
    <div className={`tactical-select ${className}`} ref={rootRef}>
      <button
        type="button"
        className="tactical-select-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onKeyDown}
      >
        {Icon && <Icon aria-hidden="true" />}
        {meta && <small>{meta}</small>}
        <span>{selected?.label}</span>
        <ChevronDown className={open ? 'open' : ''} aria-hidden="true" />
      </button>
      {open && <div className="tactical-select-menu" id={listId} role="listbox" aria-label={ariaLabel}>
        {normalized.map((option) => <button
          type="button"
          role="option"
          aria-selected={option.value === value}
          className={option.value === value ? 'selected' : ''}
          onClick={() => choose(option.value)}
          key={option.value}
        >
          <Check aria-hidden="true" />
          <span>{option.label}</span>
        </button>)}
      </div>}
    </div>
  )
}
