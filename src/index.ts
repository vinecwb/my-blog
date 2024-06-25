import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, User, Post } from '@prisma/client';
import { authenticateToken } from './authMiddleware';


const prisma = new PrismaClient();
const app = express();
const secret = 'mysecretkey';

app.use(express.json());





// Rota para login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  console.log(`Tentativa de login para o email: ${email}`);

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      console.log(`Usuário não encontrado ou senha inválida para o email: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`Usuário autenticado com sucesso: ${email}`);

    const token = jwt.sign({ id: user.id }, secret, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Erro durante a autenticação:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// GET /users
app.get('/users', async (req, res) => {
  try {
    const users: User[] = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// GET /posts
app.get('/posts', async (req, res) => {
  try {
    const posts: (Post & { author: User | null })[] = await prisma.post.findMany({
      where: { published: true },
      include: { author: true },
    });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Error fetching posts' });
  }
});

// GET /posts/:id
app.get('/posts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const post = await prisma.post.findUnique({
      where: { id: Number(id) },
    });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    res.json(post);
  } catch (error) {
    console.error(`Error fetching post with ID ${id}:`, error);
    res.status(500).json({ error: `Error fetching post with ID ${id}` });
  }
});

app.get('/posts/admin', async (req, res) => {
  try {
    const posts: Post[] = await prisma.post.findMany();
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Error fetching posts' });
  }
});

app.get('/posts/search', async (req, res) => {
  const { keyword } = req.query; // Obtém o parâmetro de consulta 'keyword' da requisição

  try {
    let posts: Post[];

    if (keyword) {
      // Se houver uma palavra-chave, filtra as postagens pelo título ou pelo conteúdo que contêm a palavra-chave
      posts = await prisma.post.findMany({
        where: {
          OR: [
            { title: { contains: keyword as string, mode: 'insensitive' } }, // Procura por correspondência no título
            { content: { contains: keyword as string, mode: 'insensitive' } }, // Procura por correspondência no conteúdo
          ],
        },
      });

      // Verifica se encontrou alguma postagem
      if (posts.length === 0) {
        return res.status(404).json({ error: `Nenhuma postagem foi encontrada com a palavra-chave '${keyword}'` });
      }
    } else {
      // Se não houver palavra-chave, busca todas as postagens
      posts = await prisma.post.findMany();
    }

    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Error fetching posts' });
  }
});

// POST /user
app.post('/users', async (req, res) => {
  const { email, password, name, role } = req.body;

  try {
    // Hash do password usando bcrypt
    const hashedPassword = await bcrypt.hash(password, 10); // 10 é o saltRounds

    // Criação do novo usuário usando Prisma
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword, 
        name,
        role: role || 'USER' 
      },
    });

    res.json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
});

// POST /posts
app.post('/posts', authenticateToken, async (req, res) => {
  const { title, content, authorEmail } = req.body;
  try {
    const result = await prisma.post.create({
      data: {
        title,
        content,
        published: false,
        author: { connect: { email: authorEmail } },
      },
    });
    res.json(result);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Error creating post' });
  }
});

// PUT /posts/:id
app.put('/posts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  try {
    const existingPost = await prisma.post.findUnique({ where: { id: Number(id) } });

    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const updatedPost = await prisma.post.update({
      where: { id: Number(id) },
      data: { content },
    });

    res.json(updatedPost);
  } catch (error) {
    console.error(`Error updating post with ID ${id}:`, error);
    res.status(500).json({ error: `Error updating post with ID ${id}` });
  }
});

// PUT /post/publish/:id
app.put('/post/publish/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const post = await prisma.post.update({
      where: { id: Number(id) },
      data: { published: true },
    });
    res.json(post);
  } catch (error) {
    console.error(`Error publishing post with ID ${id}:`, error);
    res.status(500).json({ error: `Error publishing post with ID ${id}` });
  }
});

// DELETE /post/:id
app.delete('/posts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const deletedPost = await prisma.post.delete({ where: { id: Number(id) } });

    res.json(deletedPost);
  } catch (error) {
    console.error(`Error deleting post with ID ${id}:`, error);
    res.status(500).json({ error: `Error deleting post with ID ${id}` });
  }
});

const server = app.listen(3000, () => {
  console.log('REST API server ready at: http://localhost:3000');
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Prisma Client disconnected');
  server.close();
});
