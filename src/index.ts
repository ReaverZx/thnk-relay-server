import http from "http";
import WebSocket, { WebSocketServer } from "ws";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("THNK Relay server is running\n");
});

const wss = new WebSocketServer({ server });

// Map of client → roomId
const clientRooms = new Map<WebSocket, string>();

wss.on("connection", (ws: WebSocket) => {
  console.log("New client connected");

  ws.on("message", (message, isBinary) => {
    if (!isBinary) return; // THNK uses binary, ignore text

    // First message from client is the room ID
    if (!clientRooms.has(ws)) {
      const roomId = message.toString("utf8"); // THNK sends room as utf8 text first
      clientRooms.set(ws, roomId);
      console.log(`Client joined room: ${roomId}`);
      return;
    }

    const roomId = clientRooms.get(ws);
    if (!roomId) return;

    // Broadcast only to same room
    wss.clients.forEach((client) => {
      if (
        client !== ws &&
        client.readyState === WebSocket.OPEN &&
        clientRooms.get(client) === roomId
      ) {
        client.send(message, { binary: true });
      }
    });
  });

  ws.on("close", () => {
    clientRooms.delete(ws);
    console.log("Client disconnected");
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Relay server started on port ${PORT}`);
});
