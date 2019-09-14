const express = require('express');
// const fs = require('fs');
const fs = require('fs-extra');
const { exec } = require('child_process');
const { parseCommitList, parseRepositoryContent, getPathFromUrl, getPathDeleteMethod } = require('./parseResponse');

// get argument from command line
let pathToRep = process.argv[2];

// get array of dirrectory contents
let contentsOfRep = fs.readdirSync(pathToRep);

const app = express();
app.use(express.static('static'));

// возвращать 404

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

// 3-rd) shows diff (don't check the merged commit (2 parents) yet)
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

// 4-th) repository contents (switch to branch exists)
// git ls-tree -r --name-only <hash> <path>
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

// 5-th) shows blob (no switch to branch yet)
app.get('/api/repos/:repositoryId/blob/:commitHash/:pathToFile', (req, res) => {
    // exec -> cat ./pathToFile
    // cat ./.git/objects/b9/6469de2a06092f8b4927899e1684e8e50f1ca8

    console.log('STEP 5');

    const repositoryId = req.params.repositoryId;
    const commitHash = req.params.commitHash;
    const pathToFile = req.params.pathToFile;

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
            // let fileContent = fs.readFileSync(`${pathToWalk}`);
            // res.send( fileContent );
            fs.readFile(`${pathToWalk}`, 'utf-8', (err, contents) => {
                if (err) console.log(err);
                console.log(contents);
                res.json( contents );
            });
            console.log('after calling readFile');
        }
    })
})

// 6-th) remove repository
// /api/repos/:repositoryId
app.delete('/api/repos/:repositoryId*', (req, res) => {
    console.log('STEP 6');

    const repositoryId = req.params.repositoryId;
    console.log(req.params);
    console.log(`repositoryId : ${repositoryId}`);

    let dirPath = getPathDeleteMethod(req);
    const moddedDirPath = dirPath.replace(/\//g, '\\');

    console.log(`pathToRep : ${pathToRep}`);
    console.log(`full dirPath : ${pathToRep}${moddedDirPath}`);

    fs.remove(`${pathToRep}${moddedDirPath}`, err => {
        console.error(err)
      })

})

// 7-th) git clone <url>
// таймаут для несуществующего url

// curl --write-out "%{http_code}\n" --silent --output /dev/null
// curl -L --write-out "%{http_code}\n" --silent --output /dev/null

app.listen(3000);

