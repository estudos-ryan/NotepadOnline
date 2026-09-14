import pegarRedis from "../db/db.js";

export default async function PegarBloco(req, res) {
    const { slug } = req.query;

    if (!slug) return res.status(400).json({ error: "Slug não informado" });
    const slugLimpo = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");

    try {
        const db = await pegarRedis()

        const data = await db.hGetAll(slugLimpo)

        if (!data || Object.keys(data).length === 0) {
            return res.status(404).json({ existe: false })
        }

        if (data.senha) {
            return res.status(200).json({ existe: true, protegido: true })
        }

        return res.status(200).json({
            existe: true,
            protegido: false,
            conteudo: data.conteudo
        });
    } catch (error) {
        console.error("Erro ao pegar:", error);
        return res.status(500).json({ error: "Erro ao buscar nota no servidor" });
    }
}