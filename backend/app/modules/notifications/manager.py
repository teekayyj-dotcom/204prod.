from fastapi import WebSocket
from typing import Dict, List
import json

import asyncio

class ConnectionManager:
    def __init__(self):
        # Maps user_id to a list of active websocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.loop = None

    async def connect(self, websocket: WebSocket, user_id: str):
        if self.loop is None:
            self.loop = asyncio.get_running_loop()
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def _send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            # We copy the list to avoid modifying it during iteration if a connection fails
            for connection in list(self.active_connections[user_id]):
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error sending ws message to {user_id}: {e}")
                    self.disconnect(connection, user_id)
                    
    def send_personal_message_sync(self, message: dict, user_id: str):
        if self.loop and self.loop.is_running():
            asyncio.run_coroutine_threadsafe(self._send_personal_message(message, user_id), self.loop)

manager = ConnectionManager()
