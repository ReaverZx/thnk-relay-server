import WebSocket, { WebSocketServer } from "ws";

const port = process.env.PORT ? parseInt(process.env.PORT) : 6969;
const wss = new WebSocketServer({ port });

console.log(`Relay server started on port ${port}`);

// Map roomID -> Set of clients
const rooms = new Map<string, Set<WebSocket>>();
// Map client -> roomID
const clientRooms = new Map<WebSocket, string>();

// Helper to send typed messages:
// messageType: 0=ClientMessage, 1=Connection, 2=Disconnection
function sendMessage(ws: WebSocket, userID: number, data: Uint8Array, messageType: number) {
  // Create new buffer with data + userID + messageType bytes
  const buffer = new Uint8Array(data.length + 2);
  buffer.set(data, 0);
  buffer[data.length] = userID;
  buffer[data.length + 1] = messageType;
  ws.send(buffer);
}

wss.on("connection", (ws) => {
  console.log("New client connected");

  // Wait for client to send join room message
  ws.once("message", (message) => {
    const data = new Uint8Array(message as ArrayBuffer);

    // The client sends the room ID as a string at the start, but it's binary, so convert bytes to string
    const roomID = new TextDecoder().decode(data);
    console.log(`Client joined room: ${roomID}`);

    // Store client in room map
    if (!rooms.has(roomID)) {
      rooms.set(roomID, new Set());
    }
    rooms.get(roomID)?.add(ws);
    clientRooms.set(ws, roomID);

    // Send connection message to client (userID = 0 for server)
    sendMessage(ws, 0, new Uint8Array(), 1);

    // Setup normal message forwarding for this client
    ws.on("message", (msg) => {
      const msgData = new Uint8Array(msg as ArrayBuffer);

      // Broadcast to other clients in the same room as ClientMessage (type 0)
      const clients = rooms.get(roomID);
      if (clients) {
        for (const client of clients) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            sendMessage(client, 0, msgData, 0);
          }
        }
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");
      // Remove from room
      rooms.get(roomID)?.delete(ws);
      clientRooms.delete(ws);

      // Notify other clients in room of disconnection (type 2)
      const clients = rooms.get(roomID);
      if (clients) {
        for (const client of clients) {
          if (client.readyState === WebSocket.OPEN) {
            sendMessage(client, 0, new Uint8Array(), 2);
          }
        }
      }
    });
  });
});
