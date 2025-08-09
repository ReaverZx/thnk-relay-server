import http from "http";
import WebSocket, { WebSocketServer } from "ws";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;

// Create HTTP server
const server = http.createServer();

// Create WebSocket server and attach to HTTP server
const wss = new WebSocketServer({ server });

console.log(`Relay server starting on port ${PORT}...`);

// WebSocket handling
wss.on("connection", (ws: WebSocket) => {
  ws.on("message", (message: WebSocket.RawData) => {
    const msgStr = message.toString();
    console.log("Received:", msgStr);

    // Broadcast to all other clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msgStr);
      }
    });
  });

  ws.send("Connected to THNK relay server");
});

// Start server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Relay server started on port ${PORT}`);
});
