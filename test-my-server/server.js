const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');

let progs = {
    list: "ls"
}

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
app.get('/api/repos', (req, res) => res.json({ contentsOfRep }));

// 2-nd) shows all commits
app.get('/api/repos/:repositoryId/commits/:commitHash', (req, res) => {

    console.log(req.params);
    // req.params - объект с параметрами из адресной строки

    // НО МНЕ НУЖНА КОМАНДА, КОТОРАЯ ВОЗВРАЩАЕТ СПИСОК КОМИТОВ В КОНКРЕТНОЙ ВЕТКЕ commitHash (branchName)
    exec('git log', {cwd: `${pathToRep}`}, (err, out) => {  
        if (err) {
            console.error(err);
            res.json({ err });
        }
        else {
            const arrayOfCommits = parseCommitList(out);
            res.json({ arrayOfCommits });
        }
    })

})
app.listen(3000);

function parseCommitList(out) {
    arrayOfCommits = [];
    out.split('commit').forEach(item => {
        if (item.trim() !== '') {
            let hash = item.split('Author')[0].trim();
            let date = item.split('Date:')[1].split('\n\n')[0].trim();
            let commit = item.split('Date:')[1].split('\n\n')[1].trim();
            arrayOfCommits.push({ hash: hash, commit: commit, date: date });
        }
    });
    return arrayOfCommits;
}

