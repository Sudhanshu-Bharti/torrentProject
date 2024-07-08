"use strict"

import getPeers from './tracker.js';
import { open } from "./torrent-parser";
import {download} from "./download"

const torrent: any = open('movie.torrent')
console.log(torrent);

getPeers(torrent, (error, peers) => {
    if (error) {
        console.error("Error getting peers:", error);
        return;
    }
    console.log("List of all peers:", peers);
});
