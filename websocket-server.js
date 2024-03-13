const http = require('http');
const WebSocket = require('ws');
const { WebsocketProvider } = require('y-websocket');
const Y = require('yjs');
const awarenessProtocol = require('y-protocols/awareness');
const CustomLeveldbProvider = require('./CustomLeveldbProvider');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const rooms = {};

wss.on('connection', async (ws) => {
  let provider = null;
  let roomId = null;

  ws.on('message', async (message) => {
    const data = JSON.parse(message);
    if (data.type === 'join') {
      roomId = data.roomId;
      if (!rooms[roomId]) {
        rooms[roomId] = new Y.Doc();
        rooms[roomId].awareness = new awarenessProtocol.Awareness(rooms[roomId]);
        const customLeveldbProvider = new CustomLeveldbProvider(roomId);
        await customLeveldbProvider.load(rooms[roomId]);
      }
      provider = new WebsocketProvider('ws://localhost:1234', roomId, rooms[roomId], { WebSocketPolyfill: WebSocket, awareness: rooms[roomId].awareness });
      console.log('Client joined room:', roomId);
    } else if (data.type === 'message' && provider) {
      
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client !== ws) {
          client.send(message);
        }
      });
    }
  });

  ws.on('close', () => {
    if (provider) {
      
      provider.destroy();
    }
  });
});

const PORT = 1234;
server.listen(PORT, () => {
  console.log(`WebSocket server is listening on port ${PORT}`);
});

process.on('SIGINT', () => {
  process.exit(0);
});
