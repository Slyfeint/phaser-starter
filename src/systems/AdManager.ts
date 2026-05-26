// Ad manager — stub implementation. Replace window.show_ad() with real ad SDK call.
// Supports: Google AdSense, AdColony, Unity Ads, or any VAST-compatible SDK.

export type AdRewardType = 'revive' | 'double_gold' | 'reroll_shop'

export interface AdReward {
  type: AdRewardType
  granted: boolean
}

let _pendingResolve: ((r: AdReward) => void) | null = null

export const AdManager = {
  isAvailable(): boolean {
    // Check if ad SDK is loaded. Return true in stub mode.
    return true // Replace with: return typeof window.show_ad === 'function'
  },

  requestAd(type: AdRewardType): Promise<AdReward> {
    return new Promise((resolve) => {
      _pendingResolve = resolve
      // STUB: Simulate ad completion after 1 second (replace with real SDK call)
      console.log(`[AdManager] Requesting ad for reward: ${type}`)
      setTimeout(() => {
        AdManager.grantReward(type)
      }, 1000)
      // Real implementation: window.show_rewarded_ad({ onComplete: () => AdManager.grantReward(type), onSkip: () => resolve({ type, granted: false }) })
    })
  },

  grantReward(type: AdRewardType) {
    if (_pendingResolve) {
      _pendingResolve({ type, granted: true })
      _pendingResolve = null
    }
  },
}
