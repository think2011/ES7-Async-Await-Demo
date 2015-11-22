import fs from 'fs';
import path from 'path';
import colog from 'colog';
import request from 'request';

var movieDir = process.argv[2] || __dirname + '/movies',
    exts     = {
        movie: ['.mkv', '.avi', '.mp4', '.rm', '.rmvb', '.wmv'],
        image: ['.jpg']
    };

// 读取文件列表
var readFiles = function (exts) {
    return new Promise(function (resolve, reject) {
        fs.readdir(movieDir, function (err, files) {
            resolve(files.filter(v => exts.includes(path.parse(v).ext)));
        });
    });
};

// 获取海报
var getPoster = function (movieName) {
    let url = `https://api.douban.com/v2/movie/search?q=${encodeURI(movieName)}`;

    return new Promise(function (resolve, reject) {
        request({url: url, json: true}, function (error, response, body) {
            if (error) return reject(error);

            resolve(body.subjects[0].images.large);
        })
    });
};

// 检查文件是否存在
var existPoster = function (movieName) {
    const file = path.join(movieDir, movieName) + '.jpg';

    return new Promise(function (resolve, reject) {
        fs.exists(file, resolve);
    });
};

// 保存海报
var savePoster = async function (movieName) {
    const file = path.join(movieDir, movieName) + '.jpg';

    if (await existPoster(movieName)) {
        colog.warning(`无需获取【${movieName}】的海报`);
    } else {
        const url = await getPoster(movieName);

        request.get(url)
            .pipe(fs.createWriteStream(file))
            .on('finish', () => {
                colog.answer(`成功获取【${movieName}】的海报`);
            });
    }
};


(async () => {
    let files  = (await readFiles(exts.movie)).map(name => path.parse(name).name),
        images = await readFiles(exts.image);

    // 删除不存在的电影海报
    for (var image of images) {
        let imageName = path.parse(image).name,
            isExist   = files.indexOf(imageName) !== -1;

        !isExist && fs.unlink(path.join(movieDir, image), err => colog.error(`删除【${imageName}】的海报`));
    }

    for (var file of files) {
        let movieName = path.parse(file).name;

        savePoster(movieName);
    }
})();
