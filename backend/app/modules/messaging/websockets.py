import json
from typing import Dict, List, Set
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Maps user_id -> Set of active WebSocket connections
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        # Broadcast that this user is now online
        await self.broadcast({"type": "user_status", "user_id": user_id, "status": "online"})

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        # In a real app, you might want to broadcast offline status here,
        # but disconnect is often synchronous. It's safe to skip for MVP or run as a task.

    async def broadcast_offline(self, user_id: int):
        await self.broadcast({"type": "user_status", "user_id": user_id, "status": "offline"})

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            # Send to all devices/tabs for this user
            for connection in list(self.active_connections[user_id]):
                try:
                    await connection.send_json(message)
                except Exception:
                    self.active_connections[user_id].discard(connection)

    async def broadcast(self, message: dict):
        for user_id in list(self.active_connections.keys()):
            await self.send_personal_message(message, user_id)

    async def broadcast_to_users(self, message: dict, user_ids: List[int]):
        for user_id in set(user_ids):
            await self.send_personal_message(message, user_id)

manager = ConnectionManager()
