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
app.get('/api/repos/:repositoryId/tree/:commitHash*?/:path*?', (req, res) => {

    const repositoryId = req.params.repositoryId;
    const commitHash = req.params.commitHash;
    const path = req.params.path;

    const filepath = getPathFromUrl(req, repositoryId, commitHash, 'tree');
    const moddedFilePath = filepath.replace(/\//g, '\\');

    if (commitHash) {
        //exec(`git checkout`)
            // fs.readdirSync()
        exec(`git checkout ${commitHash}`, {cwd: `${pathToRep}/${repositoryId}`}, (err, out) => {
            if (err) {
                console.log(err);
                res.json({ err });
            }
            else {
                console.log('CHECKOUT WAS A SUCCESS');
                let pathToWalk = `${pathToRep}${repositoryId}\\${moddedFilePath}`;
                let contentsOfSmallRep = fs.readdirSync(`${pathToWalk}`);
                res.send( contentsOfSmallRep );
            }
        })
    }
    else {
        let pathToWalk = (filepath !== '') ? `${pathToRep}${repositoryId}\\${moddedFilePath}` : `${pathToRep}${repositoryId}`;
        let contentsOfSmallRep = fs.readdirSync(`${pathToWalk}`);
        res.send( contentsOfSmallRep );
    }

    // let pathToWalk = (filepath !== '') ? `${pathToRep}${repositoryId}\\${moddedFilePath}` : `${pathToRep}${repositoryId}`;
    // let contentsOfSmallRep = fs.readdirSync(`${pathToWalk}`);
    // res.send( contentsOfSmallRep );
    
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


app.listen(3000);

