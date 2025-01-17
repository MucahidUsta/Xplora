const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" },
});

const PORT = 3000;
const clients = {}; // Kullanıcı bağlantılarını takip etmek için

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Kullanıcı kaydı
  socket.on("register", (userId) => {
    clients[userId] = { socketId: socket.id };
    console.log(`${userId} kaydedildi. Güncel bağlı kullanıcılar:`, clients);
  });

  // Bildirim gönderme
  socket.on("sendNotification", ({ recipient, title, body }) => {
    const recipientData = clients[recipient];
    if (recipientData && recipientData.socketId) {
      io.to(recipientData.socketId).emit("receiveNotification", { title, body });
      console.log(`Bildirim gönderildi: ${recipient}`);
    } else {
      console.error(`Alıcı ${recipient} bağlı değil!`);
    }
  });

  // Bağlantı kesildiğinde kullanıcı kaldırma
  socket.on("disconnect", () => {
    for (const [userId, data] of Object.entries(clients)) {
      if (data.socketId === socket.id) {
        delete clients[userId];
        console.log(`Kullanıcı bağlantısı kesildi: ${userId}`);
        break;
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
