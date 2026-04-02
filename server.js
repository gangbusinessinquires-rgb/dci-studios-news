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

// --- MODELS ---

const Article = mongoose.model('Article', {
    title: String, content: String, author: String,
    category: String,
    status: { type: String, default: 'published' }, // 'draft' | 'published'
    date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', {
    username: { type: String, unique: true },
    password: String,
    role: { type: String, default: 'editor' } // 'editor' | 'admin'
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

// --- MIDDLEWARE ---

const requireAuth = (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    next();
};

const requireAdmin = (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    if (req.session.user.role !== 'admin') return res.status(403).send('Forbidden');
    next();
};

// --- PUBLIC ROUTES ---

app.get('/', async (req, res) => {
    const articles = await Article.find({ status: 'published' }).sort({ date: -1 });
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
app.post('/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username, password: req.body.password });
    if (!user) return res.render('login', { error: 'Invalid credentials' });
    req.session.user = { username: user.username, role: user.role, id: user._id };
    res.redirect('/editor');
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

// --- EDITOR ROUTES ---

app.get('/editor', requireAuth, async (req, res) => {
    const stats = {
        total: await Article.countDocuments(),
        recent: await Article.find().sort({ date: -1 })
    };
    res.render('editor', { user: req.session.user, stats });
});

app.post('/api/submit', requireAuth, async (req, res) => {
    try {
        const { title, content, author, category } = req.body;
        await Article.create({ title, content, author, category, status: 'published' });
        res.redirect('/editor');
    } catch (err) {
        res.redirect('/editor');
    }
});

app.post('/delete/:id', requireAuth, async (req, res) => {
    try {
        await Article.findByIdAndDelete(req.params.id);
    } catch (err) {}
    res.redirect('/editor');
});

// --- ADMIN ROUTES ---

app.get('/admin', requireAdmin, async (req, res) => {
    const articles = await Article.find().sort({ date: -1 });
    res.render('admin', { articles, user: req.session.user });
});

app.post('/api/publish/:id', requireAdmin, async (req, res) => {
    try {
        await Article.findByIdAndUpdate(req.params.id, { status: 'published' });
    } catch (err) {}
    res.redirect('/admin');
});

app.post('/api/unpublish/:id', requireAdmin, async (req, res) => {
    try {
        await Article.findByIdAndUpdate(req.params.id, { status: 'draft' });
    } catch (err) {}
    res.redirect('/admin');
});

app.post('/api/delete/:id', requireAdmin, async (req, res) => {
    try {
        await Article.findByIdAndDelete(req.params.id);
    } catch (err) {}
    res.redirect('/admin');
});

// --- ADMIN USER MANAGEMENT ROUTES ---

app.get('/admin/users', requireAdmin, async (req, res) => {
    const users = await User.find().select('-password');
    res.render('admin-users', { users, user: req.session.user });
});

app.post('/admin/users/add', requireAdmin, async (req, res) => {
    try {
        const { username, password, role } = req.body;
        await User.create({ username, password, role });
    } catch (err) {
        // username already exists or other error — silently redirect
    }
    res.redirect('/admin/users');
});

app.post('/admin/users/delete/:id', requireAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
    } catch (err) {}
    res.redirect('/admin/users');
});

// --- PTERODACTYL PORT ---

const PORT = process.env.SERVER_PORT || 80;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Node Live on ${PORT}`));
