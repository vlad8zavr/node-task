
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');

exports.showAllRepos = (req, res) => {
    //if (global.pathToRep)
    global.pathToRep && fs.readdir(global.pathToRep, (err, out) => {
        if (err) {
            console.log(err);
        }
        res.json({ data: out });
    })
}