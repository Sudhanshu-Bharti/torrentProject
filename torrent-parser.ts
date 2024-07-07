"use strict";
import fs from 'fs';
import bencodec from 'bencodec';
import crypto from "crypto";

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
