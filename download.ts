import * as net from "net"
import getPeers from "./tracker"
import {buildBitfield,buildCancel,buildHandshake, buildInterested,} from "./message"

export const downloadTorrent =(torrent) => {
    getPeers(torrent, peers => {
        peers.forEach(peer => download(peer, torrent))
    })
}

export const download= (peer,torrent) =>{
    const socket = new net.Socket()
    socket.on('error', console.log);
    
    socket.connect(peer.port , peer.ip ,()=>{
        socket.write(buildHandshake(torrent))
    
    })
    onWholeMSG(socket, msg=> {
        msgHandler(msg, socket)
    })
    socket.on('data', data => {
        console.log(data);
        
    })
}

const onWholeMSG =(socket, callback) => {
    let savedBuf = Buffer.alloc(0)
    let handshake = true

    socket.on('data', recvBuf => {
       
        const msgLength = () => {
             //calculates the length of a whole message
            return handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readInt32BE(0) + 4;
        }

        savedBuf = Buffer.concat([savedBuf, recvBuf])
        
        //savedBuf is long enough to contain at least one whole message
        while (savedBuf.length >=4 && savedBuf.length >= msgLength()) {
            callback(savedBuf.subarray(0, msgLength())) //check krn ah
            savedBuf  = savedBuf.subarray(msgLength())
            handshake = false
        }
    
    })

}
const msgHandler = (msg, socket)=>{
    if(isHandShake(msg)){
        socket.write(buildInterested())
    }
}
const isHandShake = (msg:any) =>{
    return msg.length ===  msg.readUInt8(0)+ 49 &&
            msg.toString('utf8', 1) === "BitTorrent Protocol"
}