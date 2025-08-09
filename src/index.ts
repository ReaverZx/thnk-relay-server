import http from "http";
import WebSocket, { WebSocketServer } from "ws";
import url from "url";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 6969;
const server = http.createServer();

const wss = new WebSocketServer({ server });

const rooms = new Map(); // Map<string, Set<WebSocket>>  key: `${gameID}/${roomID}`

wss.on("connection", (ws, req) => {
  if (!req.url) {
    ws.close();
    return;
  }

  const parsedUrl = url.parse(req.url);
  const pathParts = parsedUrl.pathname?.split("/") || [];

  // Expected path: /gameID/roomID/join
  if (pathParts.length !== 4 || pathParts[3] !== "join") {
    ws.close();
    return;
  }

  const gameID = pathParts[1];
  const roomID = pathParts[2];
  const roomKey = `${gameID}/${roomID}`;

  // Add ws client to room set
  if (!rooms.has(roomKey)) rooms.set(roomKey, new Set());
  rooms.get(roomKey).add(ws);

  console.log(`New client connected to room ${roomKey}`);

  ws.on("message", (message, isBinary) => {
    // Broadcast to all other clients in same room
    for (const client of rooms.get(roomKey)) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message, { binary: isBinary });
      }
    }
  });

  ws.on("close", () => {
    rooms.get(roomKey).delete(ws);
    if (rooms.get(roomKey).size === 0) {
      rooms.delete(roomKey);
    }
    console.log(`Client disconnected from room ${roomKey}`);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`THNK Relay server started on port ${PORT}`);
});
