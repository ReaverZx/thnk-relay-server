import http from "http";
import WebSocket, { WebSocketServer } from "ws";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;

// Create HTTP server (just returns OK to any HTTP request)
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket relay server is running\n");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws: WebSocket) => {
  ws.on("message", (message: WebSocket.RawData) => {
    const msgStr = message.toString();
    console.log("Received:", msgStr);

    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msgStr);
      }
    });
  });

  ws.send("Connected to THNK relay server");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Relay server started on port ${PORT}`);
});
