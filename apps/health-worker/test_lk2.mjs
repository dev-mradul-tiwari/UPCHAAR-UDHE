import { RoomServiceClient } from 'livekit-server-sdk';

const key = 'APIbL68zskPPbDF';
const secret = 'fFl2xEGO9e8ev7rXvQ2Tf6ZauHI1v5ZHpBe38ReTsGCN';
const url = 'https://upchaar-8bbftdwu.livekit.cloud';

const svc = new RoomServiceClient(url, key, secret);
svc.listRooms()
  .then(rooms => console.log('KEY VALID! Active rooms:', rooms.length))
  .catch(e => console.log('KEY FAILED:', e.message));
