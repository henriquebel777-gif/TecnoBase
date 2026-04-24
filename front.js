// Função de Excluir Venda (Exemplo para aplicar nas outras)
async function excluirVenda(id){
    if(!confirm("Tem certeza que deseja excluir esta venda? O estoque será devolvido.")) return;

    try {
        let res = await fetch(`${API}/vendas/${id}`, { method: "DELETE" });

        if(res.ok) {
            alert("Venda excluída com sucesso!");
            atualizarVendas();   // Atualiza a tabela na tela
            atualizarProdutos(); // Atualiza o estoque na tela
        } else {
            alert("Erro ao excluir no servidor.");
        }
    } catch(e){
        console.error(e);
        alert("Erro de conexão.");
    }
}