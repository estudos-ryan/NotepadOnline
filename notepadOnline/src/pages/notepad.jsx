import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";

export default function Notepad() {
    const timeoutRef = useRef(null);
    const { slug } = useParams();

    const [tela, setTela] = useState("carregando");
    const [status, setStatus] = useState("Salvo");
    const [processando, setProcessando] = useState(false);

    const [nota, setNota] = useState({ texto: "", senhaNova: "", senhaAtual: "", senhaDigitada: "" });

    const atualizarNota = (campo, valor) => setNota(prev => ({ ...prev, [campo]: valor }));

    useEffect(() => {
        const controller = new AbortController();

        async function carregarNota() {
            setTela("carregando");
            try {
                const res = await fetch(`/api/pegar?slug=${encodeURIComponent(slug)}`, {
                    signal: controller.signal
                });

                if (res.status === 404) return setTela("nao_encontrada");
                if (!res.ok) throw new Error(`Erro: ${res.status}`);

                const data = await res.json();

                if (data.protegido) {
                    setTela("bloqueada");
                } else {
                    atualizarNota("texto", data.conteudo);
                    setTela("pronta");
                }
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error("Erro ao carregar:", err);
                    setTela("pronta");
                }
            }
        }

        carregarNota();
        return () => controller.abort();
    }, [slug]);

    const salvarNoServidor = useCallback(
        (textoParaSalvar) => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            timeoutRef.current = setTimeout(async () => {
                try {
                    const res = await fetch("/api/save", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ slug, conteudo: textoParaSalvar, senha: nota.senhaAtual })
                    });

                    if (res.status === 429) return console.log("Salvo muito rápido");
                    if (!res.ok) return console.log("Erro ao salvar");
                } catch (error) {
                    console.error("Erro no save", error);
                } finally {
                    setStatus("Salvo");
                }
            }, 1000);
        }, [slug, nota.senhaAtual]
    );

    const alterarTexto = (e) => {
        const novoTexto = e.target.value;
        atualizarNota("texto", novoTexto);
        setStatus("Salvando...");
        salvarNoServidor(novoTexto);
    };

    const protegerNota = async () => {
        setProcessando(true);
        try {
            const res = await fetch("/api/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    slug,
                    conteudo: nota.texto,
                    senha: nota.senhaAtual,
                    novaSenha: nota.senhaNova
                })
            });

            if (!res.ok) return alert("Você não pode alterar a senha desta nota.");

            atualizarNota("senhaAtual", nota.senhaNova);
            alert(nota.senhaNova ? "Senha salva com sucesso!" : "Senha removida! A nota agora é pública.");
        } catch (error) {
            console.error("Erro ao proteger", error);
        } finally {
            setProcessando(false);
        }
    };

    const desbloquear = async () => {
        if (!nota.senhaDigitada) return alert("Digite a senha!");
        setProcessando(true);

        try {
            const res = await fetch(`/api/desbloquear`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug, senha: nota.senhaDigitada })
            });

            if (res.ok) {
                const data = await res.json();
                setNota(prev => ({
                    ...prev, texto: data.conteudo, senhaAtual: prev.senhaDigitada, senhaDigitada: ""
                }));
                setTela("pronta");
            } else {
                alert("Senha incorreta!");
            }
        } catch (error) {
            console.error("Erro ao desbloquear", error);
        } finally {
            setProcessando(false);
        }
    };

    const compartilhar = () => {
        navigator.clipboard.writeText(window.location.href);
        alert("Link copiado: " + window.location.href);
    }

    if (tela === "carregando") return <div className="bg-white w-screen h-[50vh]" />

    if (tela === "nao_encontrada") return <p className="text-center text-3xl font-bold text-gray-800 mt-10">Página Não Encontrada!</p>;

    if (tela === "bloqueada") {
        return (
            <div className="flex flex-col p-4 mt-10 items-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Esta página é protegida por senha</h1>
                <div className="flex justify-between border border-gray-400 overflow-hidden rounded bg-white w-full max-w-md">
                    <input type="password" value={nota.senhaDigitada} onChange={(e) => atualizarNota("senhaDigitada", e.target.value)} className="p-2 outline-none flex-1" placeholder="Digite a senha" />
                    <button type="button" onClick={desbloquear} disabled={processando} className="bg-gray-800 text-white px-4 font-bold disabled:opacity-50">Acessar</button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col p-4 gap-4 w-full">
            <div className="flex justify-center flex-wrap gap-4 items-center">
                <div className="flex border border-gray-400 rounded overflow-hidden">
                    <input type="password" value={nota.senhaNova} autoComplete="off" onChange={(e) => atualizarNota("senhaNova", e.target.value)} className="p-2 outline-none w-32" placeholder="Nova Senha" />
                    <button type="button" onClick={protegerNota} disabled={processando} className="bg-gray-800 text-white px-4 font-bold disabled:opacity-50">Proteger</button>
                </div>

                <button type="button" onClick={compartilhar} className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 transition-colors">
                    Compartilhar
                </button>

                <p className="text-[#999] min-w-20 text-center">{status}</p>
            </div>

            <textarea value={nota.texto} onChange={alterarTexto} className="w-full h-[70vh] p-4 border border-gray-400 rounded resize focus:outline-none"></textarea>
        </div>
    )
}