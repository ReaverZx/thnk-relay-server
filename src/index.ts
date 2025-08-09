import http from "http";
import WebSocket, { WebSocketServer } from "ws";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("THNK Relay server is running\n");
});

const wss = new WebSocketServer({ server });

// Map from client to join packet hex string (room id)
const clientRooms = new Map<WebSocket, string>();

wss.on("connection", (ws: WebSocket) => {
  console.log("New client connected");

  ws.once("message", (message: Buffer, isBinary) => {
    if (!isBinary) {
      console.warn("First message was not binary, closing");
      ws.close();
      return;
    }

    const roomId = message.toString("hex");
    clientRooms.set(ws, roomId);
    console.log(`Client joined room (hex): ${roomId}`);

    ws.on("message", (data, isBin) => {
      const room = clientRooms.get(ws);
      if (!room) return;

      wss.clients.forEach((client) => {
        if (
          client !== ws &&
          client.readyState === WebSocket.OPEN &&
          clientRooms.get(client) === room
        ) {
          client.send(data, { binary: isBin });
        }
      });
    });
  });

  ws.once("close", () => {
    clientRooms.delete(ws);
    console.log("Client disconnected");
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`THNK Relay server started on port ${PORT}`);
});
