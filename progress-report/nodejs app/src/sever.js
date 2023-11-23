const path = require('path');
const express = require('express');
const morgan = require('morgan');
const handlebars = require('express-handlebars');
const app = express();
const port = 7979;

app.use(express.static(path.join(__dirname,'public')));
// HTTP
app.use(morgan('combined'));

// Template engine
app.engine('handlebars', handlebars.engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname,'resources','views'));



// Route cho trang quản lý đề tài
app.get('/myTable', (req, res) => {
  res.render('them', { page: 'myTable' });
});

// Route cho trang đăng kí
app.get('/student', (req, res) => {
  res.render('dangki', { page: 'student' });
});



app.listen(port, () => console.log(`Example app listening on port ${port}`));
