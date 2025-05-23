import type {Sms} from "tauri-plugin-sms-api"
import {checkPermissions, requestPermissions, sendSms as sendSmsMessage} from "tauri-plugin-sms-api"
import type {Settings} from "$lib/settings"

export function normalizeNumber(number: string): string {
  return number.replace('+216', '').replace(/\s/g, '')
}

export function validateSms(sms: Sms, settings: Settings): { valid: boolean, reason: string } {
  if (!settings) {
    return {valid: false, reason: 'No settings'}
  }

  const {body, from} = sms

  const from_number = normalizeNumber(from)

  if (!settings || !body.startsWith(settings.password)) {
    return {valid: false, reason: 'Invalid password'}
  }
  if (settings.from && !settings.from.split(',').includes(from_number)) {
    return {valid: false, reason: 'Invalid from number'}
  }

  return {valid: true, reason: ''}
}

export function getSmsCommand(body: string): string | undefined {
  return body.split(' ')[1]
}

export async function sendSMS(to: string, body: string): Promise<boolean> {
  const {sms} = await checkPermissions()
  if (sms !== 'granted') {
    const {sms} = await requestPermissions()
    if (sms !== 'granted') {
      return false
    }
  }

  const {success} = await sendSmsMessage(to, body)
  return success
}
