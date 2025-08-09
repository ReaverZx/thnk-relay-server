import WebSocket, { WebSocketServer } from "ws";

const port = process.env.PORT ? parseInt(process.env.PORT) : 6969;
const wss = new WebSocketServer({ port });

console.log(`THNK Relay server running on port ${port}`);

// Keep track of clients by roomID
const rooms = new Map<string, Set<WebSocket>>();

function sendConnectionMsg(ws: WebSocket, userId: number) {
  // Message type 1 (Connection), user ID as byte
  const msg = new Uint8Array([userId, 1]);
  ws.send(msg);
}

function sendDisconnectionMsg(ws: WebSocket, userId: number) {
  // Message type 2 (Disconnection), user ID as byte
  const msg = new Uint8Array([userId, 2]);
  ws.send(msg);
}

wss.on("connection", (ws: WebSocket) => {
  console.log("New client connected");

  // This will hold the roomID the client joined
  let clientRoomID: string | null = null;

  // Assign a unique user ID per connection (simple increment)
  const userId = Math.floor(Math.random() * 254) + 1;

  ws.on("message", (message) => {
    if (!(message instanceof Buffer)) {
      console.error("Expected Buffer message");
      return;
    }
    
    // First message from client should be join info: a text URL path like "/<gameID>/<roomID>/join"
    if (!clientRoomID) {
      // Example: message might be a string URL
      const msgStr = message.toString();
      // Extract roomID - customize as needed to parse your client URL pattern
      const parts = msgStr.split("/");
      const roomID = parts[2] || "default";
      clientRoomID = roomID;

      // Add client to room
      if (!rooms.has(clientRoomID)) {
        rooms.set(clientRoomID, new Set());
      }
      rooms.get(clientRoomID)!.add(ws);

      console.log(`Client joined room: ${clientRoomID}`);

      // Send connection message to this client (for protocol handshake)
      sendConnectionMsg(ws, userId);

      return;
    }

    // If client already joined a room, broadcast the client message to others in the same room
    const clients = rooms.get(clientRoomID);
    if (!clients) return;

    // The message should be forwarded to all other clients in the room
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");

    if (clientRoomID && rooms.has(clientRoomID)) {
      rooms.get(clientRoomID)!.delete(ws);

      // Optional: broadcast disconnection message to other clients in room
      const clients = rooms.get(clientRoomID);
      clients?.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          sendDisconnectionMsg(client, userId);
        }
      });

      if (rooms.get(clientRoomID)!.size === 0) {
        rooms.delete(clientRoomID);
      }
    }
  });
});
