const express = require('express')
const request = require("request")
const execa = require("execa")
const path = require('path')
const url = require('url')
const fs = require('fs')
const os = require('os')
const app = express()
app.use('/static', express.static(__dirname + '/static'));// 建议放在router之后。现在你可以使用 /static 作为前缀来加载 public 文件夹下的文件了。http://192.168.1.39:9955/static/demo.html

let h1 = 0
const resolve = name => path.resolve(__dirname, './static', name)
// const shell = resolve('krpanotools')
// const config = resolve('templates/vtour-multires.config')
const {checkDirExistsAndMkdir, checkExist} = require("./utils/fs")


app.get(`/`, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const ossFile2 = 'https://krpano-yx.oss-cn-chengdu.aliyuncs.com/yuxi/tag/2022/02/13/pano-name/pano.jpg'
const urlObj = url.parse(ossFile2)
const pathObj = path.parse(urlObj.path)
const dir = `../static${pathObj.dir}`
const fileAddress = `${resolve(dir)}\\${pathObj.base}`

app.all('/mkDirFile', async (req, res, next) => {
    h1 = 1

    console.log('fileAddress----', fileAddress)
    const isExist = await checkExist(fileAddress)

    if (isExist) {
        res.send({
            h1,
            ...pathObj,
            fileAddress,
            msg: '文件已存在'
        })
        return
    }

    const mdTime = await checkDirExistsAndMkdir(resolve(dir))
    console.log('\033[42;30m MD-Time \033[40;32m ' + mdTime + '\033[0m')

    const now = Date.now()

    console.log('\033[42;30m DONE \033[40;32m 开始下载OSS资源.........')
    const httpFile = request(ossFile2, {timeout: 50000}).pipe(fs.createWriteStream(fileAddress))

    // 下载失败，删除创建的文件夹
    httpFile.on('error', function (err) {
        console.log('\033[41;37m ERROR \033[40;31m 下载图片错误：\033[0m')
        console.log(err)
        console.log('\033[41;37m ERROR \033[40;31m 错误地址：\033[4m', url + '\033[0m')

        fs.rmdir(resolve(dir), function (err) {

            if (err) {
                console.log('\033[41;37m ERROR \033[40;31m 删除失败：', url + '\033[0m')
                res.send({
                    msg: '下载失败',
                    errorUrl: url,
                    err
                })
            }
        })
        return
    })

    // 回调函数
    let downImgTime
    httpFile.on('close', async () => {
        downImgTime = '下载耗时------------ ' + (Date.now() - now) / 1000 + '秒'
        console.log('\033[42;30m DONE \033[40;32m ' + downImgTime + '\033[0m')

        /*try {
            console.log('\033[42;30m READ \033[40;32m 开始切图------------\033[0m')

            // 16.3M的图默认切图配置耗时 113秒，去除html 108秒 去除预览 makescenes=false
            const result = await execa(`${shell} makepano -config=${config} -html=false ${fileAddress}`, {
                shell: true,
                cwd: __dirname
            })
            const time = '切图耗时：' + (Date.now() - now) / 1000 + '秒'
            console.log(time)
            // console.log(result)
            res.send({downImgTime})
        } catch (e) {
            console.log(e)
            res.send('切图失败')
        }*/

        const dirList = await mapDir(path.resolve(__dirname, './static'))

        res.send({
            h1,
            dirList,
            downImgTime
        })
    })
})

app.all('/readDir', async (req, res, next) => {
    const dir = path.resolve(__dirname, './static')
    const dirList = await mapDir(dir)

    res.send({
        h1,
        dirList
    })
})

app.all('/deleteDir', async (req, res, next) => {
    fs.rmdir(resolve(dir), function (err) {

        if (err) {
            console.log('\033[41;37m ERROR \033[40;31m 下载失败：', url + '\033[0m')
            res.send({
                msg: '下载失败',
                errorUrl: url,
                err
            })
            return
        }
    })
})


function mapDir(dir) {
    return new Promise((resolve, reject) => {
        let dirs = dir

        function load(dir) {
            let arrFiles = []
            const files = fs.readdirSync(dir)

            for (let i = 0; i < files.length; i++) {
                const item = files[i]
                const stat = fs.lstatSync(dir + '\\' + item)

                arrFiles.push(dir + '\\' + item)
                if (stat.isDirectory() === true) {
                    arrFiles = arrFiles.concat(load(dir + '\\' + item))
                }/* else {
                    var reg = /^.*\.ini$/
                     var reg1 = /^.*\.txt$/
                     if (reg.test(item) || reg1.test(item)) { //获取的是所有的txt和ini文件
                         arrFiles.push(dir + '\\' + item)
                     }
                }*/
            }

            if (dir === dirs) {
                resolve(arrFiles)
                return true
            }

            return arrFiles
        }

        load(dir)
    })
}

/*
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
/*const result = await execa(`${shell} makepano -config=${config} ${img2}`, {
    shell: true,
    cwd: __dirname
})
console.log('切图耗时：' + (Date.now() - now) / 1000 + '秒')
res.send('切图耗时：' + (Date.now() - now) / 1000 + '秒').status(200).end()
} catch (e) {
console.log('catch-------------------', e)
res.send('切图失败')
}
})*/


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
