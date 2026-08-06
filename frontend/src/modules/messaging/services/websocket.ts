type MessageHandler = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string = "";
  private token: string = "";
  private listeners: Record<string, MessageHandler[]> = {};
  private reconnectInterval = 3000;
  private isConnecting = false;
  private maxRetries = 10;
  private retries = 0;

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.url && this.token) {
          if (!this.ws || this.ws.readyState === WebSocket.CLOSED || this.ws.readyState === WebSocket.CLOSING) {
            this.retries = 0;
            this.connect(this.url, this.token);
          }
        }
      });
    }
  }

  connect(url: string, token: string) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.isConnecting)) return;
    
    this.url = url;
    this.token = token;
    this.isConnecting = true;
    
    // Add token to query string
    const wsUrl = `${this.url}?token=${this.token}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("[WebSocket] Connected");
      this.isConnecting = false;
      this.retries = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type && this.listeners[data.type]) {
          this.listeners[data.type].forEach(callback => callback(data));
        }
      } catch (err) {
        console.error("[WebSocket] Parse error", err);
      }
    };

    this.ws.onclose = () => {
      console.log("[WebSocket] Disconnected");
      this.isConnecting = false;
      this.ws = null;
      this.reconnect();
    };

    this.ws.onerror = (error) => {
      console.error("[WebSocket] Error", error);
      this.ws?.close();
    };
  }

  reconnect() {
    if (this.retries < this.maxRetries) {
      this.retries++;
      setTimeout(() => {
        console.log(`[WebSocket] Reconnecting... (${this.retries}/${this.maxRetries})`);
        this.connect(this.url, this.token);
      }, this.reconnectInterval);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn("[WebSocket] Not connected. Cannot send data.");
    }
  }

  on(type: string, callback: MessageHandler) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  }

  off(type: string, callback: MessageHandler) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
    }
  }
}

export const wsService = new WebSocketService();
