import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import './Button.css'

export type ButtonVariant = 'primary' | 'secondary' | 'accent'

interface SharedProps {
  variant?: ButtonVariant
  children: ReactNode
}

type ButtonProps = SharedProps & ButtonHTMLAttributes<HTMLButtonElement>
type ButtonLinkProps = SharedProps & Omit<LinkProps, 'children'>

function classes(variant: ButtonVariant, extra?: string) {
  return ['btn', `btn--${variant}`, extra].filter(Boolean).join(' ')
}

export function Button({ variant = 'primary', className, children, ...rest }: ButtonProps) {
  return (
    <button type="button" className={classes(variant, className)} {...rest}>
      {children}
    </button>
  )
}

/** A link (real <a>) that looks like a button, for navigation. */
export function ButtonLink({ variant = 'primary', className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={classes(variant, className)} {...rest}>
      {children}
    </Link>
  )
}
