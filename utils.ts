"use strict"
import crypto from "crypto"

let id: Buffer | null = null

const genId=() => {
    try {
        if (!id) {
            id = crypto.randomBytes(20)
            // “AT” is the name of my client, and 0001 is the version number.
            Buffer.from('-AT0001-').copy(id, 0)
        }
        return id
    } catch (error) {
        console.error("Error generating ID:", error)
        throw error
    }
}

export default genId