import http from "http";
import WebSocket, { WebSocketServer } from "ws";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("THNK Relay server is running\n");
});

const wss = new WebSocketServer({ server });

// Map client → roomId
const clientRooms = new Map<WebSocket, string>();

wss.on("connection", (ws: WebSocket) => {
  console.log("New client connected");

  // Wait for the first message, which should be the join room packet
  ws.once("message", (message: Buffer, isBinary) => {
    if (!isBinary) {
      console.warn("First message was not binary, ignoring client");
      ws.close();
      return;
    }

    // Parse THNK join room packet format:
    // byte 0 = message type (e.g. 0x00 or 0x01)
    // byte 1 = length of room ID string
    // bytes 2..2+length = UTF8 room ID
    if (message.length < 2) {
      console.warn("Join packet too short");
      ws.close();
      return;
    }

    const type = message.readUInt8(0);
    const roomIdLength = message.readUInt8(1);

    if (message.length < 2 + roomIdLength) {
      console.warn("Join packet room ID length mismatch");
      ws.close();
      return;
    }

    const roomId = message.subarray(2, 2 + roomIdLength).toString("utf8");

    clientRooms.set(ws, roomId);
    console.log(`Client joined room: ${roomId}`);

    // Forward all future messages to clients in the same room
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
