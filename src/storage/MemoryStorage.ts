import redis, { RedisClient } from 'redis-mock'
import { Storage } from './Storage'

export class MemoryStorage implements Storage<string, string> {
  private connection: RedisClient

  constructor() {
    this.connection = redis.createClient()
  }

  async set(key: string, value: string) {
    this.connection.set(key, value)
  }
  async get(key: string) {
    return new Promise<string>((resolve) => {
      this.connection.get(key, (_, value) => {
        resolve(value)
      })
    })
  }

  async expireIn(key: string, seconds: number) {
    this.connection.expire(key, seconds)
  }

  async delete(key: string) {
    this.connection.del(key)
  }

  async clear() {
    this.connection.flushall()
  }

  dispose(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.connection.quit((error) => {
        error ? reject(error) : resolve()
      })
    })
  }
}
