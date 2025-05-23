import {
  addPluginListener,
  checkPermissions as checkPluginPermissions,
  invoke,
  PluginListener
} from '@tauri-apps/api/core'

const plugin_name = 'sms'

export type Sms = {
  from: string
  body: string
}

export type DeviceState = {
  state: boolean
  data: Record<string, any>
}

export async function checkPermissions(): Promise<{ sms: string }> {
  return checkPluginPermissions(plugin_name)
}

export async function requestPermissions(): Promise<{ sms: string }> {
  return invoke('plugin:sms|request_permissions', {
    permissions: ['sms']
  })
}

export async function onSmsReceived(
  handler: (sms: Sms) => void
): Promise<PluginListener> {
  return await addPluginListener(
    plugin_name,
    'sms-received',
    handler
  )
}

export async function sendSms(to: string, body: string): Promise<{ success: boolean }> {
  return invoke('plugin:sms|send_sms', {
    to,
    body
  })
}

export async function getState(state: string): Promise<{ state: boolean, data: Record<string, any> }> {
  return invoke('plugin:sms|get_state', {
    state
  }).then(({state, data}: any) => ({
      state,
      data: typeof data === 'string' ? JSON.parse(data) : data
    }
  ))
}

export async function invokeAction(action: string): Promise<{ result: boolean, data: Record<string, any> }> {
  return invoke('plugin:sms|invoke_action', {
    action
  }).then(({result, data}: any) => ({
      result,
      data: typeof data === 'string' ? JSON.parse(data) : data
    }
  ))
}

export async function onResume(
  handler: () => void
): Promise<PluginListener> {
  return await addPluginListener(
    plugin_name,
    'resume',
    handler
  )
}
