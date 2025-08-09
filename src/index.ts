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
    console.log("Raw join packet bytes:", [...message]);

    if (!isBinary) {
      console.warn("First message was not binary, ignoring client");
      ws.close();
      return;
    }

    // Try parsing with length byte — if this fails, fallback
    try {
      if (message.length < 2) {
        throw new Error("Join packet too short");
      }
      const type = message.readUInt8(0);
      const roomIdLength = message.readUInt8(1);

      if (message.length < 2 + roomIdLength) {
        throw new Error("Join packet room ID length mismatch");
      }

      const roomId = message.subarray(2, 2 + roomIdLength).toString("utf8");
      clientRooms.set(ws, roomId);
      console.log(`Client joined room: ${roomId}`);
    } catch (e) {
      console.warn(`${e}. Using fallback room parsing...`);
      const roomId = message.subarray(1).toString("utf8").replace(/\0/g, "");
      clientRooms.set(ws, roomId);
      console.log(`Client joined room (fallback parse): ${roomId}`);
    }

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
