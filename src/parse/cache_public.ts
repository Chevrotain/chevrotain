import { clearCache as internalClearCache } from "./cache"

/**
 * Clears the chevrotain internal cache.
 * This should not be used in regular work flows, This is intended for
 * unique use cases for example: online playground where the a parser with the same name is initialized with
 * different implementations multiple times.
 */
export function clearCache(): void {
	internalClearCache()
}
