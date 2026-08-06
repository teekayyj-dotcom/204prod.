import asyncio
import websockets

async def test():
    uri = "wss://204prod.vn/api/v1/notifications/ws/TestUser"
    try:
        async with websockets.connect(uri) as websocket:
            print("WebSocket connected successfully!")
            try:
                # Wait for 3 seconds to see if it closes
                message = await asyncio.wait_for(websocket.recv(), timeout=3.0)
                print(f"Received message: {message}")
            except asyncio.TimeoutError:
                print("No message received in 3 seconds. Connection is still open!")
            except websockets.exceptions.ConnectionClosed as e:
                print(f"WebSocket closed by server! Code: {e.code}, Reason: {e.reason}")
    except Exception as e:
        print(f"Failed to connect: {e}")

asyncio.run(test())
