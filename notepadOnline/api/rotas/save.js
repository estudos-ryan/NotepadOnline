import pegarRedis from "../db/db.js";
import { gerarHash, verificarSenha } from "../utils/bcryt.js";

const TEMP = 86400

export default async function CriarESalvar(req, res) {
    const { slug, conteudo, senha, novaSenha } = req.body;

    if (!slug) return res.status(400).json({ error: "Slug não informado" });

    const slugLimpo = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");

    try {
        const redis = await pegarRedis();

        const limiteSave = await redis.set(`save-limit:${slugLimpo}`, "1", {
            NX: true,
            EX: 1
        });

        if (limiteSave === null) {
            return res.status(429).json({ error: "Aguarde um segundo antes de salvar." });
        }

        const notaAtual = await redis.hGetAll(slugLimpo);
        const existeNota = Object.keys(notaAtual).length > 0;

        if (existeNota && notaAtual.senha) {
            const senhaValida = await verificarSenha(senha || "", notaAtual.senha);

            if (!senhaValida) {
                return res.status(401).json({ error: "Senha incorreta." });
            }
        }

        let senhaFinalCriptografada = existeNota ? notaAtual.senha : "";

        if (novaSenha !== undefined && novaSenha !== "") {
            senhaFinalCriptografada = await gerarHash(novaSenha);
        } else if (novaSenha === "") {
            senhaFinalCriptografada = "";
        }

        const conteudoFinal = conteudo !== undefined ? conteudo : (existeNota ? notaAtual.conteudo : "");

        await redis.hSet(slugLimpo, {
            conteudo: conteudoFinal,
            senha: senhaFinalCriptografada,
            protegido: senhaFinalCriptografada ? "true" : "false"
        });

        await redis.expire(slugLimpo, TEMP);

        return res.status(200).json({ success: true, slug: slugLimpo });
    } catch (error) {
        console.error("Erro no save:", error);
        return res.status(500).json({ error: "Erro ao salvar" });
    }
}