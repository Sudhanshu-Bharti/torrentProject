import * as net from "net";
import getPeers from "./tracker";
import { buildBitfield, buildCancel, buildHandshake, buildInterested, buildRequest, parse } from "./message";
import { Pieces } from "./Pieces";
import { QueueObj } from "./Queue";
import { pieceLen } from "./torrent-parser";
import { closeSync, openSync, write } from "fs";

export const downloadTorrent = (torrent, path) => {
    getPeers(torrent, (peers) => {
        const pieces = new Pieces(torrent);
        const file = openSync(path, 'w');
        peers.forEach((peer) => download(peer, torrent, pieces, file));
    });
};

export const download = (peer, torrent, pieces, file) => {
    console.log("PEER", peer);

    if (!peer.port || !peer.ip) {
        console.error("Invalid peer object:", peer);
        return;
    }

    const socket = new net.Socket();
    socket.on('error', console.log);

    socket.connect(peer.port, peer.ip, () => {
        socket.write(buildHandshake(torrent));
    });

    const queue = new QueueObj(torrent);
    onWholeMSG(socket, (msg) => {
        msgHandler(msg, socket, pieces, queue, torrent, file);
    });

    socket.on('data', (data) => {
        console.log(data);
    });
};

const onWholeMSG = (socket, callback) => {
    let savedBuf = Buffer.alloc(0);
    let handshake = true;

    socket.on('data', (recvBuf) => {
        const msgLength = () => {
            return handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readInt32BE(0) + 4;
        };

        savedBuf = Buffer.concat([savedBuf, recvBuf]);

        while (savedBuf.length >= 4 && savedBuf.length >= msgLength()) {
            callback(savedBuf.subarray(0, msgLength()));
            savedBuf = savedBuf.subarray(msgLength());
            handshake = false;
        }
    });
};

const msgHandler = (msg, socket, pieces, queue, torrent, file) => {
    if (isHandShake(msg)) {
        socket.write(buildInterested());
    } else {
        const m = parse(msg);
        if (m.id === 0) chokeHandler(socket);
        if (m.id === 1) unchokeHandler(socket, pieces, queue);
        if (m.id === 4) haveHandler(m.payload, socket, pieces, queue);
        if (m.id === 5) bitfieldHandler(m.payload, socket, pieces, queue);
        if (m.id === 7) pieceHandler(socket, pieces, queue, torrent, file, m.payload);
    }
};

const isHandShake = (msg) => {
    return msg.length === msg.readUInt8(0) + 49 && msg.toString('utf8', 1, 20) === "BitTorrent Protocol";
};

const chokeHandler = (socket) => {
    socket.end();
};

const unchokeHandler = (socket, pieces, queue) => {
    queue.choked = false;
    requestPiece(socket, pieces, queue);
};

const haveHandler = (payload, socket, pieces, queue) => {
    const pieceIndex = payload.readUInt32BE(0);
    const queueEmpty = queue.length() === 0;
    queue.queue(pieceIndex);
    if (queueEmpty) {
        requestPiece(socket, pieces, queue);
    }
};

const bitfieldHandler = (payload, socket, pieces, queue) => {
    const queueEmpty = queue.length() === 0;
    payload.forEach((byte, i) => {
        for (let j = 0; j < 8; j++) {
            if (byte % 2) {
                queue.queue(i * 8 + 7 - j);
            }
            byte = Math.floor(byte / 2);
        }
    });
    if (queueEmpty) {
        requestPiece(socket, pieces, queue);
    }
};

const pieceHandler = (socket, pieces, queue, torrent, pieceResp, file) => {
    console.log(pieceResp);

    pieces.addReceived(pieceResp);

    const offset = pieceResp.index * torrent.info['piece length'] + pieceResp.begin;
    write(file, pieceResp.block, 0, pieceResp.block.length, offset, () => {});

    if (pieces.isDone()) {
        socket.end();
        console.log("Connection ended because task is fulfilled");
        try {
            closeSync(file);
        } catch (error) {
            console.log(error);
        }
    } else {
        requestPiece(socket, pieces, queue);
    }
};

const requestPiece = (socket, pieces, queue) => {
    if (queue.choked) return null;

    while (queue.length()) {
        const pieceBlock = queue.dequeue();
        if (pieces.needed(pieceBlock)) {
            socket.write(buildRequest(pieceBlock));
            pieces.addRequested(pieceBlock);
            break;
        }
    }
};
