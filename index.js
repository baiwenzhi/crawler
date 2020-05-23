const request = require('request');
let cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const download = require('download');
const domain = '';

const queryPage = (uri, load) => {
    request({
        header: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36",
            Referer: domain
        },
        uri: uri
    },  (error, response, body) => {
        if (!error && response.statusCode == 200) {
            load(cheerio.load(body, {ignoreWhitespace: true}));
        }
    });
}
let total = 0;
let down = 0;
let currentPage = 1;
let endPage = 25;
let lastPec = 0;
let lastTemtep = 0;
let beginTimeTemp = '';

const dd = (url, dirpath, tp) => {
    download(url, dirpath).then(() => {
        if (tp === beginTimeTemp) {
            down+=1;
        }
    }, (error)=> {
        console.log(url, error)
    });
}
const caclPec = ()=> {
    if (total!==0 ) {
        console.log(`${(down/total)*100} %  ${down} ${total}`)
        return (down/total)
    } else {
        return undefined;
    }
}
fs.mkdirSync(path.join(process.cwd(), 'dist'), {recursive :true});
const begin = (page) => {
    total = 0;
    down = 0;
    lastPec = 0;
    lastTemtep = 0;
    beginTimeTemp = new Date().getTime();
    console.log(`query page ${page}`)
    const dist = `dist/${page}`;
    fs.mkdirSync(path.join(process.cwd(), dist), {recursive :true})
    queryPage(`${domain}/page/${page}/`, ($1)=> {
        const ll = [];
        $1('#masonry > div > div > a > div').each((asd, asdasw) => {
            const dname = $1(asdasw).text().trim();
            ll.push(dname);
            fs.mkdirSync(path.join(process.cwd(), dist, dname), {recursive :true})
        })
        $1('#masonry > div a').each((tt,ss)=>{
            queryPage($1(ss).attr('href'), ($2) => {
                $2('#masonry > div > img').each((ind, va) => {
                    const imgUrl = $2(va).attr('data-original');
                    total +=1;
                    const splits = imgUrl.split('/');
                    const filePath = `${dist}/${ll[tt]}/${splits[splits.length-1]}`;
                    fs.stat(filePath, (err, stats) => {
                        if(!(err)){
                            if (stats.size === 0) {
                                fs.unlinkSync(`${dist}/${ll[tt]}/${splits[splits.length-1]}`);
                                dd(imgUrl, `${dist}/${ll[tt]}`, beginTimeTemp);
                            } else {
                                down+=1;
                            }
                        } else {
                            dd(imgUrl, `${dist}/${ll[tt]}`, beginTimeTemp);
                        }
                    })
                })
            })
        })
    })
}
begin(currentPage);
const interval = setInterval(() => {
    const nowPec = caclPec();
    const currentTime = new Date().getTime();
    if (nowPec === lastPec) {
        if (lastTemtep !== 0 && (currentTime - lastTemtep) > 5000 ) {
            console.log('等待了5秒，重新获取')
            begin(currentPage)
        } else {
            lastPec = nowPec;
        }
    } else if (nowPec === 1) {
        currentPage += 1;
        if (currentPage > endPage) {
            clearInterval(interval);
            console.log(currentPage, ' 下载图片完成')
        } else {
            begin(currentPage);
        }
    } else {
        lastTemtep = currentTime;
        lastPec = nowPec;
    }
}, 1000)

