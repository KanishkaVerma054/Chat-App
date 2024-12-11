import { WebSocket, WebSocketServer } from "ws";
import { config } from "../config/config";

let allSockets = new Map<WebSocket, string>(); // map

const joinHandler = (socket: WebSocket, roomId: string) => {
    allSockets.set(socket, roomId)
    console.log(`User joined room: ${roomId}`);
}

const chatHandler = (socket: WebSocket, message: string) => {
    const currentRoom = allSockets.get(socket)
    if(!currentRoom) {
        console.log("User is not in any room");
        return
    }

    for (const [clientSocket, room] of allSockets) {
        if(room === currentRoom && clientSocket !== socket) {
            clientSocket.send(message)
        }
    }
    console.log(`Message broadcasted in room ${currentRoom}: ${message}`);
}

export const socketConnection = () => {
    const wss = new WebSocketServer({port: Number(config.PORT)});
    console.log(`WebSocket server running on port ${config.PORT}`);

    // validate incoming message

    wss.on("connection", (socket) => {
        console.log("New client connected.");
        socket.on("message", (message) => {
            try {
                const parsedMessage = JSON.parse(message.toString());

                if (parsedMessage.type === "join") {
                    joinHandler(socket, parsedMessage.payload.roomId)
                }

                if (parsedMessage.type === "chat") {
                    chatHandler(socket, parsedMessage.payload.message!)
                }
            } catch (error) {
                console.error("Invalid message format:",error);
                socket.send(JSON.stringify({
                    error: "Invalid message format"
                }))
            }
             
        })

        socket.on("close", () => {
            allSockets.delete(socket);
            console.log("Client disconnected.");
        })
    })
}

