/**
 * Static, frontend-only analytics helper for TOBI XP Portfolio.
 * Operates purely locally in the browser with zero external dependencies and zero network requests.
 */

export interface TrackEventPayload {
  name: string
  params?: Record<string, any>
  timestamp?: number
}

export async function initAnalytics(): Promise<boolean> {
  return true
}

export async function trackEvent(_name: string, _params: Record<string, any> = {}): Promise<void> {
  // Local no-op for static, backend-free operation
}

export function trackPageView(_pageName: string, _path: string = '/'): void {
  // Static frontend page view tracker
}

export function trackWorkView(_params: {
  workId: string
  title?: string
  categoryId?: string
  workGroupId?: string
  disciplineIds?: string[]
}): void {
  // Static frontend work view tracker
}

export function trackCategoryView(_params: {
  categoryId: string
  categorySlug?: string
  name?: string
}): void {
  // Static frontend category view tracker
}

export function trackWorkGroupView(_params: {
  workGroupId: string
  categoryId?: string
  name?: string
}): void {
  // Static frontend work group view tracker
}

export function trackContactInteraction(
  _action: 'view' | 'email_click' | 'social_click' | 'form_start' | 'form_submit' | 'form_success' | 'form_error'
): void {
  // Static frontend contact interaction tracker
}

export function trackDownload(_params: { assetType: string; assetName: string }): void {
  // Static frontend download tracker
}

export function trackSocialClick(_platform: string): void {
  // Static frontend social click tracker
}

export function trackMenuInteraction(_params: { action: 'open' | 'click'; item?: string }): void {
  // Static frontend menu interaction tracker
}

export function trackAudioInteraction(_params: {
  action: 'play' | 'pause' | 'mute' | 'unmute' | 'volume_change'
  volumeBucket?: string
}): void {
  // Static frontend audio interaction tracker
}

export function trackThemeToggle(_params: { from: 'light' | 'dark'; to: 'light' | 'dark' }): void {
  // Static frontend theme toggle tracker
}

export function trackScrollMilestone(_milestone: 25 | 50 | 75 | 90, _page: string = 'Home'): void {
  // Static frontend scroll milestone tracker
}

export function trackMediaInteraction(_params: { mediaId: string; type?: string; name?: string }): void {
  // Static frontend media interaction tracker
}

export function recordEngagementTime(_durationSeconds: number, _page: string = 'Home'): void {
  // Static frontend engagement tracker
}

export function resetAnalyticsData(): void {
  // Static frontend analytics reset
}
