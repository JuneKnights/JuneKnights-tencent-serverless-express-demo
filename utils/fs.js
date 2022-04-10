const fs = require("fs")
const path = require("path")

/**
 * 创建路径
 * @param {string} dir 路径
 */
function mkdir(dir) {
    return new Promise((resolve, reject) => {
        fs.mkdir(dir, (err) => {
            err ? resolve(false) : resolve(true)
        })
    })
}

/**
 * 读取路径信息
 * @param {string} filePath 路径
 */
function getStat(filePath) {
    return new Promise((resolve) => {
        fs.stat(filePath, (err, stats) => {
            err ? resolve(false) : resolve(stats)
        })
    })
}

/**
 * 路径是否存在，不存在则创建
 * @param {string} dir 路径
 *
 */
function checkDirExistsAndMkdir(dir) {
    console.log('\033[42;30m INFO \033[40;32m checkDirExistsAndMkdir ---------- ', dir)

    return new Promise((resolve, reject) => {
        const dirs = dir
        const now = Date.now()

        async function fun(dir) {

            console.log('dir-----------', dir)
            const isExists = await getStat(dir)
            console.log('isExists-----------', isExists)

            // 如果该路径存在且不是文件，返回 true
            if (isExists && isExists.isDirectory()) {
                return true
            } else if (isExists) {  // 这个路径对应一个文件夹，无法再创建文件了
                return false
            }

            // 如果该路径不存在
            const tempDir = path.parse(dir).dir  //拿到上级路径
            // 递归判断，如果上级路径也不存在，则继续循环执行，直到存在
            const status = await fun(tempDir)
            let mkdirStatus
            if (status) {
                mkdirStatus = await mkdir(dir)
            }

            const isDone = await getStat(dirs)
            if (isDone && isDone.isDirectory()) {
                console.log('\033[42;30m DONE \033[40;32m 文件夹已创建完成，耗时 ---------- ' + (Date.now() - now) / 1000 + '秒\033[0m')

                resolve((Date.now() - now) / 1000)
                return true
            }

            return mkdirStatus
        }

        fun(dir)
    })
}

/**
 *
 * @param len {number} 文件名长度
 * @returns {string} 文件名
 */
function randomFileName(len = 32) {
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012345678'
    let maxPos = chars.length
    let pwd = ''

    for (let i = 0; i < len; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * maxPos))
    }

    return pwd
}

/**
 * 检查文件是否存在于当前目录中
 * @param fileDir 检测路径
 */
function checkExist(fileDir) {
    return new Promise((resolve, reject) => {
        fs.access(fileDir, fs.constants.F_OK, (err) => {
            console.log(`${fileDir} ${err ? '不存在' : '存在'}`)
            err ? resolve(false) : resolve(true)
        })
    })
}

/**
 * 检查文件是否可读
 * @param fileDir 检测路径
 */
function checkRead(fileDir) {
    return new Promise((resolve, reject) => {
        fs.access(fileDir, fs.constants.R_OK, (err) => {
            console.log(`${fileDir} ${err ? '不可读' : '可读'}`)
            err ? resolve(false) : resolve(true)
        })
    })
}

/**
 * 检查文件是否可写
 * @param fileDir 检测路径
 */
function checkWrite(fileDir) {
    return new Promise((resolve, reject) => {
        fs.access(fileDir, fs.constants.W_OK, (err) => {
            console.log(`${fileDir} ${err ? '不可写' : '可写'}`)
            err ? resolve(false) : resolve(true)
        })
    })
}

/**
 * 检查文件是否存在于当前目录中、以及是否可写
 * @param fileDir 检测路径
 * @returns {Promise<unknown>} 1 = 不存在, 2 = 只可读, 3 = 存在，且可写
 */
function checkExistAndWrite(fileDir) {
    return new Promise((resolve, reject) => {
        fs.access(fileDir, fs.constants.F_OK | fs.constants.W_OK, (err) => {
            if (err) {
                console.error(`${fileDir} ${err.code === 'ENOENT' ? '不存在' : '只可读'}`)
            } else {
                console.log(`${fileDir} 存在，且可写`)
                resolve(true)
            }
        })
    })
}

module.exports = {
    mkdir,
    getStat,
    randomFileName,
    checkExist,
    checkRead,
    checkWrite,
    checkExistAndWrite,
    checkDirExistsAndMkdir
}
