// ===========================================================================
// NETWORK CLIENT (WebSocket to the authoritative server)
// ===========================================================================

class NetClient {
  constructor(url, handlers) {
    this.handlers = handlers;
    this.socket = new WebSocket(url);
    this.socket.addEventListener('open', () => handlers.onOpen());
    this.socket.addEventListener('close', () => handlers.onClose());
    this.socket.addEventListener('error', () => handlers.onError());
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      handlers.onMessage(message);
    });
  }

  get isOpen() {
    return this.socket.readyState === WebSocket.OPEN;
  }

  send(message) {
    if (!this.isOpen) throw new Error('Socket is not open');
    this.socket.send(JSON.stringify(message));
  }

  close() {
    this.socket.close();
  }
}
