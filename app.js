const express = require('express')
const execa = require("execa")
const os = require('os')
const path = require('path')
const fs = require('fs')
const app = express()
app.use('/static', express.static(__dirname + '/static'));// 建议放在router之后。现在你可以使用 /static 作为前缀来加载 public 文件夹下的文件了。http://192.168.1.39:9955/static/demo.html

const resolve = name => path.resolve(__dirname, './static', name)
const shell = resolve('krpanotools')
const config = resolve('templates/vtour-multires.config')

app.get(`/`, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.all('/readDir', (req, res, next) => {
    fs.readdir(path.resolve(__dirname, './static'), {encoding: 'utf8'}, (err, files) => {
        if (err) throw err
        console.log('读取的目录内容：', files)
        res.send(files)
    })
})

app.all(`/pano`, async (req, res) => {
    const now = Date.now()

    const img2 = resolve('2.jpg')
    var totalmem = os.totalmem()
    console.log(totalmem);

    console.log(img2)
    console.log(shell)
    console.log(config)
    console.log(`${shell} makepano -config=${config} ${img2}`)
    try {
        console.log('\033[42;30m READ \033[40;32m 开始切图------------\033[0m')

        // 转换为立方体最大宽度默认是60000
        /** 16.3M的切图配置耗时比
         * 默认：104秒 93秒 98秒 82秒 101秒
         * -html=false：103秒 不生成预览文件
         * -preview=false:不能减少这一步，好像是生成球状全景所需要
         * -makescenes=false：会删除掉xml文件里面的scene 资源路径，不能减少这一步，主要是单个图对应单个配置，多用户使用不能操作同一个配置
         * -converttocube=false 将球形和圆柱形图像自动转换为立方体图像。 立体图像可以提供更好的加载和渲染性能。球体更节省时间
         *
         * */
        const result = await execa(`${shell} makepano -config=${config} ${img2}`, {
            shell: true,
            cwd: __dirname
        })
        console.log('切图耗时：' + (Date.now() - now) / 1000 + '秒')
        res.send('切图耗时：' + (Date.now() - now) / 1000 + '秒').status(200).end()
    } catch (e) {
        console.log('catch-------------------', e)
        res.send('切图失败')
    }
})


app.get(`/address`, (req, res) => {
    res.send(__dirname);
    res.status(200).end();
});

app.get(`/logo`, (req, res) => {
    const logo = path.join(__dirname, 'logo.png');
    const content = fs.readFileSync(logo, {
        encoding: 'base64',
    });
    res.set('Content-Type', 'image/png');
    res.send(Buffer.from(content, 'base64'));
    res.status(200).end();
});

app.get('/user', (req, res) => {
    res.send([
        {
            title: 'serverless framework',
            link: 'https://serverless.com',
        },
    ]);
});

app.get('/user/:id', (req, res) => {
    const id = req.params.id;
    res.send({
        id: id,
        title: 'serverless framework',
        link: 'https://serverless.com',
    });
});

app.get('/404', (req, res) => {
    res.status(404).send('Not found');
});

app.get('/500', (req, res) => {
    res.status(500).send('Server Error');
});

// Error handler
app.use(function (err, req, res, next) {
    console.error(err);
    res.status(500).send('Internal Serverless Error');
});

// Web 类型云函数，只能监听 9000 端口
app.listen(9000, () => {
    console.log(`Server start on http://localhost:9000`);
});
