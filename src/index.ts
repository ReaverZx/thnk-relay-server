import WebSocket, { WebSocketServer } from "ws";

const port = process.env.PORT ? parseInt(process.env.PORT) : 10000;
const wss = new WebSocketServer({ port });

console.log(`Relay server started on port ${port}`);

wss.on("connection", (ws: WebSocket) => {
  console.log("New client connected");

  ws.on("message", (message) => {
    // Broadcast message to all except sender
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });

  ws.send("Connected to relay server");
});
