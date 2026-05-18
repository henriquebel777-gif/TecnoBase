const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: "localhost", user: "root", password: "", database: "TecnoBase"
});

db.connect(err => { if (err) console.log(err); else console.log("MySQL OK!"); });

app.post("/login", (req, res) => {
    const { email, senha } = req.body;
    db.query("SELECT * FROM clientes WHERE email = ? AND senha = ?", [email, senha], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.length > 0) res.json({ token: "ok", user: result[0] });
        else res.status(401).send("Incorreto");
    });
});

app.get("/clientes", (req, res) => {
    db.query("SELECT * FROM clientes", (err, result) => res.json(result));
});

app.post("/clientes", (req, res) => {
    const { nome, telefone, email, senha } = req.body;
    db.query("INSERT INTO clientes (nome, telefone, email, senha) VALUES (?,?,?,?)", 
    [nome, telefone, email, senha || '123'], () => res.send("ok"));
});


app.put("/clientes/:id", (req, res) => {
    const { nome } = req.body;

    db.query(
        "UPDATE clientes SET nome = ? WHERE id_cliente = ?",
        [nome, req.params.id],
        (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Erro ao atualizar cliente");
            }

            res.send("ok");
        }
    );
});


app.delete("/clientes/:id", (req, res) => {
    const id = req.params.id;

    // 1. Verifica se o cliente tem vendas
    db.query("SELECT * FROM vendas WHERE id_cliente = ?", [id], (err, vendas) => {
        if (err) {
            console.error("Erro ao verificar vendas:", err);
            return res.status(500).send("Erro no servidor");
        }

        if (vendas.length > 0) {
            return res.status(400).send("Cliente possui vendas e não pode ser excluído");
        }

        // 2. Se não tiver vendas, pode excluir
        db.query("DELETE FROM clientes WHERE id_cliente = ?", [id], (err2) => {
            if (err2) {
                console.error("Erro ao excluir cliente:", err2);
                return res.status(500).send("Erro ao excluir cliente");
            }

            res.send("ok");
        });
    });
});

app.get("/produtos", (req, res) => {
    db.query("SELECT p.*, e.quantidade FROM produtos p JOIN estoque e ON p.id_produto = e.id_produto", 
    (err, result) => res.json(result));
});

app.post("/produtos", (req, res) => {
    const { nome, preco, quantidade, estoque_minimo } = req.body;
    db.query("INSERT INTO produtos (nome, preco, estoque_minimo) VALUES (?,?,?)", 
    [nome, preco || 0, estoque_minimo || 5], (err, result) => {
        db.query("INSERT INTO estoque (id_produto, quantidade) VALUES (?,?)", 
        [result.insertId, quantidade || 0], () => res.send("ok"));
    });
});

app.put("/produtos/:id", (req, res) => {
    const { nome, quantidade, estoque_minimo } = req.body;

    // Atualiza produto
    db.query(
        "UPDATE produtos SET nome = ?, estoque_minimo = ? WHERE id_produto = ?",
        [nome, estoque_minimo, req.params.id],
        (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Erro ao atualizar produto");
            }

            // Atualiza estoque separado
            db.query(
                "UPDATE estoque SET quantidade = ? WHERE id_produto = ?",
                [quantidade, req.params.id],
                (err2) => {
                    if (err2) {
                        console.error(err2);
                        return res.status(500).send("Erro ao atualizar estoque");
                    }

                    res.send("ok");
                }
            );
        }
    );
});

app.delete("/produtos/:id", (req, res) => {
    const id = req.params.id;

    // Verifica se produto está em vendas
    db.query(
        "SELECT * FROM itens_venda WHERE id_produto = ?",
        [id],
        (err, itens) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Erro no servidor");
            }

            if (itens.length > 0) {
                return res.status(400).send("Produto já foi vendido e não pode ser excluído");
            }

            // Deleta do estoque primeiro
            db.query(
                "DELETE FROM estoque WHERE id_produto = ?",
                [id],
                (err2) => {
                    if (err2) {
                        console.error(err2);
                        return res.status(500).send("Erro ao deletar estoque");
                    }

                    // Depois deleta o produto
                    db.query(
                        "DELETE FROM produtos WHERE id_produto = ?",
                        [id],
                        (err3) => {
                            if (err3) {
                                console.error(err3);
                                return res.status(500).send("Erro ao deletar produto");
                            }

                            res.send("ok");
                        }
                    );
                }
            );
        }
    );
});


app.post("/vendas", (req, res) => {
    const { id_cliente, id_produto, quantidade } = req.body;

    // 1. Cria o registro na tabela principal de vendas
    db.query("INSERT INTO vendas (id_cliente) VALUES (?)", [id_cliente], (err, resultVenda) => {
        if (err) {
            console.error("Erro ao criar venda:", err);
            return res.status(500).send("Erro ao criar venda no banco");
        }

        const id_venda = resultVenda.insertId;

        // 2. Insere o item buscando o preço direto da tabela produtos (Subquery)
        // Isso evita que o erro de preço 'undefined' pare o processo
        const sqlItem = `
            INSERT INTO itens_venda (id_venda, id_produto, quantidade, preco_unitario)
            SELECT ?, ?, ?, preco FROM produtos WHERE id_produto = ?`;

        db.query(sqlItem, [id_venda, id_produto, quantidade, id_produto], (errItem) => {
            if (errItem) {
                console.error("Erro ao inserir item (cheque se a coluna preco_unitario existe):", errItem);
                return res.status(500).send("Erro ao inserir item da venda");
            }

            // 3. Atualiza o estoque
            db.query("UPDATE estoque SET quantidade = quantidade - ? WHERE id_produto = ?", 
            [quantidade, id_produto], (errEst) => {
                if (errEst) console.error("Erro ao baixar estoque:", errEst);
                
                res.send("ok"); // Sucesso total!
            });
        });
    });
});


app.get("/vendas", (req, res) => {
    const sql = `
        SELECT 
            v.id_venda AS id_pedido, 
            c.nome AS cliente, 
            p.nome AS produto, 
            iv.quantidade 
        FROM vendas v
        JOIN clientes c ON v.id_cliente = c.id_cliente
        JOIN itens_venda iv ON v.id_venda = iv.id_venda
        JOIN produtos p ON iv.id_produto = p.id_produto
        ORDER BY v.id_venda DESC`;
        
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.delete("/vendas/:id", (req, res) => {
    const id = req.params.id;

    // 1. Buscar itens da venda
    db.query(
        "SELECT id_produto, quantidade FROM itens_venda WHERE id_venda = ?",
        [id],
        (err, itens) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Erro ao buscar itens");
            }

            if (itens.length === 0) {
                return res.status(400).send("Venda sem itens");
            }

            // 2. Atualizar estoque em sequência
            let updates = itens.map(item => {
                return new Promise((resolve, reject) => {
                    db.query(
                        "UPDATE estoque SET quantidade = quantidade + ? WHERE id_produto = ?",
                        [item.quantidade, item.id_produto],
                        (err2) => {
                            if (err2) reject(err2);
                            else resolve();
                        }
                    );
                });
            });

            Promise.all(updates)
                .then(() => {
                    // 3. Excluir venda
                    db.query(
                        "DELETE FROM vendas WHERE id_venda = ?",
                        [id],
                        (err3) => {
                            if (err3) {
                                console.error(err3);
                                return res.status(500).send("Erro ao excluir venda");
                            }

                            res.send("ok");
                        }
                    );
                })
                .catch(err => {
                    console.error(err);
                    res.status(500).send("Erro ao atualizar estoque");
                });
        }
    );
});


app.listen(3000, () => console.log("Rodando na 3000"));

