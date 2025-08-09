import http from "http";
import WebSocket, { WebSocketServer } from "ws";

// Port your Render service listens on internally
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 6969;

// Map rooms to sets of clients
const rooms = new Map<string, Set<WebSocket>>();

// Create a simple HTTP server for Render health checks
const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
  } else {
    res.writeHead(404);
    res.end();
  }
});

// Attach WebSocket server to the HTTP server
const wss = new WebSocketServer({ server });

console.log(`Server listening on port ${PORT}`);

wss.on("connection", (ws: WebSocket, req) => {
  console.log("New client connected");

  // Parse URL path to get room info: /gameID/roomID/join
  const url = req.url || "";
  const parts = url.split("/").filter(Boolean); // remove empty strings
  if (parts.length < 3 || parts[2] !== "join") {
    console.warn("Invalid connection path, closing client");
    ws.close(1008, "Invalid path");
    return;
  }

  const [gameID, roomID] = parts;

  const roomKey = `${gameID}/${roomID}`;

  // Add client to the room set
  if (!rooms.has(roomKey)) rooms.set(roomKey, new
