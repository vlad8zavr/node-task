const express = require('express');
// const fs = require('fs');
const fs = require('fs-extra');
const { exec, spawn } = require('child_process');
const { parseCommitList, parseRepositoryContent, getPathFromUrl, getPathDeleteMethod } = require('./parseResponse');

// get argument from command line
let pathToRep = process.argv[2];

// get array of dirrectory contents
let contentsOfRep = fs.readdirSync(pathToRep);

const app = express();
app.use(express.static('static'));
app.use(express.json());

app.get('/', (req, res) => res.json({ 
    "/api/repos": "Возвращает массив репозиториев, которые имеются в папке.", 
    "/api/repos/:repositoryId/commits/:commitHash": "Возвращает массив коммитов в данной ветке (или хэше коммита) вместе с датами их создания.",
    "/api/repos/:repositoryId/commits/:commitHash/diff": "Возвращает diff коммита в виде строки.",
    "/api/repos/:repositoryId(/tree/:commitHash/:path)": "Возвращает содержимое репозитория по названию ветки (или хэшу комита).",
    "/api/repos/:repositoryId/blob/:commitHash/:pathToFile": "Возвращает содержимое конкретного файла, находящегося по пути pathToFile в ветке (или по хэшу коммита) branchName.",
    "/api/repos/:repositoryId": "Безвозвратно удаляет репозиторий.",
    "/api/repos + { url: ‘repo-url’ }": "Добавляет репозиторий в список, скачивает его по переданной в теле запроса ссылке и добавляет в папку со всеми репозиториями."
}));

// 1-st) shows all repos
app.get('/api/repos', (req, res) => res.send( contentsOfRep ));

// 2-nd) shows all commits
app.get('/api/repos/:repositoryId/commits/:commitHash', (req, res) => {

    // req.params - объект с параметрами из адресной строки
    const repositoryId = req.params.repositoryId;
    const commitHash = req.params.commitHash;

    // хэш ветки
    // git rev-parse master : 07eba6f6668952aa749015e96f1f9a086c6d6f0b
    // git rev-parse test   : 7a9229814149fab2a8af1ab84a94e9c12340913e
    
    // git --no-pager log  (without less) 

    exec(`git --no-pager log --pretty=format:"%H <><><> %ad ||| %s" ${commitHash}`, {cwd: `${pathToRep}/${repositoryId}`}, (err, out) => { 
        if (err) {
            console.error(err);
            res.json({ err });
        }
        else {
            const arrayOfCommits = parseCommitList(out);
            res.send( arrayOfCommits );
        }
    })

})

// 3-rd) shows diff (parse answer - ?)
app.get('/api/repos/:repositoryId/commits/:commitHash/diff', (req, res) => {

    const repositoryId = req.params.repositoryId;
    const commitHash = req.params.commitHash;
    
    // хэш последнего коммита
    // git log --pretty=format:"%H" -1
    // git log --pretty=format:"%H" -2

    let result = '';

    let workerProcess = spawn('git', ['diff', `${commitHash}^1..${commitHash}`], {cwd: `${pathToRep}/${repositoryId}`});

    workerProcess.stdout.on('data', data => {
        result += data.toString();
    });

    workerProcess.stderr.on('data', err => {
        console.log('stderr: ' + err);
        res.json({ err });
    });

    workerProcess.on('close', code => {
        console.log(`Exit with code ${code}`);
        res.send( result );
    });
})

// 4-th) repository contents (switch to branch exists)
app.get('/api/repos/:repositoryId/tree/:commitHash*?/:path*?', (req, res) => {

    const repositoryId = req.params.repositoryId;
    const commitHash = req.params.commitHash;
    const path = req.params.path;

    const filepath = getPathFromUrl(req, repositoryId, commitHash, 'tree');
    const moddedFilePath = filepath.replace(/\//g, '\\');

    if (commitHash) {

        exec(`git ls-tree -r --name-only ${commitHash} ${moddedFilePath}`, {cwd: `${pathToRep}/${repositoryId}`}, (err, out) => {
            if (err) {
                console.log(err);
                res.json({ err });
            }
            else {
                let arrayOfFiles = parseRepositoryContent(out);
                res.send( arrayOfFiles );
            }
        })
    }
    else {
        let pathToWalk = (filepath !== '') ? `${pathToRep}${repositoryId}\\${moddedFilePath}` : `${pathToRep}${repositoryId}`;
        let contentsOfSmallRep = fs.readdirSync(`${pathToWalk}`);
        res.send( contentsOfSmallRep );
    }    
})

// 5-th) shows blob (switch to branch exists)
app.get('/api/repos/:repositoryId/blob/:commitHash/:pathToFile*', (req, res) => {
    // exec -> cat ./pathToFile
    // cat ./.git/objects/b9/6469de2a06092f8b4927899e1684e8e50f1ca8

    const repositoryId = req.params.repositoryId;
    const commitHash = req.params.commitHash;

    const filepath = getPathFromUrl(req, repositoryId, commitHash, 'blob');
    const moddedFilePath = filepath.replace(/\//g, '\\');

    console.log(moddedFilePath);

    exec(`git checkout ${commitHash}`, {cwd: `${pathToRep}/${repositoryId}`}, (err, out) => {
        if (err) {
            console.log(err);
            res.json({ err });
        }
        else {
            console.log('CHECKOUT WAS A SUCCESS');
            let pathToWalk = `${pathToRep}${repositoryId}\\${moddedFilePath}`;
            console.log('pathToWalk');
            console.log(pathToWalk);

            // fs.readFile(`${pathToWalk}`, 'utf-8', (err, contents) => {
            //     if (err) console.log(err);
            //     //console.log(contents);
            //     res.json( contents );
            // });

            // possible memory problem fix
            const stream = fs.createReadStream(`${pathToWalk}`);
            stream.pipe(res);
        }
        console.log('----------------------------');
    })
})

// 6-th) remove repository
app.delete('/api/repos/:repositoryId*', (req, res) => {

    let dirPath = getPathDeleteMethod(req);
    const moddedDirPath = dirPath.replace(/\//g, '\\');

    fs.remove(`${pathToRep}${moddedDirPath}`, err => {
        console.error(err)
    })
})

// 7-th) git clone <url>
// таймаут для несуществующего url
// curl --write-out "%{http_code}\n" --silent --output /dev/null
// curl -L --write-out "%{http_code}\n" --silent --output /dev/null
app.post('/api/repos', (req, res) => {

    const url = req.body.url;
    console.log(url);

    let workerProcess = spawn('git', ['clone', `${url}`], {cwd: `${pathToRep}/`});

    workerProcess.stderr.on('data', err => {
        console.log('stderr: ' + err);
        //res.json({ err });
     });
   
     workerProcess.on('close', code => {
        console.log(`Exit with code ${code}`);
        res.send( 'CLONING - SUCCESS' );
     });

});

// bonus 1) pagination for the list of commits
// вывод с начала
// git --no-pager log --pretty=format:"%H <><><> %ad ||| %s" | head -n 20 | tail -n 10
// WORKS IN BASH (GIT) console on windows
// doesn't work from vsCode terminal
app.get('/api/repos/:repositoryId/commitsPagination/:commitHash/:numberOfCommits/:listNumber', (req, res) => {
    const repositoryId = req.params.repositoryId;
    const commitHash = req.params.commitHash;
    const numberOfCommits = req.params.numberOfCommits;
    const listNumber = req.params.listNumber;

    // listNumber 1 => head - numberOfCommits
    // listNumber n => head - numberOfCommits * listNumber ; tail - numberOfCommits * (listNumber - 1)

    let pagPart = (listNumber === '1') 
        ? `head -n ${numberOfCommits}` 
        : `head -n ${numberOfCommits * listNumber} | tail -n ${numberOfCommits * (listNumber - 1)}`;

    console.log('BONUS 1');

    exec(`git --no-pager log --pretty=format:"%H <><><> %ad ||| %s" ${commitHash} | ${pagPart}`, {cwd: `${pathToRep}/${repositoryId}`}, (err, out) => {
        if (err) {
            console.error(err);
            res.json({ err });
        }
        else {
            const arrayOfCommits = parseCommitList(out);
            res.send( arrayOfCommits );
        }
    })
})

// 404
app.use((req, res, next) => {
    res.status(404);
    res.send('404: File Not Found');
});

app.listen(3000);

/**
 * IDEAS FOR PAGINATION
 * make a get request for only 10 (for example) last commits (commits/hash/1)
 * then 10 previous commits (commits/hash/2)
 * ...
 */