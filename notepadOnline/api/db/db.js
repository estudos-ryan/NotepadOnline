import { createClient } from "redis";

const client = createClient({
  url: process.env.REDIS_URL,
});

client.on("error", (err) => console.error("Erro no Redis:", err));

const connectionPromise = client.connect().catch((err) => {
  console.error("Erro ao conectar no Redis:", err);
});

export default async function pegarRedis() {
  if (!client.isOpen) {
    await connectionPromise;
  }

  return client;
}