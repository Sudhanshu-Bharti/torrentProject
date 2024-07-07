'use strict';
import dgram from 'dgram';
import { URL } from 'url';
import crypto from "crypto";
import genId from './utils';
import { size, infoHash } from "./torrent-parser";

const getPeers = (torrent, callback) => {
    const socket = dgram.createSocket('udp4');
    const url = new URL(torrent.announce.toString('utf8'));
    console.log(url);

    udpSend(socket, buildConnReq(), url);

    socket.on('message', response => {
        console.log("Socket connected");
        if (respType(response) === 'connect') {
            const connResp = parseConnResp(response);
            console.log(connResp);
            const announceReq = buildAnnounceReq(connResp.connectionId, torrent);
            udpSend(socket, announceReq, url);
        } else if (respType(response) === 'announce') {
            const announceResp = parseAnnounceResp(response);
            callback(null, announceResp.peers);
        }
    });

    socket.on('error', error => {
        callback(error);
    });
};

function udpSend(socket, message, rawUrl, callback = () => { }) {
    const url = new URL(rawUrl);
    socket.send(message, 0, message.length, parseInt(url.port), url.hostname, callback);
}

function respType(resp) {
    const action = resp.readUInt32BE(0);
    if (action === 0) {
        return "connect";
    } else if (action === 1) {
        return "announce";
    }
}

function buildConnReq() {
    const buff = Buffer.alloc(16);
    buff.writeUInt32BE(0x417, 0);
    buff.writeUInt32BE(0x27101980, 4);
    buff.writeUInt32BE(0, 8);
    crypto.randomBytes(4).copy(buff, 12);
    return buff;
}

function parseConnResp(resp) {
    return {
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        connectionId: resp.slice(8)
    };
}

function buildAnnounceReq(connId, torrent, port = 6881) {
    const buf = Buffer.alloc(98);
    connId.copy(buf, 0);
    buf.writeUInt32BE(1, 8);
    crypto.randomBytes(4).copy(buf, 12);
    infoHash(torrent).copy(buf, 16);
    genId().copy(buf, 36);
    Buffer.alloc(8).copy(buf, 56); // downloaded
    size(torrent).copy(buf, 64); // left
    Buffer.alloc(8).copy(buf, 72); // uploaded
    buf.writeUInt32BE(0, 80); // event
    buf.writeUInt32BE(0, 84); // IP address
    crypto.randomBytes(4).copy(buf, 88); // key
    buf.writeUInt32BE(0xFFFFFFFF, 92); // num_want (0xFFFFFFFF is the unsigned 32-bit equivalent of -1)
    buf.writeUInt16BE(port, 96); // port
    return buf;
}


function parseAnnounceResp(resp) {
    function group(iterable, grpSize) {
        let groups = [];
        for (let i = 0; i < iterable.length; i += grpSize) {
            groups.push(iterable.slice(i, i + grpSize));
        }
        return groups;
    }

    return {
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        leechers: resp.readUInt32BE(8),
        seeders: resp.readUInt32BE(12),
        peers: group(resp.slice(20), 6).map(address => {
            return {
                ip: address.slice(0, 4).join('.'),
                port: address.readUInt16BE(4)
            };
        })
    };
}

export default getPeers;
