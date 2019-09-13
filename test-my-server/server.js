const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');
const { parseCommitList, getPathFromUrl } = require('./parseResponse');

// get argument from command line
let pathToRep = process.argv[2];

// get array of dirrectory contents
let contentsOfRep = fs.readdirSync(pathToRep);

const app = express();
app.use(express.static('static'));


app.get('/', (req, res) => res.json({ 
    "/api/repos": "Возвращает массив репозиториев, которые имеются в папке.", 
    "/api/repos/:repositoryId/commits/:commitHash": "Возвращает массив коммитов в данной ветке (или хэше коммита) вместе с датами их создания.",
    "/api/repos/:repositoryId/commits/:commitHash/diff": "Возвращает diff коммита в виде строки.",
    "/api/repos/:repositoryId(/tree/:commitHash/:path)": "Возвращает содержимое репозитория по названию ветки (или хэшу комита)." 
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
    
    exec(`git log --pretty=format:"%H <><><> %ad ||| %s" ${commitHash}`, {cwd: `${pathToRep}/${repositoryId}`}, (err, out) => { 
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

// 3-rd) shows diff
app.get('/api/repos/:repositoryId/commits/:commitHash/diff', (req, res) => {

    const repositoryId = req.params.repositoryId;
    const commitHash = req.params.commitHash;
    
    // хэш последнего коммита
    // git log --pretty=format:"%H" -1
    // git log --pretty=format:"%H" -2

    // get hash of the last commit
    exec(`git log --pretty=format:"%H" -1`, {cwd: `${pathToRep}/${repositoryId}`}, (err, out) => {
        if (err) {
            console.error(err);
            res.json({ err });
        }
        else {

            exec(`git diff ${commitHash} ${out}`, {cwd: `${pathToRep}/${repositoryId}`}, (err1, out1) => {
                if (err1) {
                    console.error(err1);
                    res.json({ err1 });
                }
                else {
                    console.log(out1);
                    res.send( out1 );
                }
            })
        }
    })
})

// 4-th) repository contents
app.get('/api/repos/:repositoryId/tree/:commitHash*?/:path*?', (req, res) => {

    const repositoryId = req.params.repositoryId;
    const commitHash = req.params.commitHash;
    const path = req.params.path;

    const filepath = getPathFromUrl(req, repositoryId, commitHash, path);
    const moddedFilePath = filepath.replace(/\//g, '\\');

    if (filepath !== '') {
        console.log(`pathToRep : ${pathToRep}`);
        console.log(`filepath : ${moddedFilePath}`);
        let contentsOfSmallRep = fs.readdirSync(`${pathToRep}${moddedFilePath}`);
        console.log(contentsOfSmallRep);
        res.send( contentsOfSmallRep );
    }


})

app.listen(3000);

