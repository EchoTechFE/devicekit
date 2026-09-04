/** An element assigned a property before `define()` runs gets it as an own instance property, which shadows the prototype's setter; re-set each one so the setter actually runs. */
export function upgradeProperties<T extends object>(el: T, keys: readonly (keyof T)[]): void {
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(el, key)) continue
    const value = el[key]
    delete el[key]
    el[key] = value
  }
}
