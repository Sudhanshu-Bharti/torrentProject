"use strict"

import { open } from "./torrent-parser.ts"
import {download} from "./download.js"

const torrent= open('movie.torrent')
console.log(torrent);

    if (torrent) {

        download(torrent , torrent.info.name)
    }

// getPeers(torrent, (error, peers) => {
//     if (error) {
//         console.error("Error getting peers:", error);
//         return;
//     }
//     console.log("List of all peers:", peers);
// });
