const form = document.querySelector('#loginForm');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Pegando os valores dos inputs
    const email = document.getElementById("loginEmail").value;
    const senha = document.getElementById("loginSenha").value;

    const dados = { email, senha };

    try {
        // Adicionada a constante API para garantir o caminho correto
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            const result = await response.json();
            
            // Salva o token e os dados do usuário (como o nome para as boas-vindas)
            localStorage.setItem('token', result.token);
            localStorage.setItem('usuario', JSON.stringify(result.user)); 
            
            // Redireciona para a página principal
            window.location.href = 'user.html'; 
        } else {
            alert('E-mail ou senha incorretos!');
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Erro ao conectar com o servidor.");
    }
});

const cadastroForm = document.querySelector('#cadastroForm');

cadastroForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = document.getElementById("cadNome").value;
    const email = document.getElementById("cadEmail").value;
    const senha = document.getElementById("cadSenha").value;

    try {
        const res = await fetch('http://localhost:3000/clientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });

        if (res.ok) {
            alert("Cadastro realizado! Agora faça login.");
        } else {
            alert("Erro ao cadastrar");
        }

    } catch (err) {
        console.error(err);
        alert("Erro ao conectar com o servidor");
    }
});
