import http from "http";
import WebSocket, { WebSocketServer } from "ws";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 6969;

const rooms = new Map<string, Set<WebSocket>>();

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocketServer({ server });

console.log(`Server listening on port ${PORT}`);

wss.on("connection", (ws: WebSocket, req) => {
  console.log("New client connected");

  const url = req.url || "";
  const parts = url.split("/").filter(Boolean);
  if (parts.length < 3 || parts[2] !== "join") {
    console.warn("Invalid connection path, closing client");
    ws.close(1008, "Invalid path");
    return;
  }

  const [gameID, roomID] = parts;

  const roomKey = `${gameID}/${roomID}`;

  if (!rooms.has(roomKey)) rooms.set(roomKey, new Set());
  rooms.get(roomKey)?.add(ws);

  console.log(`Client joined room: ${roomKey}`);

  ws.on("message", (message) => {
    const roomClients = rooms.get(roomKey);
    if (!roomClients) return;

    roomClients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    rooms.get(roomKey)?.delete(ws);
    if (rooms.get(roomKey)?.size === 0) {
      rooms.delete(roomKey);
      console.log(`Room ${roomKey} deleted (empty)`);
    }
  });

  ws.send("Connected to THNK relay server");
});

server.listen(PORT);
