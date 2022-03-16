import EventEmitter from 'events'
import { useCallback, useEffect, useState } from 'react'

export const LEADER = Symbol()

class ValueEmitter extends EventEmitter {
  led = true
}
const cache = new Map<string, ValueEmitter>()

export default function useLeader<T>(key?: string): [T | undefined | typeof LEADER, (update?: T) => T | undefined] {
  const [emitter, setEmitter] = useState<ValueEmitter | undefined>()
  const [isLeader, setIsLeader] = useState(false)
  const [value, setValue] = useState<T | undefined>()

  const setLeader = useCallback(
    (emitter) => {
      if (!emitter.led) {
        emitter.led = true
        setIsLeader(true)
        emitter.off('value', setValue)
        emitter.off('leader', setLeader)
      }
    },
    [setIsLeader]
  )

  useEffect(() => {
    if (key) {
      const emitter = cache.get(key)
      if (!emitter) {
        // Claim leadership if there is no leader.
        const emitter = new ValueEmitter()
        setIsLeader(true)
        setEmitter(emitter)

        // Abdicate leadership when unmounting.
        return () => {
          emitter.emit('leader', emitter)
        }
      } else {
        setIsLeader(false)
        setEmitter(emitter)

        emitter.on('value', setValue)
        emitter.on('leader', setLeader)
        return () => {
          emitter.off('value', setValue)
          emitter.off('leader', setLeader)
        }
      }
    }
    return
  }, [key, setLeader])

  const setCacheValue = useCallback(
    (update?: T) => {
      if (emitter && isLeader) {
        emitter.emit('value', update)
      }
      return update
    },
    [emitter, isLeader]
  )

  return [emitter ? LEADER : value, setCacheValue]
}
