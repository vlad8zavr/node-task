
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const { parseCommitList, parseRepositoryContent, getPathFromUrl, getPathDeleteMethod } = require('../parseResponse/parseResponse');

exports.showAllRepos = (req, res) => {
    global.pathToRep && fs.readdir(global.pathToRep, (err, out) => {
        if (err) {
            console.log(err);
        }
        res.json({ data: out });
    })
}

exports.showAllCommits = (req, res) => {
    const repositoryId = req.params.repositoryId;
    const commitHash = req.params.commitHash;

    let result = '';

    let workerProcess = spawn('git', ['--no-pager', 'log', '--pretty=format:"%H <><><> %ad ||| %s"', `${commitHash}`], {cwd: `${global.pathToRep}/${repositoryId}`});

    workerProcess.stdout.on('data', data => {
        result += data.toString();
    });

    workerProcess.stderr.on('data', err => {
        console.log('stderr: ' + err);
        res.json({ err });
    });

    workerProcess.on('close', code => {
        console.log(`Exit with code ${code}`);
        const arrayOfCommits = parseCommitList(result);
        res.send( arrayOfCommits );
    });
}

exports.showDiff = (req, res) => {
    const repositoryId = req.params.repositoryId;
    const commitHash = req.params.commitHash;
    
    let result = '';

    let workerProcess = spawn('git', ['diff', `${commitHash}^1..${commitHash}`], {cwd: `${global.pathToRep}/${repositoryId}`});

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
}

exports.showTree = (req, res) => {
    const { repositoryId, path: pathParam, commitHash } = req.params;
    console.log(`repositoryId : ${repositoryId}`);
    let commit = `${commitHash || 'master'}`;
    let param = `${pathParam || '.'}`;
    console.log(`commit : ${commit}`);
    console.log(`param : ${param}`);
    console.log('--------------------');

    let result = '';

    let workerProcess = spawn('git', ['ls-tree', '-r', '--name-only', `${commit}`, `${param}`], {cwd: `${global.pathToRep}/${repositoryId}`});

    workerProcess.stdout.on('data', data => {
        result += data.toString();
    });

    workerProcess.stderr.on('data', err => {
        console.log('stderr: ' + err);
        res.json({ err });
    });

    workerProcess.on('close', code => {
        console.log(`Exit with code ${code}`);
        let arrayOfFiles = parseRepositoryContent(result);
        res.send( arrayOfFiles );
    });
}