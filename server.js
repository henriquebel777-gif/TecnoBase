const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "TecnoBase"
});

db.connect(err => {
    if (err) {
        console.log("Erro ao conectar:", err);
    } else {
        console.log("Conectado ao MySQL");
    }
});

app.get("/", (req, res) => {
    res.send("Servidor online");
});

app.get("/clientes", (req, res) => {
    db.query("SELECT * FROM clientes", (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

app.get("/produtos", (req, res) => {
    const sql = `
        SELECT p.id_produto, p.nome, e.quantidade, e.estoque_minimo
        FROM produto p
        JOIN estoque e ON p.id_produto = e.id_produto
    `;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});









app.get("/vendas", (req, res) => {
    const sql = `
    SELECT 
    p.id_pedido,
    c.nome AS cliente,
    pr.nome AS produto,
    ip.quantidade
    FROM pedido p
    JOIN clientes c ON p.id_cliente = c.id_cliente
    JOIN item_pedido ip ON p.id_pedido = ip.id_pedido
    JOIN produto pr ON ip.id_produto = pr.id_produto
    `;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

app.post("/venda", (req, res) => {
    const { id_cliente, id_produto, quantidade } = req.body;
    
    db.query("INSERT INTO pedido (id_cliente) VALUES (?)",
        [id_cliente],
        (err, result) => {
            if (err) return res.status(500).send(err);
            
            const id_pedido = result.insertId;
            
            db.query(
                "INSERT INTO item_pedido (id_pedido, id_produto, quantidade) VALUES (?, ?, ?)",
                [id_pedido, id_produto, quantidade],
                (err2) => {
                    if (err2) return res.status(500).send(err2);

                    
                    db.query(
                        "UPDATE estoque SET quantidade = quantidade - ? WHERE id_produto = ?",
                        [quantidade, id_produto],
                        (err3) => {
                            if (err3) return res.status(500).send(err3);
                            
                            res.send("Venda realizada!");
                        }
                    );
                    
                                        
                                        app.post("/clientes", async (req, res) => {
                                            const { nome } = req.body;
                                        
                                            try {
                                                const result = await db.query(
                                                    "INSERT INTO clientes (nome) VALUES (?)",
                                                    [nome]
                                                );
                                        
                                                res.json({
                                                    id_cliente: result.insertId,
                                                    nome: nome
                                                });
                                        
                                            } catch (err) {
                                                console.log(err);
                                                res.status(500).send("Erro ao cadastrar cliente");
                                            }
                                        });
                }
            );
        }
    );
});

app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});