import type {Coords} from "./types"

class CurrentLocation {
  public coords = $state<Coords>()

  public set(coords: Coords) {
    this.coords = coords
  }
}

export const current_location = new CurrentLocation()
