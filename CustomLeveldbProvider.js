const { LeveldbPersistence } = require('y-leveldb');
const Y = require('yjs');

class CustomLeveldbProvider {
  constructor(roomId) {
    this.roomId = roomId;
    this.docName = `cli-demo-room_${roomId}`;
    this.persistence = new LeveldbPersistence(this.docName);
    this.initialized = false;
  }

  async init() {
    try {
      console.log(`Initializing Leveldb for room ${this.roomId}`);
    
      await this.persistence.init();
      this.initialized = true;
      console.log(`Leveldb initialized for room ${this.roomId}`);
    } catch (error) {
      //console.error('Error initializing Leveldb:', error);
    }
  }

  async load(ydoc) {
    try {
      if (!this.initialized) {
        await this.init();
      }

      console.log(`Loading state from Leveldb for room ${this.roomId}`);
      let state = await this.persistence.getYDoc(this.docName);
      if (state instanceof Uint8Array) {
        Y.applyUpdate(ydoc, state);
        console.log(`State loaded from Leveldb for room ${this.roomId}`);
      } else if (state instanceof Y.Doc) {
        console.log(`State loaded from Leveldb for room ${this.roomId}`);
        console.log('State:', state);
        const encodedState = Y.encodeStateAsUpdate(state);
        Y.applyUpdate(ydoc, encodedState);
      } else {
        console.error('Invalid state retrieved from Leveldb:', state);
      }
    } catch (error) {
      console.error('Error loading state from Leveldb:', error);
    }
  }

  async save(ydoc) {
    try {
      if (!this.initialized) {
        await this.init();
      }

      console.log(`Saving state to Leveldb for room ${this.roomId}`);
      const state = Y.encodeStateAsUpdate(ydoc);
      await this.persistence.storeUpdate(this.docName, state);
      console.log(`State saved to Leveldb for room ${this.roomId}`);
    } catch (error) {
      console.error('Error saving state to Leveldb:', error);
    }
  }

  async destroy() {
    try {
      console.log(`Destroying Leveldb for room ${this.roomId}`);
      await this.persistence.destroy();
      this.initialized = false;
      console.log(`Leveldb destroyed for room ${this.roomId}`);
    } catch (error) {
      console.error('Error destroying Leveldb:', error);
    }
  }
}

module.exports = CustomLeveldbProvider;
