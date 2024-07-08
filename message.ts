'use strict'

import {infoHash,open,size} from "./torrent-parser"
import genId from "./utils"


export const buildHandshake =(torrent) => {
    const buf = Buffer.alloc(68)
    //pstrlen
    buf.writeUint8(19,0)
    //pstr
    buf.write('BitTorrent Protocol', 1)
    //reserved
    buf.writeUint32BE(0,20)
    buf.writeUint32BE(0,24)
    //infohash
    infoHash(torrent).copy(buf,28)

    //peer id
    buf.write(genId().toString())

    return buf
}

export const buildKeepAlive =() => { Buffer.alloc(4)}


export const buildChoke =() => {
    const buf = Buffer.alloc(5)
    //lentth
    buf.writeUint32BE(1,0)
    //id
    buf.writeUint8(0,4)
    return buf
}
export const buildUnchoke =() => {
    const buf = Buffer.alloc(5)
    //lentth
    buf.writeUint32BE(1,0)
    //id
    buf.writeUint8(1,4)
    return buf
}

export const buildInterested= () => {
    const buf = Buffer.alloc(5)
    //len
    buf.writeUint32BE(1,0)
    //id
    buf.writeUint8(2,4)
    return buf
}
export const buildUnInterested= () => {
    const buf = Buffer.alloc(5)
    //len
    buf.writeUint32BE(1,0)
    //id
    buf.writeUint8(3,4)
    return buf
}

export const buildHave =(payload) => {
    const buf = Buffer.alloc(9)
    //len
    buf.writeUInt32BE(5,0)
    //id
    buf.writeUInt8(4,4)
    //piece indx
    buf.writeUInt32BE(payload,5)
    return buf
}

export const buildBitfield = (bitfield )=>{
    const buf = Buffer.alloc(14)
    //len
    buf.writeUInt32LE(bitfield.length +1 , 0)
    // id
    buf.writeUInt8(5, 4);
    // bitfield
    bitfield.copy(buf, 5);
    return buf;
}

export const buildRequest =(payload) => {
    const buf = Buffer.alloc(17)
    //len
    buf.writeUInt32BE(13,0)
    //id
    buf.writeUInt8(6,4)
    //piece indx
    buf.writeUInt32BE(payload.index, 5);
    // begin
    buf.writeUInt32BE(payload.begin, 9);
    // length
    buf.writeUInt32BE(payload.length, 13);

    return buf;
}

export const buildPiece =( payload) => {
    const buf = Buffer.alloc(payload.block.length + 13)
    //len
    buf.writeUInt32BE(payload.block.length + 9,0)
    //id
    buf.writeUInt8(7,4)
    //piece indx
    buf.writeUInt32BE(payload.index , 5)
    //begin
    buf.writeUInt32BE(payload.begin, 9)
    //block
    payload.block.copy(buf,13)

    return buf
}

export const buildCancel =(payload) => {
    const buf = Buffer.alloc(17)
    //len
    buf.writeUInt32BE(13,0)
    //id
    buf.writeUInt8(8,4)
    //piece indx
    buf.writeUInt32BE(payload.index,5)
    //begin
    buf.writeUInt32BE(payload.begin, 9)
    //len
    buf.writeUInt32BE(payload.length, 13)
    
    return buf
}

export const buildPort =(payload) => {
    const buf = Buffer.alloc(7)

    //len
    buf.writeUInt32BE(3,0)
    //id
    buf.writeUInt8(9,4)
    //listenPort
    buf.writeUInt16BE(payload,5)

    return buf
}