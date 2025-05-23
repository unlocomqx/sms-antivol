import {checkPermissions, getCurrentPosition, type Position, requestPermissions} from "@tauri-apps/plugin-geolocation"
import type {Coords} from "$lib/types"

export async function getCurrentLocation(): Promise<Position | undefined> {
  const {location} = await checkPermissions()
  if (location !== 'granted') {
    const {location} = await requestPermissions(['location'])
    if (location !== 'granted') {
      return
    }
  }

  return await getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 5000,
  })
}

export function getGoogleMapsLink({latitude, longitude}: Coords) {
  return `https://www.google.com/maps?q=${latitude},${longitude}&ll=${latitude},${longitude}&z=20`
}
