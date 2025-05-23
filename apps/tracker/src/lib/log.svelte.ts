class Log {
  public messages = $state<Array<string>>([])

  public push(message: string) {
    this.messages.push(message)
  }
}

export const log = new Log()
