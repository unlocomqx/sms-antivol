export type Device = {
  id: string
  name: string
  number: string
}

export type Settings = {
  target: string
  from: string
  password: string
  devices: Record<string, Device>
}

export const default_settings: Settings = {
  target: '',
  from: '',
  password: '',
  devices: {
    "22222222": {
      id: "22222222",
      name: 'My car',
      number: '22222222'
    }
  }
}
