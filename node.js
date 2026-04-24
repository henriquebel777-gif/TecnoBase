const API = "http://localhost:3000";

async function atualizarClientes(){
    let res = await fetch(API + "/clientes");
    let dados = await res.json();

    let tabela = document.getElementById("tabelaClientes");
    tabela.innerHTML = "";

    dados.forEach(c => {
        tabela.innerHTML += `
        <tr>
            <td>${c.id_cliente}</td>
            <td>${c.nome}</td>
            <td>
                <button onclick="delCliente(${c.id_cliente})">Excluir</button>
            </td>
        </tr>`;
    });
}


async function atualizarProdutos(){
    let res = await fetch("http://localhost:3000/produtos");
    let dados = await res.json();

    let tabela = document.getElementById("tabelaProdutos");
    tabela.innerHTML = "";

    dados.forEach(p => {
        let baixo = p.quantidade <= p.estoque_minimo;

        tabela.innerHTML += `
        <tr class="${baixo ? 'baixo':''}">
            <td>${p.id_produto}</td>
            <td>${p.nome}</td>
            <td>${p.quantidade}</td>
            <td>${p.estoque_minimo}</td>
            <td>${baixo ? '⚠ Baixo' : 'OK'}</td>
        </tr>`;
    });
}

window.onload = () => {
    atualizarClientes();
    atualizarProdutos();
};