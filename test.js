const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { marked } = require('marked');
const path = require('path');
const app = express();

// Hardcoded URI since you have no panel variables
const mongoURI = "mongodb+srv://taco:taco@cluster0.01sv4ce.mongodb.net/dci_news?retryWrites=true&w=majority";
mongoose.connect(mongoURI).then(() => console.log("📡 DB Connected"));

const Article = mongoose.model('Article', { 
    title: String, content: String, author: String, 
    category: String, date: { type: Date, default: Date.now } 
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'dci-ultra-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: mongoURI })
}));

// --- ROUTES ---

app.get('/', async (req, res) => {
    const articles = await Article.find().sort({ date: -1 });
    res.render('main', { articles, user: req.session.user });
});

app.get('/article/:id', async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        const htmlContent = marked.parse(article.content || '');
        res.render('viewer', { article, htmlContent });
    } catch (err) { res.redirect('/'); }
});

app.get('/login', (req, res) => res.render('login'));
app.post('/login', (req, res) => {
    req.session.user = { username: req.body.username };
    res.redirect('/editor');
});

app.get('/editor', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const stats = {
        total: await Article.countDocuments(),
        recent: await Article.find().sort({ date: -1 })
    };
    res.render('editor', { user: req.session.user, stats });
});

app.post('/delete/:id', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    await Article.findByIdAndDelete(req.params.id);
    res.redirect('/editor');
});

app.post('/api/submit', async (req, res) => {
    await Article.create(req.body);
    res.redirect('/');
});

// Pterodactyl Port Logic
const PORT = process.env.SERVER_PORT ||3000; 
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Node Live on ${PORT}`));
