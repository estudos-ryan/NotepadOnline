import express from "express";
import cors from "cors";
import rateLimite from "express-rate-limit";

import PegarNotas from "./rotas/pegar.js";
import SavarNotas from "./rotas/save.js";
import Desbloquear from "./rotas/desbloquear.js";

const desbloquearLimiter = rateLimite({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        error: "Muitas tentativas. Tente novamente mais tarde."
    }
});

const app = express()
app.use(cors())
app.use(express.json())

app.post("/api/save", SavarNotas)

app.get("/api/pegar", PegarNotas)

app.post("/api/desbloquear", desbloquearLimiter,Desbloquear)

export default app