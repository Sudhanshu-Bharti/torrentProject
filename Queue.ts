"use strict"

import {BLOCK_LEN,blockLen,blocksPerPiece,infoHash,open,pieceLen,size} from "./torrent-parser"

export class QueueObj{
    _torrent: any
    _queue: { index: number, begin: number, length: number }[] // _queue array
    choked: boolean
    constructor(torrent){
        this._torrent=torrent,
        this._queue= [],
        this.choked=true
        
    }

    queue(pieceIndex){
        const nBlocks = blocksPerPiece(this._torrent , pieceIndex)
        for (let i = 0; i < nBlocks; i++) {
            const pieceBlock = {
                index: pieceIndex,
                begin: i* BLOCK_LEN,
                length: blockLen(this._torrent, pieceIndex, i)
            }
            this._queue.push(pieceBlock)
        }
    }
    dequeue(){
        return this._queue.shift()
    }
    peek(){
        return this._queue[0]
    }
    length(){
        return this._queue.length
    }

}
