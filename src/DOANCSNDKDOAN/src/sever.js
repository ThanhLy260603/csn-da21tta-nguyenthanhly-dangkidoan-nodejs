const express = require('express');
const path = require('path');
const morgan = require('morgan');
const handlebarsHelpers = require('handlebars-helpers')();
const handlebars = require('express-handlebars').create({ helpers: handlebarsHelpers.helpers });
const bodyParser = require('body-parser');
const socketIo = require('socket.io');
const session = require('express-session');
const bcrypt = require('bcrypt');
const http = require('http');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = 7979;

mongoose.connect('mongodb://127.0.0.1:27017/doan', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Kết nối MongoDB thất bại:'));
db.once('open', function () {
    console.log('Kết nối MongoDB thành công');
});

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    userType: String,
    formInfo: { type: mongoose.Schema.Types.ObjectId, ref: 'FormInfo' },
});

const User = mongoose.model('User', userSchema);

const formInfoSchema = new mongoose.Schema({
    teacherName: String,
    topic: String,
    note: String,
    studentInfo: String,
});

const FormInfo = mongoose.model('FormInfo', formInfoSchema);

app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('combined'));

handlebars.helpers = handlebarsHelpers.helpers;

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'resources', 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
    session({
        secret: 'your-secret-key',
        resave: false,
        saveUninitialized: false
    })
);

function requireLogin(req, res, next) {
    console.log('Session user:', req.session.user);
    console.log('Session userType:', req.session.userType);

    if (req.session.user && (req.session.userType === 'teacher' || req.session.userType === 'student')) {
        req.session.editPermission = (req.session.userType === 'teacher');
        next();
    } else {
        console.log('Redirecting to /');
        res.redirect('/');
    }
}
// ...

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Add your logic to check the username and password against the database
        // For example, you can use the User model from Mongoose to find the user

        const user = await User.findOne({ username });

        if (user && bcrypt.compareSync(password, user.password)) {
            req.session.user = username;
            req.session.userType = user.userType;
            res.redirect('/myTable');
        } else {
            res.status(401).send('Invalid username or password');
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Internal Server Error');
    }
});

// ...

app.use('/myTable', requireLogin, async (req, res, next) => {
    try {
        const teacherUsers = await User.find({ userType: 'teacher' }).populate('formInfo');
        const userType = req.session.userType;

        res.locals.myTableData = { users: teacherUsers, userType: userType };
        next();
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching teacher data');
    }
});

const clients = [];

app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    clients.push(res);

    res.write('data: Initial data\n\n');

    req.on('close', () => {
        clients.splice(clients.indexOf(res), 1);
    });
});

function sendEventToClients(event) {
    clients.forEach(client => {
        client.write(`data: ${JSON.stringify(event)}\n\n`);
    });
}

app.get('/myTable', requireLogin, async (req, res) => {
    try {
        const teacherUsers = await User.find({ userType: 'teacher' }).populate('formInfo');
        const userType = req.session.userType;

        res.render('them', { page: 'myTable', session: req.session, users: teacherUsers, userType: userType });
    } catch (error) {
        console.error(error);
        res.status(500).send('Lỗi khi lấy dữ liệu giáo viên từ cơ sở dữ liệu');
    }
});

app.post('/saveData', requireLogin, async (req, res) => {
    try {
        const { rowData } = req.body;

        const newFormInfo = new FormInfo({
            teacherName: rowData.column0,
            topic: rowData.column1,
            note: rowData.column2,
            studentInfo: rowData.column3,
        });

        await newFormInfo.save();

        const existingUser = await User.findOne({ username: req.session.user });

        if (existingUser) {
            existingUser.formInfo = newFormInfo;
            await existingUser.save();
        }

        const eventData = { type: 'dataChange' };
        sendEventToClients(eventData);

        console.log('Data saved successfully');
        res.status(200).json({ message: 'Data saved successfully' });
    } catch (error) {
        console.error('Error saving data to MongoDB:', error);
        res.status(500).json({ error: 'Error saving data to the database.' });
    }
});

app.get('/logout', (req, res) => {
    const eventData = { type: 'logout' };
    sendEventToClients(eventData);

    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        } else {
            res.redirect('/');
        }
    });
});

app.get('/', (req, res) => {
    if (req.session.user) {
        if (req.session.userType === 'teacher') {
            req.session.editPermission = true;
            res.redirect('/myTable');
        } else if (req.session.userType === 'student') {
            req.session.editPermission = false;
            res.redirect('/myTable');
        } else {
            console.log('Invalid user type. Redirecting to /');
            res.redirect('/');
        }
    } else {
        res.render('dangnhap', { page: 'login' });
    }
});

server.listen(port, () => console.log(`Example app listening on port ${port}`));
