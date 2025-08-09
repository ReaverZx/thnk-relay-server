import http from "http";
import WebSocket, { WebSocketServer } from "ws";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("THNK Relay server is running\n");
});

const wss = new WebSocketServer({ server });

const clientRooms = new Map<WebSocket, string>();

wss.on("connection", (ws: WebSocket) => {
  console.log("New client connected");

  ws.once("message", (message: Buffer, isBinary) => {
    if (!isBinary) {
      console.warn("First message was not binary, ignoring");
      return;
    }

    // Skip the first byte (message type), read the rest as UTF-8
    const roomId = message.subarray(1).toString("utf8").replace(/\0/g, "");
    clientRooms.set(ws, roomId);
    console.log(`Client joined room: ${roomId}`);

    // Now forward all future messages only to same-room clients
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

  ws.on("close", () => {
    clientRooms.delete(ws);
    console.log("Client disconnected");
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Relay server started on port ${PORT}`);
});
