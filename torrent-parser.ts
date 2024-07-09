"use strict";
import fs from 'fs';
import bencodec from 'bencodec';
import crypto from "crypto";

export const BLOCK_LEN = Math.pow(2,14)

export const pieceLen = (torrent, pieceIndex) => {
    const totalLen = BigInt(torrent != null && size(torrent).toString());
    const pieceLen = torrent.info['piece length']

    const lastPieceLen = totalLen % pieceLen
    const lastPieceIndex = Math.floor(Number(totalLen) / pieceLen)

    return lastPieceIndex ===pieceIndex ? lastPieceLen : pieceLen
}

export const blocksPerPiece = (torrent , pieceIndex) => {
    const pieceLength = pieceLen(torrent,pieceIndex)
    return Math.ceil(pieceLength / BLOCK_LEN)
}

export const blockLen = (torrent, pieceIndex, blockIndex) => {
    const pieceLength = pieceLen(torrent, pieceIndex)

    const lastPieceLen = pieceLength % BLOCK_LEN
    const lastPieceIndex = Math.floor(pieceLength / BLOCK_LEN)

    return blockIndex === lastPieceIndex ? lastPieceLen : BLOCK_LEN
}



export const open = (filepath) => {
    try {
        const data = fs.readFileSync(filepath);
        return bencodec.decode(data);
    } catch (error) {
        console.error("Failed to open file:", error);
        return null;
    }
};

export const size = (torrent) => {
    const size = torrent.info.files ?
        torrent.info.files.map(file => file.length).reduce((a, b) => a + b) : torrent.info.length;

    const sizeBigInt = BigInt(size);
    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(sizeBigInt);
    return buffer;
};

export const infoHash = (torrent) => {
    const info = bencodec.encode(torrent.info);
    return crypto.createHash('sha1').update(info).digest();
};
