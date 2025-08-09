import WebSocket, { WebSocketServer } from "ws";

const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
const wss = new WebSocketServer({ port });

console.log(`Relay server started on port ${port}`);

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
