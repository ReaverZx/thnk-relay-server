import http from "http";
import WebSocket, { WebSocketServer } from "ws";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("THNK Relay server is running\n");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws: WebSocket) => {
  ws.on("message", (message, isBinary) => {
    // Broadcast message to all other clients exactly as received
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message, { binary: isBinary });
      }
    });
  });

  // Optionally, send a small hello (THNK doesn't need this)
  console.log("New client connected");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Relay server started on port ${PORT}`);
});
