import React from 'react'

interface ErrorBoundaryProps {
  /** Label used in the console report to identify which area failed. */
  name: string
  children: React.ReactNode
  fallback?: React.ReactNode
  /** Called once when an error is caught (e.g. to close the overlay that failed). */
  onError?: (error: Error) => void
  /** Changing this value clears the error state so the area can render again. */
  resetKey?: unknown
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Contains render errors to one area of the page. Without it, a single failing overlay
 * (React 18 default behaviour) unmounts the entire application and leaves a blank page.
 */
export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[TOBI XP] ${this.props.name} failed to render:`, error, info.componentStack)
    this.props.onError?.(error)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null
    return this.props.children
  }
}
