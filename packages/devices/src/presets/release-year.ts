import type { DeviceProfile, PresetDeviceProfile } from '../devices.js'

const byYear = (year: number, names: readonly string[]): Record<string, number> =>
  Object.fromEntries(names.map((name) => [name, year]))

/**
 * Calendar year in which the model represented by each preset was released.
 * Names that intentionally group several generations use the earliest model
 * in that name, keeping chronological sorting deterministic without claiming
 * that the grouped models were released together.
 */
const RELEASE_YEAR_BY_NAME: Readonly<Record<string, number>> = {
  ...byYear(2010, ['iPhone 4']),
  ...byYear(2012, ['iPhone 5', 'iPhone 5/SE', 'Galaxy Note II', 'Galaxy S III', 'Nexus 4', 'Nexus 7', 'Nexus 10']),
  ...byYear(2013, ['Nexus 5', 'Galaxy Note 3']),
  ...byYear(2014, ['iPhone 6', 'iPhone 6 Plus', 'iPhone 6/7/8', 'iPhone 6/7/8 Plus', 'LG Optimus L70', 'Galaxy S5', 'Nexus 6']),
  ...byYear(2015, ['Nexus 5X', 'Nexus 6P', 'iPad Pro 12.9-inch']),
  ...byYear(2016, ['iPhone 7', 'iPhone 7 Plus', 'Moto G4']),
  ...byYear(2017, ['iPhone 8', 'iPhone 8 Plus', 'iPhone X', 'iPad', 'iPad Pro 10.5-inch', 'iPad (gen 5)', 'Samsung Galaxy S8+', 'Pixel 2', 'Pixel 2 XL']),
  ...byYear(2018, ['iPhone XR', 'iPhone XS Max', 'iPad (gen 6)', 'iPad Pro 11', 'iPad Pro', 'Galaxy S9+', 'Galaxy Tab S4', 'Pixel 3', 'Pixel 3 XL']),
  ...byYear(2019, ['iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max', 'iPad (gen 7)', 'Pixel 4', 'Samsung Galaxy A51/71', 'Galaxy Fold']),
  ...byYear(2020, ['iPhone SE', 'iPhone 12', 'iPhone 12 Pro', 'iPhone 12 Pro Max', 'iPhone 12 Mini', 'iPhone 12/13 mini', 'iPhone 12/13 (Pro)', 'iPhone 12/13 Pro Max', 'iPad Air', 'Samsung Galaxy S20 Ultra', 'Surface Duo', 'Surface Duo (inner)', 'Galaxy S20', 'Galaxy S20 Plus', 'Pixel 4a (5G)', 'Pixel 5']),
  ...byYear(2021, ['iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max', 'iPhone 13 Mini', 'iPad Mini', 'Moto G Power', 'Galaxy S21', 'Galaxy S21 Plus', 'Galaxy S21 Ultra', 'Samsung S21 FE', 'Galaxy Fold3 (Folded)', 'Galaxy Fold3 (Unfolded)', 'Pixel 6', 'Pixel 6 Pro']),
  ...byYear(2022, ['iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max', 'iPhone SE (3rd gen)', 'Galaxy S22', 'Galaxy S22 Plus', 'Galaxy S22 Ultra', 'Pixel 6a', 'Pixel 7', 'Pixel 7 Pro', 'Galaxy Z Fold 4']),
  ...byYear(2023, ['iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max', 'Galaxy Tab S9', 'Galaxy S23', 'Galaxy S23 Plus', 'Galaxy S23 Ultra', 'Galaxy Z Fold 5', 'Galaxy Z Fold 5 (inner)', 'Galaxy Z Flip 5', 'Pixel 7a', 'Pixel 8', 'Pixel 8 Pro', 'Pixel Fold', 'Pixel Tablet', 'Nothing Phone 2', 'Motorola Razr+', 'OnePlus Open', 'HUAWEI Mate 60', 'HUAWEI Mate 60 Pro', 'HUAWEI Mate X5 (inner)', 'HUAWEI Mate X5 (outer)', 'HUAWEI nova 12', 'HUAWEI nova 12 Pro']),
  ...byYear(2024, ['iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max', 'iPad Pro 13', 'iPad Pro M4', 'iPad Air M2', 'Samsung Galaxy A55', 'Pixel 8a', 'Pixel 9', 'Pixel 9 Pro', 'Pixel 9 Pro XL', 'Pixel 9 Pro Fold', 'Pixel 9 Pro Fold (inner)', 'Galaxy S24', 'Galaxy S24 Plus', 'Galaxy S24 Ultra', 'Galaxy Z Fold 6', 'Galaxy Z Fold 6 (inner)', 'Galaxy Z Fold 6 Cover', 'Galaxy Z Flip 6', 'Galaxy Z Flip 6 Cover', 'OnePlus 12', 'Xiaomi 14', 'HUAWEI Mate 70', 'HUAWEI Mate 70 Pro', 'HUAWEI Mate X6 (inner)', 'HUAWEI Mate X6 (outer)', 'HUAWEI Pura 70', 'HUAWEI Pura 70 Pro', 'HUAWEI Pocket 2', 'HUAWEI nova 13', 'HUAWEI nova 13 Pro']),
  ...byYear(2025, ['iPhone 16e', 'iPad (gen 11)', 'iPhone 17', 'iPhone Air', 'iPhone 17 Air', 'iPhone 17 Pro', 'iPhone 17 Pro Max', 'Pixel 10', 'Pixel 10 Pro', 'Pixel 10 Pro XL', 'Pixel 9a', 'Galaxy Z Fold 7', 'Galaxy Z Fold 7 Cover', 'Galaxy Z Flip 7', 'Galaxy Z Flip 7 Cover', 'HUAWEI Mate 80', 'HUAWEI Pura 80 Pro', 'HUAWEI nova 14 Ultra', 'HUAWEI Pura X (inner)', 'HUAWEI Pura X (outer)']),
  ...byYear(2026, ['iPhone 17e', 'HUAWEI Pura X Max (outer)', 'HUAWEI Pura X Max (inner)']),
}

export function withReleaseYears(devices: readonly DeviceProfile[]): readonly PresetDeviceProfile[] {
  return devices.map((device) => {
    const releaseYear = RELEASE_YEAR_BY_NAME[device.name]
    if (releaseYear === undefined) throw new Error(`No release year recorded for ${JSON.stringify(device.name)}`)
    return { ...device, releaseYear }
  })
}
