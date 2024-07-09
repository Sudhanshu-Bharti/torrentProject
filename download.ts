import * as net from "net"
import getPeers from "./tracker"
import {buildBitfield,buildCancel,buildHandshake, buildInterested,buildRequest,parse} from "./message"
import {Pieces}  from "./Pieces"

export const downloadTorrent =(torrent) => {
    const requested = []
    getPeers(torrent, peers => {
        //its a buffer that contains 20-byte SHA-1 hash of each piece
        const pieces = new Pieces(torrent.info.pieces.length /20) //total number of bytes
        peers.forEach(peer => download(peer, torrent,pieces))
    })
}

export const download= (peer,torrent, pieces) =>{
    const socket = new net.Socket()
    socket.on('error', console.log);
    
    socket.connect(peer.port , peer.ip ,()=>{
        socket.write(buildHandshake(torrent))
    
    })
    const queue = { choked : true  , queue:[]}
    onWholeMSG(socket, msg=> {
        msgHandler(msg, socket, pieces,queue)
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
const msgHandler = (msg, socket, pieces,queue)=>{
    if(isHandShake(msg)){
        socket.write(buildInterested())
    } else{
        const m = parse(msg)
        if( m.id === 0) chokeHandler(socket)
        if( m.id === 1) unchokeHandler(socket , pieces, queue)
        if( m.id === 4) haveHandler(m.payload, socket , requested,queue)
        if( m.id === 5) bitfieldHandler(m.payload)
        if( m.id === 7) pieceHandler(m.payload, socket, requested, queue)
    }
}
const isHandShake = (msg:any) =>{
    return msg.length ===  msg.readUInt8(0)+ 49 && msg.toString('utf8', 1) === "BitTorrent Protocol"
}

const chokeHandler = (socket) => {
    socket.end()
}
const unchokeHandler = (socket, pieces, queue) => {
    queue.choked = false
    requestPiece(socket, pieces, queue)
}

const haveHandler = (payload, socket , requested,queue) => {
    const pieceIndex = payload.readUInt32BE(0)
    queue.push(pieceIndex)
    if (queue.length === 1) {
        requestPiece(socket, requested, queue);
    }
    if(!requested[pieceIndex]){
        socket.write(buildRequest(...))
    }
    requested[pieceIndex] = true

    
}
const bitfieldHandler = (payload) => {
    
}
const pieceHandler = (payload, socket, requested, queue) => {
    queue.shift()
    requestPiece(socket, requested, queue)
}

const requestPiece = (socket, requested, queue) => {

    if(queue.choked) return null

    while (queue.queue.length) {
        const pieceIndex = queue.shift()
        if(Pieces.prototype.needed(pieceIndex)){
            socket.write(buildRequest(pieceIndex));
            Pieces.prototype.addRequested(pieceIndex);
            break;
        }
    }
}
