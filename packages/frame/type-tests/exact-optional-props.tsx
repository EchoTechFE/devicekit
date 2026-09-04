/**
 * `DeviceFrameProps` and `DeviceFrameIntrinsicAttributes` declare their
 * optional fields as `T | undefined` in spirit — every one of them means
 * "the caller may not pass this" — but only a type that spells out `| undefined`
 * on the property itself satisfies a consumer building with
 * `exactOptionalPropertyTypes`. A consumer passing through a value that is
 * itself typed `T | undefined` (the ordinary shape of an optional prop
 * threaded down from another optional prop) has to be accepted, not forced
 * into stripping the key with a conditional spread. This file is never run —
 * `tsc --noEmit` over it is the whole test — so a red compile here is a
 * regression in the public prop types, not a runtime failure.
 */
import type { DeviceProfile } from '@devicekit/devices'
import type { DeviceFrameIntrinsicAttributes, DeviceFrameProps } from '../src/react/index.js'
import { DeviceFrame } from '../src/react/index.js'

declare const maybe: string | undefined
declare const maybeProfile: DeviceProfile | null | undefined

const _props: DeviceFrameProps = {
  device: maybe,
  deviceProfile: maybeProfile,
  orientation: undefined,
  embedded: undefined,
}

const _el = <DeviceFrame device={maybe} os={undefined} statusBar={undefined} />

const _intrinsic: DeviceFrameIntrinsicAttributes = {
  device: maybe,
  os: undefined,
  orientation: undefined,
}

const _intrinsicEl = <device-frame device={maybe} os={undefined} orientation={undefined} />
