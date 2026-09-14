import bcrypt from "bcryptjs";

const SALT = 10;

export async function gerarHash(senha) {
    if (!senha) return "";
    return await bcrypt.hash(senha, SALT);
}

export async function verificarSenha(senhaDigitada, hashSalvo) {
    if (!hashSalvo && !senhaDigitada) return true;

    if (!senhaDigitada || !hashSalvo) return false;

    return await bcrypt.compare(senhaDigitada, hashSalvo);
}