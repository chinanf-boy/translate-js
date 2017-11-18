const fs = require('fs')
const { fixEntoZh } = require('./fixEntoZh')
const chalk = require('chalk');

function insert_flg(str, flg, Uindex) {
    var newstr = "";
    if(!str || !flg){
        throw new Error('你把什么放进来啦') 
    }
    var len = str.length
    var tmp = str.substring(0, len - Uindex);
    newstr = tmp + flg + str.substring(len-Uindex, len)
    return newstr;
}

const writeDataToFile = (data, file_dir) => {
    var zhfile
    if(!file_dir.endsWith('.md')){
        throw new Error('没有 获得 md 文章') 
    }
    zhfile = insert_flg(file_dir, '.zh', 3)

    // data is Array
    //fixE2Z
    
    if(data instanceof Array){
        data = fixEntoZh(data).join("\n")
    }
    
    
    fs.writeFile(zhfile+'', data, (err) => {
        if (err) 
            throw err;
        console.log(chalk.magenta( 'The new Zh file has been saved!','\n -->> '),zhfile);
    });
}

module.exports = {writeDataToFile, insert_flg}