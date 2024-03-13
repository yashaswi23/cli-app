const Y = require('yjs');
const { WebsocketProvider } = require('y-websocket');
const CustomLeveldbProvider = require('./CustomLeveldbProvider');
const readline = require('readline');
const WebSocket = require('ws');
const awarenessProtocol = require('y-protocols/awareness');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const getInstanceId = () => {
  return Math.random().toString(36).substring(7);
};

const createRoom = async () => {
  rl.question('Enter the room name: ', async (roomName) => {
    const instanceId = getInstanceId();
    const doc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(doc);

    // Prompt user for the document name
    const docName = roomName || 'default-doc';

    const customLeveldbProvider = new CustomLeveldbProvider(docName, instanceId);
    await customLeveldbProvider.load(doc);

    const provider = new WebsocketProvider('ws://localhost:1234', docName, doc, { WebSocketPolyfill: WebSocket, awareness });

    const yText = doc.getText('shared-text');

    const getClientIds = (awareness) => {
      const clientIds = [];
      awareness.getStates().forEach((state, clientId) => {
        clientIds.push(clientId);
      });
      return clientIds;
    };

    const allClientIds = getClientIds(provider.awareness);
    console.log('Connected Client IDs:', allClientIds);

    // Observer for changes from other clients
    provider.awareness.on('change', () => {
      console.log('Awareness change detected. New client IDs:', getClientIds(provider.awareness));
    });

    yText.observe(event => {
      console.log('Message from client', event.origin); 
      console.log('Collaborative Note:\n', yText.toString());
    });

    const cliLoop = async () => {
      rl.question('Type something: ', input => {
        yText.insert(yText.toString().length, input + '\n', { origin: provider.awareness.clientID }); 
        cliLoop();
      });
    };

    cliLoop();

    doc.on('update', () => {
      customLeveldbProvider.save(doc);
    });

    process.on('exit', () => {
      customLeveldbProvider.destroy();
      rl.close(); // Close the readline interface
    });
  });
};

// Start the app
createRoom();
