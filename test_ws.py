import asyncio
import websockets

async def test_ws():
    uri = "wss://204prod.vn/api/v1/notifications/ws/TestUser"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected!")
            await websocket.close()
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test_ws())
