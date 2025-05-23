import {browser} from '$app/environment'

export class LocalStore<T> {
  value = $state<T>() as T
  key = ''

  constructor(key: string, value: T) {
    this.key = key
    this.value = value

    if (browser) {
      const item = localStorage.getItem(key)
      if (item) this.value = this.deserialize(item)
    }

    $effect.root(() => {
      $effect(() => {
        $inspect(this.value)
        if (this.value) {
          localStorage.setItem(this.key, this.serialize(this.value))
        } else {
          localStorage.removeItem(this.key)
        }
      })
    })
  }

  serialize(value: T): string {
    return JSON.stringify(value)
  }

  deserialize(item: string): T {
    return JSON.parse(item)
  }
}
