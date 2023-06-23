import { UnsignedEvent } from "nostr-tools"

export type MinerMessage = {
  command: string,
  data?: any
}

export type MinerResponse = "stopped" | "error" | "heartbeat" | "newhigh" | "complete"

export const WORKER_COUNT = 10
// 6 bytes is 281474976710655, which is slightly less than the max size of a number in javascript that still fits nicely into a Uint8Array 6 elemenst long.
// Divide up the max nonce into 6 equal parts, one for each worker.
export const BATCH_SIZE = Math.floor( 281474976710655 / WORKER_COUNT )

/**
 * Determine the beginning and ending index of the nonce in the serialized event
 * @param serializedEvent string
 * @returns beginning and end index of the nonce in the buffer
 */
export const getNonceBounds = (serializedEvent: string): Array<number> => {
  const nonceTag = '"nonce","'
  const nonceStart = serializedEvent.indexOf(nonceTag) + nonceTag.length
  const nonceEnd = serializedEvent.indexOf('"', nonceStart)
  return [nonceStart, nonceEnd]
}

/**
 * Seralize a nostr event into a string
 * @param event UnsignedEvent
 * @returns string
 */
export const serializeEvent = (event: UnsignedEvent): string => {
  return JSON.stringify([
    0,
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content
  ])
}

/**
 * Used to convert a nonce buffer into a number (big-endian)
 * 6 bytes is (slightly less than) the max size of a number in javascript: 
 * 6 bytes max is 281474976710655
 * A 6 byte nonce would take 89 years to mine every nonce at 100_000 hashes per
 * second, which is a typical speed on my gaming laptop.
 * @param uint8Array 
 * @returns number
 */
export const convertUint8ArrayToNumber = (uint8Array: Uint8Array): number => {
    // Ensure the Uint8Array is not longer than 6 bytes, 
    // because JavaScript's max safe integer is 2^53 - 1.
    if (uint8Array.length > 6) {
        throw new Error('Uint8Array too large, max 6 bytes for Number type')
    }

    let result = 0
    for (let i = 0; i < uint8Array.length; i++) {
        // Shift the current result to the left by 8 bits (i.e., multiply by 256) 
        // and add the next byte. This interprets the Uint8Array as a big-endian integer.
        result = (result * 256) + uint8Array[i]
    }
    return result
}

export const convertNumberToUint8Array = (num: number): Uint8Array => {
    if (num > Number.MAX_SAFE_INTEGER) {
        throw new Error('Number too large, must be less than or equal to ' + Number.MAX_SAFE_INTEGER)
    }

    const byteArray = []
    for(let i = 0; i < 6; i++) {
        // Extract the last byte of the number and unshift it into the array,
        // effectively creating a big-endian array of bytes.
        byteArray.unshift(num & 0xFF)

        // Right shift the number by 8 to move on to the next byte.
        // num = Math.floor(num / 256)
        num = num >> 8
    }

    // Remove leading zeros.
    while (byteArray.length > 0 && byteArray[0] === 0) {
        byteArray.shift()
    }

    return new Uint8Array(byteArray)
}

export const incrementNonceBuffer = (buffer: Uint8Array, startIndex: number, endIndex: number): Uint8Array => {
  // go from right to left to update count, because the number is big-endian
  for (let i = endIndex; i >= startIndex; i--) {
    if (buffer[i] === 255) {
      buffer[i] = 0
    } else {
      buffer[i]++
      break
    }
  }
  return buffer
}