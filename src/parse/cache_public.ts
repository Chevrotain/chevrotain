import { clearCache as internalClearCache } from "./cache"

export function clearCache(): void {
    internalClearCache()
}
