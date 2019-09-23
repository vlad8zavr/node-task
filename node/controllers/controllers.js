
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
    console.log('[showAllCommits]');
    console.log(req.params);
    const {repositoryId, commitHash} = req.params;

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
    const {repositoryId, commitHash} = req.params;
    
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

    let commit = `${commitHash || 'master'}`;
    let param = `${pathParam || '.'}`;

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

exports.showBlob = (req, res) => {
    console.log('[showBlob]');
    const {repositoryId, commitHash, pathToFile} = req.params;
    console.log(`repositoryId : ${repositoryId}`);
    console.log(`commitHash : ${commitHash}`);
    console.log(`pathToFile : ${pathToFile}`);

    console.log(`modded pathToFile : ${pathToFile.replace(/ /g, '\\ ')}`);

    let result = '';

    let workerProcess = spawn('git', ['show', `${commitHash}:./${pathToFile.replace(/ /g, '\\ ')}`], {cwd: `${global.pathToRep}/${repositoryId}`});

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

    // exec(`git show ${commitHash}:"./${pathToFile}"`, {cwd: `${global.pathToRep}/${repositoryId}`}, (err, out) => {
    //     if (err) {
    //         console.log(err);
    //         res.json({ err });
    //     }
    //     else {
    //         res.send( out );
    //     }
    // })
}