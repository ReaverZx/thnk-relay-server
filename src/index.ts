import WebSocket, { WebSocketServer } from "ws";

const PORT = Number(process.env.PORT) || 6969;
const wss = new WebSocketServer({ port: PORT });

const rooms = new Map<string, Set<WebSocket>>();

wss.on("connection", (ws) => {
  let currentRoom: string | null = null;

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.room) {
        currentRoom = data.room;
        if (!rooms.has(currentRoom)) {
          rooms.set(currentRoom, new Set());
        }
        rooms.get(currentRoom)!.add(ws);
      } else if (currentRoom) {
        for (const client of rooms.get(currentRoom)!) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(message.toString());
          }
        }
      }
    } catch {
      // Ignore invalid messages
    }
  });

  ws.on("close", () => {
    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom)!.delete(ws);
      if (rooms.get(currentRoom)!.size === 0) {
        rooms.delete(currentRoom);
      }
    }
  });
});

console.log(`THNK relay server running on ws://localhost:${PORT}`);
