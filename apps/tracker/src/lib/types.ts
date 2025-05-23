import type {Device} from "$lib/settings"

export type Coords = {
  latitude: number;
  longitude: number;
};

export type DeviceLocation = {
  id: string
  location: Coords;
  device: Device
};
